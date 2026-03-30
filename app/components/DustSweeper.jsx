"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";

const CHAINS_CONFIG = [
  { id: "0x2105", name: "Base",      symbol: "ETH",  color: "#0052FF", moralisId: "0x2105", logo: "https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg", available: true },
  { id: "solana", name: "Solana",    symbol: "SOL",  color: "#9945FF", moralisId: null,     logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png", available: true, comingSoon: true },
  { id: "0x1",    name: "Ethereum",  symbol: "ETH",  color: "#627EEA", moralisId: "0x1",    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", available: false },
  { id: "0x38",   name: "BNB Chain", symbol: "BNB",  color: "#F3BA2F", moralisId: "0x38",   logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", available: false },
  { id: "0x89",   name: "Polygon",   symbol: "MATIC",color: "#8247E5", moralisId: "0x89",   logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png", available: false },
  { id: "0xa",    name: "Optimism",  symbol: "ETH",  color: "#FF0420", moralisId: "0xa",    logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png", available: false },
  { id: "0xa4b1", name: "Arbitrum",  symbol: "ARB",  color: "#28A0F0", moralisId: "0xa4b1", logo: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg", available: false },
  { id: "0xa86a", name: "Avalanche", symbol: "AVAX", color: "#E84142", moralisId: "0xa86a", logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png", available: false },
];

const OO_CHAIN_NAMES = {
  "0x1": "eth", "0x89": "polygon", "0x38": "bsc",
  "0xa4b1": "arbitrum", "0xa86a": "avax", "0x2105": "base", "0xa": "optimism"
};

const RECEIVE_TOKENS = {
  "0x2105": { symbol: "ETH",  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
};

const STARS = Array.from({ length: 36 }, (_, i) => ({
  id: i, top: `${(i * 37 + 11) % 60}%`, left: `${(i * 53 + 7) % 100}%`,
  size: i % 4 === 0 ? 2 : 1, opacity: ((i * 17 + 3) % 6) * 0.08 + 0.1,
}));

function TokenImg({ src, size = 28 }) {
  const [s, setS] = useState(src);
  useEffect(() => { setS(src); }, [src]);
  return (
    <img src={s} width={size} height={size}
      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: "#333" }}
      onError={() => setS(`https://ui-avatars.com/api/?name=?&size=${size}&background=333&color=fff&rounded=true`)}
    />
  );
}

export default function DustSweeper() {
  const { address: account } = useAppKitAccount();
  const [selectedChain, setSelectedChain] = useState(CHAINS_CONFIG[0]);
  const [threshold, setThreshold] = useState(5);
  const [customThreshold, setCustomThreshold] = useState("");
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [sweptResult, setSweptResult] = useState(null);
  const [receiveToken, setReceiveToken] = useState("native");

  const effectiveThreshold = customThreshold ? Number(customThreshold) : threshold;

  const handleScan = async () => {
    if (!account) { setError("Connect your wallet first"); return; }
    if (selectedChain.comingSoon) { setError("Solana Dust Sweeper coming soon!"); return; }
    setLoading(true); setError(null); setTokens([]); setSelectedTokens([]); setScanned(false);
    try {
      const res = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${account}/erc20?chain=${selectedChain.moralisId}&limit=500`,
        { headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY || "", "Accept": "application/json" } }
      );
      const data = await res.json();
      if (!data.result || data.result.length === 0) { setTokens([]); setScanned(true); setLoading(false); return; }

      const chainName = OO_CHAIN_NAMES[selectedChain.id] || "base";
      const addresses = data.result.map(t => t.token_address).slice(0, 30).join(",");
      let priceMap = {};
      try {
        const dexRes = await fetch(`https://api.dexscreener.com/tokens/v1/${chainName}/${addresses}`);
        const dexData = await dexRes.json();
        if (Array.isArray(dexData)) {
          dexData.forEach(pair => {
            if (pair.baseToken?.address && pair.priceUsd) {
              priceMap[pair.baseToken.address.toLowerCase()] = Number(pair.priceUsd);
            }
          });
        }
      } catch { }

      const tokensWithPrice = await Promise.all(
        data.result.map(async (token) => {
          const balance = Number(token.balance) / Math.pow(10, token.decimals);
          let priceUsd = priceMap[token.token_address.toLowerCase()] || 0;
          if (!priceUsd) {
            try {
              const priceRes = await fetch(
                `https://deep-index.moralis.io/api/v2.2/erc20/${token.token_address}/price?chain=${selectedChain.moralisId}`,
                { headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY || "" } }
              );
              const priceData = await priceRes.json();
              priceUsd = priceData.usdPrice || 0;
            } catch { priceUsd = 0; }
          }
          return {
            address: token.token_address,
            symbol: token.symbol,
            name: token.name,
            logo: token.logo || token.thumbnail || `https://dd.dexscreener.com/ds-data/tokens/${chainName}/${token.token_address}.png`,
            balance: balance.toFixed(6),
            priceUsd,
            valueUsd: balance * priceUsd,
            decimals: token.decimals,
          };
        })
      );

      const dustTokens = tokensWithPrice.filter(t => t.valueUsd > 0 && t.valueUsd <= effectiveThreshold);
      setTokens(dustTokens);
      setSelectedTokens(dustTokens.map(t => t.address));
      setScanned(true);
    } catch (e) {
      setError("Error: " + (e.message || "unknown"));
    }
    setLoading(false);
  };

  const handleSweep = async () => {
    if (!account) return;
    if (selectedTokens.length === 0) { setError("Please select at least one token."); return; }
    setSweeping(true); setError(null);
    const { sendSwapTransaction, approveToken } = await import("../lib/sendSwapTx");
    const chainIdNum = parseInt(selectedChain.id, 16);
    const receiveAddr = RECEIVE_TOKENS[selectedChain.id]?.address;
    let sweptCount = 0;
    let totalReceived = 0;
    for (const token of tokens.filter(t => selectedTokens.includes(t.address))) {
      try {
        const amountReadable = token.balance;
        const src = token.address;
        const dest = receiveAddr;
        try {
          const approveRes = await fetch(`/api/openocean?type=quote&chainId=${chainIdNum}&inTokenAddress=${src}&outTokenAddress=${dest}&amount=${amountReadable}&slippage=3&account=${account}`);
          const approveData = await approveRes.json();
          if (approveData?.data?.to) {
            await approveToken({ chainId: chainIdNum, tokenAddress: token.address, spenderAddress: approveData.data.to });
            await new Promise(r => setTimeout(r, 2000));
          }
        } catch { }
        const params = new URLSearchParams({ type: "quote", chainId: chainIdNum.toString(), inTokenAddress: src, outTokenAddress: dest, amount: amountReadable, slippage: "3", account });
        const res = await fetch(`/api/openocean?${params}`);
        const data = await res.json();
        if (data?.data?.to) {
          await sendSwapTransaction({ chainId: chainIdNum, to: data.data.to, data: data.data.data, value: data.data.value || "0", gas: data.data.estimatedGas });
          sweptCount++;
          totalReceived += token.valueUsd * 0.97;
        }
      } catch (e) { console.error(`Error swap ${token.symbol}:`, e); }
    }
    setSweeping(false);
    if (sweptCount > 0) {
      setSweptResult({ count: sweptCount, value: totalReceived.toFixed(2), receivedToken: RECEIVE_TOKENS[selectedChain.id]?.symbol });
    } else {
      setError("Sweep failed. Please try again.");
    }
  };

  const totalSelected = tokens.filter(t => selectedTokens.includes(t.address)).reduce((s, t) => s + t.valueUsd, 0);
  const estimatedReceive = totalSelected * 0.97;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes pg-pulse { 0%,100%{opacity:0.08} 50%{opacity:0.18} }
        .pg-nav-top-mobile{display:none;}
        .pg-nav-mobile{display:none;}
        @media(max-width:768px){
          .dust-coming-soon{display:none;}
          .dust-settings-grid{grid-template-columns:1fr !important;}
  .pg-nav-top-mobile{display:flex !important;position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(212,160,23,0.15);height:56px;align-items:center;justify-content:space-between;padding:0 16px;}
  .pg-nav-mobile{display:flex !important;position:fixed;bottom:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(212,160,23,0.15);height:64px;align-items:center;justify-content:space-around;padding:0 8px;}
  .pg-nav-mobile-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 16px;border-radius:12px;color:rgba(255,255,255,0.45);text-decoration:none;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;}
  .pg-nav-mobile-item.active{color:#D4A017;}
  .pg-nav-mobile-item span:first-child{font-size:20px;}
}
        .dust-card { background: rgba(12,8,3,0.9); border: 1px solid rgba(212,160,23,0.15); border-radius: 24px; padding: 20px 24px; backdrop-filter: blur(24px); }
        .dust-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 10px; }
        .chain-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); font-family: 'DM Sans',sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .chain-btn.active { border-color: rgba(212,160,23,0.4); background: rgba(212,160,23,0.1); color: #D4A017; }
        .chain-btn:hover:not(.disabled) { border-color: rgba(212,160,23,0.2); color: #fff; }
        .chain-btn.disabled { opacity: 0.4; cursor: not-allowed; }
        .thresh-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(212,160,23,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans',sans-serif; }
        .thresh-btn.active { border-color: #D4A017; background: rgba(212,160,23,0.12); color: #D4A017; }
        .scan-btn { width: 100%; padding: 16px; border-radius: 16px; border: none; background: linear-gradient(135deg,#D4A017,#F5C842); color: #0a0600; font-family: 'Cinzel',serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; }
        .scan-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .scan-btn:disabled { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.2); cursor: not-allowed; transform: none; }
        .token-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(212,160,23,0.06); cursor: pointer; }
        .token-row:last-child { border-bottom: none; }
        .sweep-btn { width: 100%; padding: 16px; border-radius: 16px; border: none; background: linear-gradient(135deg,#D4A017,#F5C842); color: #0a0600; font-family: 'Cinzel',serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 16px; }
        .sweep-btn:disabled { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.2); cursor: not-allowed; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "linear-gradient(180deg,#060408 0%,#0a0805 40%,#100c04 70%,#180e00 100%)" }}>
        {STARS.map(s => <div key={s.id} style={{ position: "absolute", width: s.size, height: s.size, background: "#fff", borderRadius: "50%", top: s.top, left: s.left, opacity: s.opacity }} />)}
        <div style={{ position: "absolute", bottom: 0, left: "8%", width: 0, height: 0, borderLeft: "130px solid transparent", borderRight: "130px solid transparent", borderBottom: "280px solid #120800" }} />
        <div style={{ position: "absolute", bottom: 170, left: "calc(8% + 10px)", width: 200, height: 110, background: "#ff4400", borderRadius: "50%", filter: "blur(50px)", opacity: 0.13, animation: "pg-pulse 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: 0, left: "40%", width: 0, height: 0, borderLeft: "210px solid transparent", borderRight: "210px solid transparent", borderBottom: "400px solid #150a00" }} />
        <div style={{ position: "absolute", bottom: 0, right: "5%", width: 0, height: 0, borderLeft: "160px solid transparent", borderRight: "160px solid transparent", borderBottom: "330px solid #120800" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(6,4,8,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,160,23,0.1)", height: 64, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 24px", gap: 16 }}>
        <a href="/swap" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png" style={{ width: 40, height: 40, objectFit: "contain" }} alt="Pangeon" />
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, background: "linear-gradient(135deg,#D4A017,#F5C842,#D4A017)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>PANGEON</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
<a href="/swap"    style={{ padding: "8px 16px", borderRadius: 12, color: "#ffffff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>⚡ Swap</a>
          <a href="/dust"    style={{ padding: "8px 16px", borderRadius: 12, color: "#D4A017", background: "rgba(212,160,23,0.08)", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>🧹 Sweep</a>
          <a href="/profile" style={{ padding: "8px 16px", borderRadius: 12, color: "#ffffff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>👤 Profile</a>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <appkit-button />
        </div>
      </nav>
{/* Mobile top navbar */}
<nav style={{ display: "none" }} className="pg-nav-top-mobile">
  <a href="/swap" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
    <img src="/logo.png" style={{ width: 32, height: 32, objectFit: "contain" }} alt="Pangeon" />
    <span style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, background: "linear-gradient(135deg,#D4A017,#F5C842)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>PANGEON</span>
  </a>
  <appkit-button />
</nav>

{/* Mobile bottom navbar */}
<nav style={{ display: "none" }} className="pg-nav-mobile">
  <a href="/swap" className="pg-nav-mobile-item">
    <span>⚡</span><span>Swap</span>
  </a>
  <a href="/dust" className="pg-nav-mobile-item active">
    <span>🧹</span><span>Sweep</span>
  </a>
  <a href="/profile" className="pg-nav-mobile-item">
    <span>👤</span><span>Profile</span>
  </a>
</nav>
      {/* Page content */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: 120, paddingBottom: 60, maxWidth: 860, margin: "0 auto", padding: "120px 24px 60px" }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 36, fontWeight: 700, background: "linear-gradient(135deg,#D4A017,#F5C842)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2, marginBottom: 8 }}>
            🧹 Dust Sweeper
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
            Scan and convert your dust tokens across all chains
          </div>
        </div>

        {/* Chain selection */}
        <div className="dust-card" style={{ marginBottom: 16 }}>
          
          {/* Available chains */}
          <div className="dust-label">Select chain</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {CHAINS_CONFIG.filter(c => c.available).map(c => (
              <button key={c.id}
                className={`chain-btn ${selectedChain.id === c.id ? "active" : ""} ${c.comingSoon ? "disabled" : ""}`}
                onClick={() => { if (!c.comingSoon) { setSelectedChain(c); setTokens([]); setScanned(false); } }}
              >
                <TokenImg src={c.logo} size={18} />
                {c.name}
                {c.comingSoon && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 20, background: "rgba(153,69,255,0.15)", color: "#9945FF", border: "1px solid rgba(153,69,255,0.3)", fontWeight: 600 }}>Soon</span>}
              </button>
            ))}
          </div>

{/* Coming soon chains */}
          <div style={{ borderTop: "1px solid rgba(212,160,23,0.08)", paddingTop: 16 }} className="dust-coming-soon">
            <div className="dust-label">Chain coming soon</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {CHAINS_CONFIG.filter(c => !c.available).map(c => (
                <button key={c.id} className="chain-btn disabled" disabled>
                  <TokenImg src={c.logo} size={18} />
                  {c.name}
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 20, background: "rgba(212,160,23,0.08)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.2)", fontWeight: 600 }}>Soon</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Threshold + Convert to */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="dust-settings-grid">
          <div className="dust-card">
            <div className="dust-label">Threshold (max value in $)</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[1, 5, 10, 50].map(v => (
                <button key={v} className={`thresh-btn ${threshold === v && !customThreshold ? "active" : ""}`} onClick={() => { setThreshold(v); setCustomThreshold(""); }}>
                  ${v}
                </button>
              ))}
              <input placeholder="Custom $..." value={customThreshold} onChange={e => setCustomThreshold(e.target.value)}
                style={{ width: 90, padding: "7px 10px", borderRadius: 10, border: `1px solid ${customThreshold ? "#D4A017" : "rgba(212,160,23,0.1)"}`, background: customThreshold ? "rgba(212,160,23,0.12)" : "transparent", color: customThreshold ? "#D4A017" : "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
            </div>
          </div>

          <div className="dust-card">
            <div className="dust-label">Convert to</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={`thresh-btn ${receiveToken === "native" ? "active" : ""}`} onClick={() => setReceiveToken("native")}>
                {RECEIVE_TOKENS[selectedChain.id]?.symbol || "Native"}
              </button>
              <button className={`thresh-btn ${receiveToken === "usdc" ? "active" : ""}`} onClick={() => setReceiveToken("usdc")}>USDC</button>
            </div>
          </div>
        </div>

        {/* Scan button */}
        <button className="scan-btn" onClick={handleScan} disabled={loading || !account || selectedChain.comingSoon} style={{ marginBottom: 16 }}>
          {loading ? "⟳ Scanning..." : selectedChain.comingSoon ? `${selectedChain.name} — Coming Soon` : `Scan on ${selectedChain.name}`}
        </button>

        {error && <div style={{ margin: "12px 0", padding: "12px 16px", borderRadius: 14, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff6b6b", fontSize: 13 }}>{error}</div>}

        {/* Results */}
        {scanned && !sweptResult && (
          <div className="dust-card">
            {tokens.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
                <div style={{ fontFamily: "'Cinzel',serif", color: "#D4A017", fontSize: 16, fontWeight: 600 }}>Your wallet is clean on {selectedChain.name}!</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 8 }}>No dust found under ${effectiveThreshold}</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Cinzel',serif", color: "#D4A017", fontSize: 15, fontWeight: 600 }}>{tokens.length} dust token(s) found</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setSelectedTokens(tokens.map(t => t.address))} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(212,160,23,0.2)", background: "transparent", color: "#D4A017", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>All</button>
                    <button onClick={() => setSelectedTokens([])} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>None</button>
                  </div>
                </div>
                {tokens.map(t => (
                  <div key={t.address} className="token-row" onClick={() => setSelectedTokens(prev => prev.includes(t.address) ? prev.filter(a => a !== t.address) : [...prev, t.address])}>
                    <input type="checkbox" checked={selectedTokens.includes(t.address)} onChange={() => {}} style={{ accentColor: "#D4A017", width: 16, height: 16, flexShrink: 0 }} />
                    <TokenImg src={t.logo} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{t.symbol}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{t.balance} tokens</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "rgba(212,160,23,0.8)", fontWeight: 600 }}>${t.valueUsd.toFixed(3)}</div>
                    </div>
                  </div>
                ))}
                {selectedTokens.length > 0 && (
                  <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 14, background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.12)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                      <span>Selected tokens</span><span style={{ color: "#fff" }}>{selectedTokens.length}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                      <span>Total value</span><span style={{ color: "#fff" }}>${totalSelected.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                      <span>Fees (3%)</span><span style={{ color: "#ff6b6b" }}>-${(totalSelected * 0.03).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, borderTop: "1px solid rgba(212,160,23,0.1)", paddingTop: 8, marginTop: 4 }}>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>You will receive ≈</span>
                      <span style={{ color: "#D4A017" }}>${estimatedReceive.toFixed(2)} in {receiveToken === "native" ? RECEIVE_TOKENS[selectedChain.id]?.symbol : "USDC"}</span>
                    </div>
                  </div>
                )}
                <button className="sweep-btn" onClick={handleSweep} disabled={sweeping || selectedTokens.length === 0}>
                  {sweeping ? "⟳ Sweeping..." : `🧹 Sweep ${selectedTokens.length} token(s)`}
                </button>
              </>
            )}
          </div>
        )}

        {sweptResult && (
          <div className="dust-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 20, fontWeight: 700, color: "#D4A017", marginBottom: 8 }}>Sweep successful!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>{sweptResult.count} tokens swapped to {sweptResult.receivedToken}</div>
            <div style={{ fontSize: 15, color: "#00c878", fontWeight: 600, marginBottom: 20 }}>Value recovered: ~${sweptResult.value}</div>
            <button onClick={() => { setSweptResult(null); setTokens([]); setScanned(false); }} style={{ padding: "10px 24px", borderRadius: 12, border: "1px solid rgba(212,160,23,0.3)", background: "rgba(212,160,23,0.08)", color: "#D4A017", fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              New Sweep
            </button>
          </div>
        )}
      </div>
    </div>
  );
}