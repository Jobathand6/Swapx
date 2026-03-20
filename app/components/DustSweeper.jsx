"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "demo",
});

import { ethereum, polygon, bsc, arbitrum, avalanche, base, optimism } from "thirdweb/chains";

const CHAINS_CONFIG = [
  { id: "solana", name: "Solana",   symbol: "SOL", moralisId: "solana",   color: "#9945FF", chain: null, logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  { id: 1,      name: "Ethereum",  symbol: "ETH",  moralisId: "eth",       color: "#627EEA", chain: ethereum,  logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { id: 137,    name: "Polygon",   symbol: "MATIC", moralisId: "polygon",  color: "#8247E5", chain: polygon,   logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png" },
  { id: 56,     name: "BNB Chain", symbol: "BNB",  moralisId: "bsc",       color: "#F3BA2F", chain: bsc,       logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  { id: 42161,  name: "Arbitrum",  symbol: "ETH",  moralisId: "arbitrum",  color: "#28A0F0", chain: arbitrum,  logo: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg" },
  { id: 43114,  name: "Avalanche", symbol: "AVAX", moralisId: "avalanche", color: "#E84142", chain: avalanche, logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  { id: 8453,   name: "Base",      symbol: "ETH",  moralisId: "base",      color: "#0052FF", chain: base,      logo: "https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg" },
  { id: 10,     name: "Optimism",  symbol: "ETH",  moralisId: "optimism",  color: "#FF0420", chain: optimism,  logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png" },
];

function TokenLogo({ src, size = 28 }) {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => { setImgSrc(src); }, [src]);
  return (
    <img src={imgSrc} width={size} height={size}
      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: "#333" }}
      onError={() => setImgSrc(`https://ui-avatars.com/api/?name=?&size=${size}&background=333&color=fff&rounded=true`)}
    />
  );
}

export default function DustSweeper({ onClose }) {
  const account = useActiveAccount();
  const [selectedChain, setSelectedChain] = useState(CHAINS_CONFIG[0]);
  const [threshold, setThreshold] = useState(5);
  const [customThreshold, setCustomThreshold] = useState("");
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sweptResult, setSweptResult] = useState(null);
  const [error, setError] = useState(null);
  const [targetToken, setTargetToken] = useState("ETH");
  const [scanned, setScanned] = useState(false);

  const effectiveThreshold = customThreshold ? Number(customThreshold) : threshold;

  const scanWallet = async () => {
    if (!account) { setError("Connecte ton wallet d'abord !"); return; }
    setLoading(true);
    setError(null);
    setTokens([]);
    setSelectedTokens([]);
    setScanned(false);

    try {
      const res = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${account.address}/erc20?chain=${selectedChain.moralisId}&limit=100`,
        { headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY, "Accept": "application/json" } }
      );
      const data = await res.json();

      if (!data.result || data.result.length === 0) {
        setTokens([]);
        setScanned(true);
        setLoading(false);
        return;
      }

      const tokensWithPrice = await Promise.all(
        data.result.map(async (token) => {
          try {
            const priceRes = await fetch(
              `https://deep-index.moralis.io/api/v2.2/erc20/${token.token_address}/price?chain=${selectedChain.moralisId}`,
              { headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY } }
            );
            const priceData = await priceRes.json();
            const priceUsd = priceData.usdPrice || 0;
            const balance = Number(token.balance) / Math.pow(10, token.decimals);
            const valueUsd = balance * priceUsd;
            return {
              address: token.token_address,
              symbol: token.symbol,
              name: token.name,
              logo: token.logo || token.thumbnail,
              balance: balance.toFixed(6),
              priceUsd,
              valueUsd,
              decimals: token.decimals,
            };
          } catch {
            const balance = Number(token.balance) / Math.pow(10, token.decimals);
            return {
              address: token.token_address,
              symbol: token.symbol,
              name: token.name,
              logo: token.logo || token.thumbnail,
              balance: balance.toFixed(6),
              priceUsd: 0,
              valueUsd: 0,
              decimals: token.decimals,
            };
          }
        })
      );

      const dustTokens = tokensWithPrice
        .filter(t => t.valueUsd > 0 && t.valueUsd <= effectiveThreshold)
        .sort((a, b) => b.valueUsd - a.valueUsd);

      setTokens(dustTokens);
      setSelectedTokens(dustTokens.map(t => t.address));
      setScanned(true);
    } catch (e) {
      console.error("Scan error:", e);
      setError("Erreur : " + (e.message || "inconnue"));
    }
    setLoading(false);
  };

  const toggleToken = (address) => {
    setSelectedTokens(prev =>
      prev.includes(address) ? prev.filter(a => a !== address) : [...prev, address]
    );
  };

  const selectedTokensData = tokens.filter(t => selectedTokens.includes(t.address));
  const totalValue = selectedTokensData.reduce((sum, t) => sum + t.valueUsd, 0);

  const handleSweep = async () => {
    if (selectedTokens.length === 0) { setError("Sélectionne au moins un token."); return; }
    if (!account) { setError("Connecte ton wallet d'abord !"); return; }
    setSweeping(true);
    setError(null);

    let successCount = 0;
    let totalSwapped = 0;

    for (const tokenAddress of selectedTokens) {
      const token = tokens.find(t => t.address === tokenAddress);
      if (!token) continue;

      try {
        const sellAmount = BigInt(Math.floor(Number(token.balance) * Math.pow(10, token.decimals))).toString();
        const buyToken = targetToken === "ETH" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : targetToken;

        const params = new URLSearchParams({
          chainId: selectedChain.id.toString(),
          sellToken: token.address,
          buyToken,
          sellAmount,
          taker: account.address,
        });

        const res = await fetch(`/api/dust?${params}`);
        const quote = await res.json();

        if (quote?.transaction) {
          const { sendTransaction, prepareTransaction } = await import("thirdweb");
          const prepared = prepareTransaction({
            to: quote.transaction.to,
            data: quote.transaction.data,
            value: quote.transaction.value ? BigInt(quote.transaction.value) : 0n,
            chain: selectedChain.chain,
            client,
          });
          await sendTransaction({ account, transaction: prepared });
          successCount++;
          totalSwapped += token.valueUsd;
        }
      } catch (e) {
        console.error(`Erreur swap ${token.symbol}:`, e);
      }
    }

    setSweptResult({
      count: successCount,
      totalValue: totalSwapped.toFixed(2),
      receivedToken: targetToken,
      estimatedReceived: (totalSwapped * 0.97).toFixed(6),
    });
    setSweeping(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        .dust-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(6px); }
        .dust-modal { background: rgba(12,8,3,0.98); border: 1px solid rgba(212,160,23,0.2); border-radius: 24px; width: 100%; max-width: 540px; max-height: 88vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.8); font-family: 'DM Sans', sans-serif; scrollbar-width: none; }
        .dust-modal::-webkit-scrollbar { display: none; }
        .dust-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid rgba(212,160,23,0.1); position: sticky; top: 0; background: rgba(12,8,3,0.98); z-index: 10; }
        .dust-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: #D4A017; letter-spacing: 1px; }
        .dust-close { width: 32px; height: 32px; border-radius: 8px; border: none; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .dust-close:hover { background: rgba(255,80,80,0.1); color: #ff6b6b; }
        .dust-body { padding: 20px 24px; }
        .dust-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 10px; }
        .dust-section { margin-bottom: 18px; }
        .chain-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .chain-pill { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; font-size: 10px; font-family: 'DM Sans', sans-serif; font-weight: 600; }
        .chain-pill.active { border-color: var(--cc); background: color-mix(in srgb, var(--cc) 15%, transparent); color: var(--cc); }
        .threshold-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .threshold-btn { padding: 7px 14px; border-radius: 10px; border: 1px solid rgba(212,160,23,0.12); background: transparent; color: rgba(255,255,255,0.45); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .threshold-btn.active { border-color: #D4A017; background: rgba(212,160,23,0.1); color: #D4A017; }
        .threshold-input { padding: 7px 12px; border-radius: 10px; border: 1px solid rgba(212,160,23,0.12); background: rgba(212,160,23,0.04); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 12px; width: 110px; outline: none; }
        .threshold-input::placeholder { color: rgba(255,255,255,0.2); }
        .target-row { display: flex; gap: 6px; }
        .target-btn { padding: 7px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); background: transparent; color: rgba(255,255,255,0.45); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .target-btn.active { border-color: #D4A017; background: rgba(212,160,23,0.1); color: #D4A017; }
        .scan-btn { width: 100%; padding: 14px; border-radius: 16px; border: none; background: linear-gradient(135deg, #D4A017, #F5C842); color: #0a0600; font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; margin-bottom: 16px; }
        .scan-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .scan-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .tokens-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .tokens-count { font-size: 12px; color: rgba(255,255,255,0.4); }
        .select-btns { display: flex; gap: 6px; }
        .select-btn { padding: 4px 10px; border-radius: 7px; border: 1px solid rgba(212,160,23,0.2); background: transparent; color: rgba(212,160,23,0.6); font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .select-btn:hover { background: rgba(212,160,23,0.08); }
        .token-list { display: flex; flex-direction: column; gap: 5px; max-height: 220px; overflow-y: auto; margin-bottom: 14px; scrollbar-width: thin; scrollbar-color: rgba(212,160,23,0.2) transparent; }
        .dust-token-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.15s; }
        .dust-token-item:hover { border-color: rgba(212,160,23,0.2); }
        .dust-token-item.selected { border-color: rgba(212,160,23,0.25); background: rgba(212,160,23,0.05); }
        .checkbox { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid rgba(212,160,23,0.3); background: transparent; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .checkbox.checked { background: #D4A017; border-color: #D4A017; }
        .token-sym { font-weight: 700; font-size: 13px; color: #fff; }
        .token-bal { font-size: 10px; color: rgba(255,255,255,0.3); }
        .token-val { font-size: 12px; font-weight: 600; color: rgba(212,160,23,0.8); }
        .summary-box { background: rgba(212,160,23,0.05); border: 1px solid rgba(212,160,23,0.12); border-radius: 14px; padding: 12px 16px; margin-bottom: 14px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 5px; }
        .summary-row:last-child { margin-bottom: 0; color: rgba(255,255,255,0.6); font-weight: 600; }
        .summary-row span:last-child { color: #D4A017; }
        .sweep-btn { width: 100%; padding: 16px; border-radius: 16px; border: none; background: linear-gradient(135deg, #D4A017, #F5C842); color: #0a0600; font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; }
        .sweep-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(212,160,23,0.25); }
        .sweep-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .empty-state { text-align: center; padding: 28px 20px; color: rgba(255,255,255,0.3); font-size: 13px; }
        .error-box { padding: 10px 14px; border-radius: 12px; background: rgba(255,80,80,0.07); border: 1px solid rgba(255,80,80,0.18); color: #ff6b6b; font-size: 12px; margin-bottom: 12px; }
        .success-box { text-align: center; padding: 28px 20px; }
        .success-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: #D4A017; margin: 10px 0 6px; }
        .success-amount { font-size: 26px; font-weight: 700; color: #fff; margin: 10px 0; font-family: 'Cinzel', serif; }
      `}</style>

      <div className="dust-overlay" onClick={onClose}>
        <div className="dust-modal" onClick={e => e.stopPropagation()}>

          <div className="dust-header">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22}}>🧹</span>
              <span className="dust-title">Dust Sweeper</span>
            </div>
            <button className="dust-close" onClick={onClose}>✕</button>
          </div>

          <div className="dust-body">
            {sweptResult ? (
              <div className="success-box">
                <div style={{fontSize:48}}>🎉</div>
                <div className="success-title">Sweep réussi !</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.45)"}}>{sweptResult.count} tokens swappés vers {sweptResult.receivedToken}</div>
                <div className="success-amount">{sweptResult.estimatedReceived} {sweptResult.receivedToken}</div>
                <div style={{fontSize:12,color:"rgba(212,160,23,0.6)",marginBottom:20}}>Valeur récupérée : ${sweptResult.totalValue}</div>
                <button className="scan-btn" onClick={() => { setSweptResult(null); setTokens([]); setScanned(false); }}>
                  Nouveau Sweep 🧹
                </button>
              </div>
            ) : (
              <>
                {/* Chaîne */}
                <div className="dust-section">
                  <div className="dust-label">Chaîne à scanner</div>
                  <div className="chain-grid">
                    {CHAINS_CONFIG.map(c => (
                      <button key={c.id} className={`chain-pill ${selectedChain.id === c.id ? "active" : ""}`}
                        style={{"--cc": c.color}}
                        onClick={() => { setSelectedChain(c); setTokens([]); setScanned(false); setError(null); }}>
                        <img src={c.logo} width={18} height={18} style={{borderRadius:"50%"}} onError={e=>e.target.style.display="none"} />
                        {c.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seuil */}
                <div className="dust-section">
                  <div className="dust-label">Seuil (valeur max en $)</div>
                  <div className="threshold-row">
                    {[1, 5, 10, 50].map(v => (
                      <button key={v} className={`threshold-btn ${threshold === v && !customThreshold ? "active" : ""}`}
                        onClick={() => { setThreshold(v); setCustomThreshold(""); }}>
                        &lt; ${v}
                      </button>
                    ))}
                    <input className="threshold-input" type="number" placeholder="$ perso..." value={customThreshold}
                      onChange={e => setCustomThreshold(e.target.value)} />
                  </div>
                </div>

                {/* Token cible */}
                <div className="dust-section">
                  <div className="dust-label">Convertir vers</div>
                  <div className="target-row">
                    {[selectedChain.symbol, "USDC", "USDT"].filter((v,i,a) => a.indexOf(v)===i).map(t => (
                      <button key={t} className={`target-btn ${targetToken === t ? "active" : ""}`} onClick={() => setTargetToken(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                {error && <div className="error-box">{error}</div>}

                <button className="scan-btn" onClick={scanWallet} disabled={loading || !account}>
                  {loading ? "⟳ Scan en cours..." : account ? `🔍 Scanner sur ${selectedChain.name}` : "Connecte ton wallet d'abord"}
                </button>

                {scanned && tokens.length === 0 && (
                  <div className="empty-state">
                    <div style={{fontSize:36,marginBottom:8}}>✨</div>
                    <div>Aucun dust trouvé sous ${effectiveThreshold} !</div>
                    <div style={{fontSize:11,marginTop:4}}>Ton wallet est propre sur {selectedChain.name} 🎉</div>
                  </div>
                )}

                {tokens.length > 0 && (
                  <>
                    <div className="tokens-header">
                      <span className="tokens-count">{tokens.length} token(s) dust trouvé(s)</span>
                      <div className="select-btns">
                        <button className="select-btn" onClick={() => setSelectedTokens(tokens.map(t=>t.address))}>Tout</button>
                        <button className="select-btn" onClick={() => setSelectedTokens([])}>Aucun</button>
                      </div>
                    </div>

                    <div className="token-list">
                      {tokens.map(token => (
                        <div key={token.address} className={`dust-token-item ${selectedTokens.includes(token.address) ? "selected" : ""}`}
                          onClick={() => toggleToken(token.address)}>
                          <div className={`checkbox ${selectedTokens.includes(token.address) ? "checked" : ""}`}>
                            {selectedTokens.includes(token.address) && <span style={{color:"#0a0600",fontSize:11,fontWeight:800}}>✓</span>}
                          </div>
                          <TokenLogo src={token.logo} size={30} />
                          <div style={{flex:1}}>
                            <div className="token-sym">{token.symbol}</div>
                            <div className="token-bal">{token.balance}</div>
                          </div>
                          <div className="token-val">${token.valueUsd.toFixed(4)}</div>
                        </div>
                      ))}
                    </div>

                    {selectedTokens.length > 0 && (
                      <>
                        <div className="summary-box">
                          <div className="summary-row"><span>Tokens sélectionnés</span><span>{selectedTokens.length}</span></div>
                          <div className="summary-row"><span>Valeur totale</span><span>${totalValue.toFixed(2)}</span></div>
                          <div className="summary-row"><span>Frais (3%)</span><span>-${(totalValue*0.03).toFixed(4)}</span></div>
                          <div className="summary-row"><span>Tu recevras ≈</span><span>{(totalValue*0.97).toFixed(6)} {targetToken}</span></div>
                        </div>
                        <button className="sweep-btn" onClick={handleSweep} disabled={sweeping}>
                          {sweeping ? "⟳ Sweep en cours..." : `🧹 Sweeper ${selectedTokens.length} token(s) → ${targetToken}`}
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
