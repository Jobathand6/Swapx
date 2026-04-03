"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const LEVELS = [
  { name: "Fossil",  emoji: "🪨", min: 0,     max: 49,       color: "#8B7355", bg: "rgba(139,115,85,0.15)",  desc: "Complete your first swap to start the adventure." },
  { name: "Egg",     emoji: "🥚", min: 50,    max: 499,      color: "#C8B89A", bg: "rgba(200,184,154,0.15)", desc: "50 swaps done. Something is hatching..." },
  { name: "Reptile", emoji: "🦎", min: 500,   max: 1999,     color: "#4CAF50", bg: "rgba(76,175,80,0.15)",   desc: "500 swaps. You are evolving fast!" },
  { name: "Raptor",  emoji: "🦴", min: 2000,  max: 4999,     color: "#2196F3", bg: "rgba(33,150,243,0.15)",  desc: "2000 swaps. A fearsome predator." },
  { name: "Rex",     emoji: "🦖", min: 5000,  max: 9999,     color: "#FF5722", bg: "rgba(255,87,34,0.15)",   desc: "5000 swaps. You dominate the chain." },
  { name: "Pangean", emoji: "🌋", min: 10000, max: Infinity, color: "#D4A017", bg: "rgba(212,160,23,0.15)",  desc: "10000 swaps. You have reached the top of Pangea." },
];

function getLevel(n) { return LEVELS.find(l => n >= l.min && n <= l.max) || LEVELS[0]; }
function getProgress(n) { const l = getLevel(n); if (l.max === Infinity) return 100; return Math.floor(((n - l.min) / (l.max - l.min + 1)) * 100); }
function getNextLevel(n) { const i = LEVELS.findIndex(l => n >= l.min && n <= l.max); return i < LEVELS.length - 1 ? LEVELS[i + 1] : null; }

const STARS = Array.from({ length: 36 }, (_, i) => ({
  id: i, top: `${(i * 37 + 11) % 60}%`, left: `${(i * 53 + 7) % 100}%`,
  size: i % 4 === 0 ? 2 : 1, opacity: ((i * 17 + 3) % 6) * 0.08 + 0.1,
}));

function TokenLogo({ src, size = 28 }) {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => { setImgSrc(src); }, [src]);
  return (
    <img src={imgSrc} width={size} height={size}
      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: "#222" }}
      onError={() => setImgSrc(`https://ui-avatars.com/api/?name=?&size=${size}&background=333&color=fff&rounded=true`)}
      alt="" />
  );
}

export default function ProfilePage() {
const { publicKey } = useWallet();
const reownAddress = publicKey?.toString() || null;
const caipAddress = reownAddress ? `solana:mainnet:${reownAddress}` : null;
const { address: evmAddress } = useAccount();
const isSolanaConnected = caipAddress?.startsWith("solana:");
const solanaAddress = isSolanaConnected ? reownAddress : null;
const address = evmAddress || reownAddress;

  const [swapCount,  setSwapCount]  = useState(0);
  const [swapVolume, setSwapVolume] = useState(0);
  const [dustVolume, setDustVolume] = useState(0);
  const [portfolio,  setPortfolio]  = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  useEffect(() => {
    const sc = localStorage.getItem("pangeon_swap_count");
    const sv = localStorage.getItem("pangeon_swap_volume");
    const dv = localStorage.getItem("pangeon_dust_volume");
    if (sc) setSwapCount(parseInt(sc));
    if (sv) setSwapVolume(parseFloat(sv));
    if (dv) setDustVolume(parseFloat(dv));
  }, []);

useEffect(() => {
  if (!address) { setPortfolio([]); return; }
  const fetchPortfolio = async () => {
    setPortfolioLoading(true);
    try {
      const tokens = [];

      if (isSolanaConnected && solanaAddress) {
        // Fetch SOL balance
        const solRes = await fetch("https://mainnet.helius-rpc.com/?api-key=b82f7243-5b22-44ae-a3d4-d5869d9c5334", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [solanaAddress] }),
        });
        const solData = await solRes.json();
        if (solData.result?.value !== undefined) {
          tokens.push({
            symbol: "SOL", name: "Solana",
            logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
            balance: (solData.result.value / 1e9).toFixed(4),
            valueUsd: 0,
          });
        }

        // Fetch SPL tokens
        const splRes = await fetch("https://mainnet.helius-rpc.com/?api-key=b82f7243-5b22-44ae-a3d4-d5869d9c5334", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 2,
            method: "getTokenAccountsByOwner",
            params: [solanaAddress, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed" }]
          }),
        });
        const splData = await splRes.json();
        if (splData.result?.value) {
          for (const acc of splData.result.value) {
            const info = acc.account.data.parsed.info;
            const balance = Number(info.tokenAmount.uiAmount);
            if (balance <= 0) continue;
            const mint = info.mint;
            let symbol = mint.slice(0, 6) + "...", name = "Unknown", logo = "";
            try {
              const dexRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${mint}`);
              const dexData = await dexRes.json();
              if (Array.isArray(dexData) && dexData.length > 0) {
                symbol = dexData[0].baseToken?.symbol || symbol;
                name = dexData[0].baseToken?.name || name;
                logo = dexData[0].info?.imageUrl || "";
              }
            } catch (e) { }
            tokens.push({ symbol, name, logo, balance: balance.toFixed(4), valueUsd: 0 });
          }
        }
      } else {
        // Fetch EVM tokens (Base)
        const chainHex = "0x2105";
        const res = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${chainHex}`, {
          headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY || "" },
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.result || []);

        const nativeRes = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/balance?chain=${chainHex}`, {
          headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY || "" },
        });
        const nativeData = await nativeRes.json();

        if (nativeData.balance) {
          tokens.push({
            symbol: "ETH", name: "Ethereum",
            logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
            balance: (Number(nativeData.balance) / 1e18).toFixed(4),
            valueUsd: 0,
          });
        }
        list.forEach(t => {
          const bal = Number(t.balance) / Math.pow(10, Number(t.decimals));
          if (bal > 0) {
            tokens.push({
              symbol: t.symbol, name: t.name,
              logo: t.logo || `https://dd.dexscreener.com/ds-data/tokens/base/${t.token_address}.png`,
              balance: bal.toFixed(4), valueUsd: 0,
            });
          }
        });
      }

      setPortfolio(tokens);
    } catch (e) { }
    setPortfolioLoading(false);
  };
  fetchPortfolio();
}, [address, isSolanaConnected, solanaAddress]);
        

  const currentLevel = getLevel(swapCount);
  const progress     = getProgress(swapCount);
  const nextLevel    = getNextLevel(swapCount);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        body { background: #060408; }
        @media(max-width:768px){
  .prof-grid{grid-template-columns:1fr !important;}
}
        .pg-nav-top-mobile{display:none;}
.pg-nav-mobile{display:none;}
@media(max-width:768px){
  .pg-nav-top-mobile{display:flex !important;position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(212,160,23,0.15);height:56px;align-items:center;justify-content:space-between;padding:0 16px;}
  .pg-nav-mobile{display:flex !important;position:fixed;bottom:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(212,160,23,0.15);height:64px;align-items:center;justify-content:space-around;padding:0 8px;}
  .pg-nav-mobile-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 16px;border-radius:12px;color:rgba(255,255,255,0.45);text-decoration:none;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;}
  .pg-nav-mobile-item.active{color:#D4A017;}
  .pg-nav-mobile-item span:first-child{font-size:20px;}
}
        .prof-card { background: rgba(12,8,3,0.9); border: 1px solid rgba(212,160,23,0.15); border-radius: 24px; padding: 24px; backdrop-filter: blur(24px); }
        .prof-stat { background: rgba(20,14,6,0.9); border: 1px solid rgba(212,160,23,0.08); border-radius: 16px; padding: 16px 20px; flex: 1; text-align: center; }
        .prof-level-item { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px; border: 1px solid; margin-bottom: 8px; }
        .prof-level-item:last-child { margin-bottom: 0; }
        .port-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(212,160,23,0.06); }
        .port-item:last-child { border-bottom: none; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "linear-gradient(180deg,#060408 0%,#0a0805 40%,#100c04 70%,#180e00 100%)" }}>
        {STARS.map(s => <div key={s.id} style={{ position: "absolute", width: s.size, height: s.size, background: "#fff", borderRadius: "50%", top: s.top, left: s.left, opacity: s.opacity }} />)}
        <div style={{ position: "absolute", bottom: 0, left: "8%", width: 0, height: 0, borderLeft: "130px solid transparent", borderRight: "130px solid transparent", borderBottom: "280px solid #120800" }} />
        <div style={{ position: "absolute", bottom: 170, left: "calc(8% + 10px)", width: 200, height: 110, background: "#ff4400", borderRadius: "50%", filter: "blur(50px)", opacity: 0.13 }} />
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
          <a href="/dust"    style={{ padding: "8px 16px", borderRadius: 12, color: "#ffffff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>🧹 Sweep</a>
          <a href="/profile" style={{ padding: "8px 16px", borderRadius: 12, color: "#D4A017", background: "rgba(212,160,23,0.08)", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>👤 Profile</a>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ConnectButton.Custom>
  {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
    const connected = mounted && account && chain;
    return (
      <div style={{ zIndex: 100 }}>
        {!connected ? (
          <button onClick={openConnectModal} style={{ padding: "8px 18px", borderRadius: 12, background: "linear-gradient(135deg,#D4A017,#F5C842)", border: "none", color: "#0a0600", fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Connect Wallet
          </button>
        ) : (
          <button onClick={openAccountModal} style={{ padding: "8px 18px", borderRadius: 12, background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {account.displayName}
          </button>
        )}
      </div>
    );
  }}
</ConnectButton.Custom>
        </div>
      </nav>
{/* Mobile top navbar */}
<nav style={{ display: "none" }} className="pg-nav-top-mobile">
  <a href="/swap" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
    <img src="/logo.png" style={{ width: 32, height: 32, objectFit: "contain" }} alt="Pangeon" />
    <span style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, background: "linear-gradient(135deg,#D4A017,#F5C842)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>PANGEON</span>
  </a>
  <ConnectButton.Custom>
  {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
    const connected = mounted && account && chain;
    return (
      <div style={{ zIndex: 100 }}>
        {!connected ? (
          <button onClick={openConnectModal} style={{ padding: "8px 18px", borderRadius: 12, background: "linear-gradient(135deg,#D4A017,#F5C842)", border: "none", color: "#0a0600", fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Connect Wallet
          </button>
        ) : (
          <button onClick={openAccountModal} style={{ padding: "8px 18px", borderRadius: 12, background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {account.displayName}
          </button>
        )}
      </div>
    );
  }}
</ConnectButton.Custom>
</nav>

{/* Mobile bottom navbar */}
<nav style={{ display: "none" }} className="pg-nav-mobile">
  <a href="/swap" className="pg-nav-mobile-item">
    <span>⚡</span><span>Swap</span>
  </a>
  <a href="/dust" className="pg-nav-mobile-item">
    <span>🧹</span><span>Sweep</span>
  </a>
  <a href="/profile" className="pg-nav-mobile-item active">
    <span>👤</span><span>Profile</span>
  </a>
</nav>
      {/* Contenu */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: 90, paddingBottom: 60, maxWidth: 1100, margin: "0 auto", padding: "130px 24px 60px" }}>

        {/* Layout 2 colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }} className="prof-grid">

          {/* Colonne gauche */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Carte niveau */}
            <div className="prof-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 72, marginBottom: 8 }}>{currentLevel.emoji}</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 24, fontWeight: 700, color: currentLevel.color, marginBottom: 4 }}>{currentLevel.name}</div>
              {shortAddress && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", background: "rgba(212,160,23,0.06)", padding: "4px 12px", borderRadius: 8, display: "inline-block", marginBottom: 16 }}>{shortAddress}</div>
              )}

              {/* Progression */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 600, color: "#D4A017" }}>Progression</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{swapCount} swaps</span>
                </div>
                <div style={{ width: "100%", height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", borderRadius: 5, width: `${progress}%`, background: `linear-gradient(90deg,${currentLevel.color},${nextLevel ? nextLevel.color : currentLevel.color})`, transition: "width 0.5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  <span>{currentLevel.name} ({currentLevel.min})</span>
                  <span style={{ color: currentLevel.color, fontWeight: 600 }}>{progress}%</span>
                  <span>{nextLevel ? `${nextLevel.name} (${nextLevel.min})` : "MAX"}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12 }}>
              <div className="prof-stat">
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Swaps</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 24, fontWeight: 700, color: "#D4A017" }}>{swapCount}</div>
              </div>
              <div className="prof-stat">
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Swap Volume</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 24, fontWeight: 700, color: "#D4A017" }}>${swapVolume.toFixed(2)}</div>
              </div>
              <div className="prof-stat">
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Dust Volume</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 24, fontWeight: 700, color: "#D4A017" }}>${dustVolume.toFixed(2)}</div>
              </div>
            </div>


          </div>

          {/* Colonne droite — Portfolio */}
          <div className="prof-card" style={{ position: "sticky", top: 90 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 600, color: "#D4A017", marginBottom: 16 }}>Portfolio</div>

            {!address && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                Connect your wallet to see your portfolio
              </div>
            )}

            {address && portfolioLoading && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                ⟳ Loading...
              </div>
            )}

            {address && !portfolioLoading && portfolio.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                No tokens found on Base
              </div>
            )}

            {portfolio.map((t, i) => (
              <div key={i} className="port-item">
                <TokenLogo src={t.logo} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{t.symbol}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "rgba(212,160,23,0.8)", fontWeight: 600 }}>{t.balance}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}