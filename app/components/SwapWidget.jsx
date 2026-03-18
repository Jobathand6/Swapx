"use client";

import { useState, useEffect } from "react";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { ethereum, polygon, bsc } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "demo",
});

const CHAINS = [
  { id: 1,   name: "Ethereum", shortName: "ETH",  color: "#627EEA", chain: ethereum },
  { id: 137, name: "Polygon",  shortName: "MATIC", color: "#8247E5", chain: polygon },
  { id: 56,  name: "BNB Chain",shortName: "BNB",  color: "#F3BA2F", chain: bsc },
];

const TOKENS_BY_CHAIN = {
  1: [
    { symbol: "ETH",  name: "Ethereum",   decimals: 18, address: "NATIVE" },
    { symbol: "USDC", name: "USD Coin",   decimals: 6,  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    { symbol: "USDT", name: "Tether",     decimals: 6,  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    { symbol: "WBTC", name: "Wrapped BTC",decimals: 8,  address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
  ],
  137: [
    { symbol: "MATIC",name: "Polygon",    decimals: 18, address: "NATIVE" },
    { symbol: "USDC", name: "USD Coin",   decimals: 6,  address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
    { symbol: "USDT", name: "Tether",     decimals: 6,  address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
    { symbol: "WETH", name: "Wrapped ETH",decimals: 18, address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" },
  ],
  56: [
    { symbol: "BNB",  name: "BNB",        decimals: 18, address: "NATIVE" },
    { symbol: "BUSD", name: "BUSD",       decimals: 18, address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" },
    { symbol: "USDT", name: "Tether",     decimals: 6,  address: "0x55d398326f99059fF775485246999027B3197955" },
    { symbol: "CAKE", name: "PancakeSwap",decimals: 18, address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" },
  ],
};

export default function SwapWidget() {
  const account = useActiveAccount();
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [fromToken, setFromToken] = useState(TOKENS_BY_CHAIN[1][0]);
  const [toToken, setToToken]     = useState(TOKENS_BY_CHAIN[1][1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount]     = useState("");
  const [slippage, setSlippage]     = useState(0.5);
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [txHash, setTxHash]         = useState(null);
  const [error, setError]           = useState(null);

  const tokens = TOKENS_BY_CHAIN[selectedChain.id] || [];

  useEffect(() => {
    setFromToken(tokens[0]);
    setToToken(tokens[1]);
    setFromAmount("");
    setToAmount("");
  }, [selectedChain]);

  useEffect(() => {
    if (!fromAmount || isNaN(fromAmount) || Number(fromAmount) === 0) {
      setToAmount("");
      return;
    }
    const timer = setTimeout(() => {
      const rate = fromToken?.symbol === "ETH" ? 1850 : 1;
      setToAmount((Number(fromAmount) * rate).toFixed(4));
    }, 500);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    const tmp = fromToken;
    setFromToken(toToken);
    setToToken(tmp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!account) { setError("Connecte ton wallet d'abord !"); return; }
    if (!fromAmount || Number(fromAmount) === 0) { setError("Entre un montant."); return; }
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setTxHash("0xdemo123abc");
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Orbs */}
      <div style={{ position:"fixed", width:500, height:500, borderRadius:"50%", background:"#7B61FF", filter:"blur(120px)", opacity:0.15, top:-100, left:-100, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:400, height:400, borderRadius:"50%", background:"#00D2FF", filter:"blur(120px)", opacity:0.12, bottom:-80, right:-80, pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:440, padding:"0 16px 32px", position:"relative", zIndex:10 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"24px 0 20px" }}>
          <div style={{ fontSize:24, fontWeight:800, color:"#fff", letterSpacing:-0.5 }}>
            ⟳ SwapX
          </div>
          <ConnectButton client={client} theme="dark" />
        </div>

        {/* Chain selector */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {CHAINS.map(c => (
            <button key={c.id} onClick={() => setSelectedChain(c)} style={{
              flex:1, padding:"8px 0", borderRadius:12,
              border: `1.5px solid ${selectedChain.id === c.id ? c.color : "rgba(255,255,255,0.08)"}`,
              background: selectedChain.id === c.id ? `${c.color}22` : "rgba(255,255,255,0.04)",
              color: selectedChain.id === c.id ? c.color : "rgba(255,255,255,0.5)",
              fontSize:12, fontWeight:600, cursor:"pointer",
            }}>
              {c.shortName}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:24, padding:20,
          backdropFilter:"blur(20px)",
          boxShadow:"0 8px 48px rgba(0,0,0,0.4)",
        }}>
          {/* Card header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ color:"#fff", fontWeight:700, fontSize:18 }}>Swap</span>
            <button onClick={() => setShowSettings(!showSettings)} style={{
              background:"rgba(255,255,255,0.06)", border:"none", borderRadius:8,
              color:"rgba(255,255,255,0.5)", width:32, height:32, cursor:"pointer", fontSize:16,
            }}>⚙</button>
          </div>

          {/* Slippage */}
          {showSettings && (
            <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:14, padding:"12px 16px", marginBottom:12 }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>Tolérance slippage</div>
              <div style={{ display:"flex", gap:8 }}>
                {[0.1, 0.5, 1.0].map(v => (
                  <button key={v} onClick={() => setSlippage(v)} style={{
                    padding:"6px 12px", borderRadius:8,
                    border: `1px solid ${slippage === v ? "#7B61FF" : "rgba(255,255,255,0.1)"}`,
                    background: slippage === v ? "rgba(123,97,255,0.15)" : "transparent",
                    color: slippage === v ? "#7B61FF" : "rgba(255,255,255,0.5)",
                    fontSize:13, cursor:"pointer",
                  }}>{v}%</button>
                ))}
              </div>
            </div>
          )}

          {/* From token */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"14px 16px", position:"relative" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.8px" }}>De</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <button onClick={() => { setShowFromList(!showFromList); setShowToList(false); }} style={{
                display:"flex", alignItems:"center", gap:6,
                background:"rgba(255,255,255,0.06)", border:"none", borderRadius:12,
                padding:"8px 12px", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer",
              }}>
                {fromToken?.symbol} ▾
              </button>
              <input
                type="number" placeholder="0.0" value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
                style={{ background:"transparent", border:"none", color:"#fff", fontSize:22, fontWeight:500, textAlign:"right", width:"100%", paddingLeft:12, outline:"none" }}
              />
            </div>
            {showFromList && (
              <div style={{ position:"absolute", left:0, right:0, top:"calc(100% + 4px)", background:"#12172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, zIndex:100, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
                {tokens.filter(t => t.symbol !== toToken?.symbol).map(t => (
                  <button key={t.address} onClick={() => { setFromToken(t); setShowFromList(false); }} style={{
                    display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 16px",
                    background:"transparent", border:"none", color:"#fff", cursor:"pointer", textAlign:"left",
                  }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{t.symbol}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{t.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap arrow */}
          <button onClick={handleSwapTokens} style={{
            display:"block", margin:"10px auto", width:38, height:38, borderRadius:12,
            background:"rgba(123,97,255,0.15)", border:"1px solid rgba(123,97,255,0.3)",
            color:"#7B61FF", fontSize:18, cursor:"pointer",
          }}>⇅</button>

          {/* To token */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"14px 16px", position:"relative" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.8px" }}>Vers</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <button onClick={() => { setShowToList(!showToList); setShowFromList(false); }} style={{
                display:"flex", alignItems:"center", gap:6,
                background:"rgba(255,255,255,0.06)", border:"none", borderRadius:12,
                padding:"8px 12px", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer",
              }}>
                {toToken?.symbol} ▾
              </button>
              <input
                type="number" placeholder="0.0" value={toAmount} readOnly
                style={{ background:"transparent", border:"none", color:"rgba(255,255,255,0.6)", fontSize:22, fontWeight:500, textAlign:"right", width:"100%", paddingLeft:12, outline:"none" }}
              />
            </div>
            {showToList && (
              <div style={{ position:"absolute", left:0, right:0, top:"calc(100% + 4px)", background:"#12172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, zIndex:100, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
                {tokens.filter(t => t.symbol !== fromToken?.symbol).map(t => (
                  <button key={t.address} onClick={() => { setToToken(t); setShowToList(false); }} style={{
                    display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 16px",
                    background:"transparent", border:"none", color:"#fff", cursor:"pointer", textAlign:"left",
                  }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{t.symbol}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{t.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quote info */}
          {toAmount && (
            <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:12, padding:"12px 16px", marginTop:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>
                <span>Taux estimé</span>
                <span style={{ color:"rgba(255,255,255,0.7)" }}>1 {fromToken?.symbol} ≈ {fromToken?.symbol === "ETH" ? "1850" : "1"} {toToken?.symbol}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                <span>Slippage max</span>
                <span style={{ color:"rgba(255,255,255,0.7)" }}>{slippage}%</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop:10, padding:"10px 14px", borderRadius:10, background:"rgba(255,80,80,0.1)", border:"1px solid rgba(255,80,80,0.2)", color:"#ff6b6b", fontSize:13 }}>
              {error}
            </div>
          )}

          {/* Success */}
          {txHash && (
            <div style={{ marginTop:10, padding:"10px 14px", borderRadius:10, background:"rgba(0,200,120,0.1)", border:"1px solid rgba(0,200,120,0.2)", color:"#00c878", fontSize:13 }}>
              ✅ Swap réussi ! Hash : {txHash}
            </div>
          )}

          {/* CTA */}
          <button onClick={handleSwap} disabled={loading || !fromAmount} style={{
            width:"100%", marginTop:16, padding:16, borderRadius:16, border:"none",
            background: loading ? "rgba(123,97,255,0.5)" : "linear-gradient(135deg, #7B61FF 0%, #00D2FF 100%)",
            color:"#fff", fontSize:16, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
            opacity: (!fromAmount && !loading) ? 0.5 : 1,
          }}>
            {loading ? "⟳ Swap en cours..." : account ? "Swap maintenant" : "Connecte ton wallet"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:"rgba(255,255,255,0.2)" }}>
          Propulsé par <strong style={{ color:"rgba(255,255,255,0.35)" }}>ThirdWeb</strong> · {selectedChain.name}
        </div>
      </div>
    </div>
  );
}
