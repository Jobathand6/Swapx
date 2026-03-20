"use client";

import { useState, useEffect } from "react";
import { Connection, VersionedTransaction } from "@solana/web3.js";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const SOLANA_COINGECKO_IDS = {
  SOL:  "solana",
  USDC: "usd-coin",
  USDT: "tether",
  BONK: "bonk",
  JUP:  "jupiter-exchange-solana",
  RAY:  "raydium",
  WIF:  "dogwifcoin",
  PYTH: "pyth-network",
};

const POPULAR_TOKENS = [
  { symbol: "SOL",  name: "Solana",      mint: "So11111111111111111111111111111111111111112",  logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png", decimals: 9 },
  { symbol: "USDC", name: "USD Coin",    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png", decimals: 6 },
  { symbol: "USDT", name: "Tether",      mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", logo: "https://assets.coingecko.com/coins/images/325/small/tether.png", decimals: 6 },
  { symbol: "BONK", name: "Bonk",        mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", logo: "https://assets.coingecko.com/coins/images/28600/small/bonk.jpg", decimals: 5 },
  { symbol: "JUP",  name: "Jupiter",     mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  logo: "https://assets.coingecko.com/coins/images/34188/small/jup.png", decimals: 6 },
  { symbol: "RAY",  name: "Raydium",     mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", logo: "https://assets.coingecko.com/coins/images/13928/small/PSigc4ie_400x400.jpg", decimals: 6 },
  { symbol: "WIF",  name: "dogwifhat",   mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", logo: "https://assets.coingecko.com/coins/images/33566/small/wif.png", decimals: 6 },
  { symbol: "PYTH", name: "Pyth Network",mint: "HZ1JovNiVvGrCNiiYWxoK4zcGRLNQ5r2YFcSNFQkSXd8", logo: "https://assets.coingecko.com/coins/images/31924/small/pyth.png", decimals: 6 },
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

export default function SolanaSwap() {
  const [fromToken, setFromToken] = useState(POPULAR_TOKENS[0]);
  const [toToken, setToToken] = useState(POPULAR_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [slippage, setSlippage] = useState(0.5);
  const [quoteData, setQuoteData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});

  // Fetch prix Solana tokens
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = Object.values(SOLANA_COINGECKO_IDS).join(",");
        const res = await fetch(`/api/prices?ids=${ids}`);
        const data = await res.json();
        const newPrices = {}; const newChanges = {};
        Object.entries(SOLANA_COINGECKO_IDS).forEach(([symbol, id]) => {
          if (data[id]) { newPrices[symbol] = data[id].usd; newChanges[symbol] = data[id].usd_24h_change; }
        });
        setPrices(newPrices); setPriceChanges(newChanges);
      } catch (e) { console.error("Price error:", e); }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPrice = (symbol) => prices[symbol] || 0;

  useEffect(() => {
    const checkWallet = () => {
      if (window?.phantom?.solana?.isConnected) setWalletAddress(window.phantom.solana.publicKey?.toString());
      else if (window?.solflare?.isConnected) setWalletAddress(window.solflare.publicKey?.toString());
    };
    checkWallet();
  }, []);

  const connectWallet = async () => {
    try {
      if (window?.phantom?.solana) {
        const resp = await window.phantom.solana.connect();
        setWalletAddress(resp.publicKey.toString());
      } else if (window?.solflare) {
        await window.solflare.connect();
        setWalletAddress(window.solflare.publicKey.toString());
      } else {
        setError("Installe Phantom ou Solflare !");
      }
    } catch (e) { setError("Connexion annulée."); }
  };

  const disconnectWallet = async () => {
    try {
      if (window?.phantom?.solana) await window.phantom.solana.disconnect();
      else if (window?.solflare) await window.solflare.disconnect();
      setWalletAddress(null);
    } catch (e) {}
  };

  useEffect(() => {
    if (!fromAmount || isNaN(fromAmount) || Number(fromAmount) === 0) { setToAmount(""); setQuoteData(null); return; }
    const t = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        const amount = Math.floor(Number(fromAmount) * Math.pow(10, fromToken.decimals));
        const params = new URLSearchParams({
          type: "quote",
          inputMint: fromToken.mint,
          outputMint: toToken.mint,
          amount: amount.toString(),
          slippageBps: Math.floor(slippage * 100).toString(),
        });
        const res = await fetch(`/api/solana?${params}`);
        const data = await res.json();
        if (data.outAmount) {
          setToAmount((Number(data.outAmount) / Math.pow(10, toToken.decimals)).toFixed(6));
          setQuoteData(data);
        }
      } catch (e) { console.error("Quote error:", e); }
      finally { setQuoteLoading(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [fromAmount, fromToken, toToken, slippage]);

  const handleSwap = async () => {
    if (!walletAddress) { setError("Connecte ton wallet Solana !"); return; }
    if (!fromAmount || Number(fromAmount) === 0) { setError("Entre un montant."); return; }
    if (!quoteData) { setError("Attends le quote..."); return; }
    setError(null); setLoading(true);
    try {
      const swapRes = await fetch("/api/solana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteResponse: quoteData, userPublicKey: walletAddress, wrapAndUnwrapSol: true }),
      });
      const swapData = await swapRes.json();
      if (!swapData.swapTransaction) throw new Error("Transaction invalide");
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      const connection = new Connection(SOLANA_RPC, "confirmed");
      let signedTx;
      if (window?.phantom?.solana) signedTx = await window.phantom.solana.signTransaction(transaction);
      else if (window?.solflare) signedTx = await window.solflare.signTransaction(transaction);
      const rawTx = signedTx.serialize();
      const txid = await connection.sendRawTransaction(rawTx, { skipPreflight: true, maxRetries: 3 });
      await connection.confirmTransaction(txid, "confirmed");
      setTxHash(txid);
      setFromAmount(""); setToAmount("");
    } catch (e) { setError("Erreur : " + (e.message || "inconnue")); }
    setLoading(false);
  };

  const handleSwapTokens = () => {
    const tmp = fromToken; setFromToken(toToken); setToToken(tmp);
    setFromAmount(toAmount); setToAmount(fromAmount);
  };

  const filteredFrom = POPULAR_TOKENS.filter(t => t.symbol !== toToken.symbol && (t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredTo = POPULAR_TOKENS.filter(t => t.symbol !== fromToken.symbol && (t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase())));

  const PriceTag = ({ symbol }) => {
    const price = getPrice(symbol);
    const change = priceChanges[symbol];
    if (!price) return null;
    return (
      <span style={{fontSize:11, color:"rgba(255,255,255,0.4)"}}>
        ${price.toLocaleString(undefined, {maximumFractionDigits: price < 0.01 ? 8 : price < 1 ? 4 : 2})}
        {change !== undefined && (
          <span style={{color: change >= 0 ? "#00c878" : "#ff6b6b", marginLeft:4}}>
            {change >= 0 ? "▲" : "▼"}{Math.abs(change).toFixed(2)}%
          </span>
        )}
      </span>
    );
  };

  return (
    <div style={{width:"100%", fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        .sol-token-box { background: rgba(20,14,6,0.9); border: 1px solid rgba(153,69,255,0.12); border-radius: 20px; padding: 16px 20px; position: relative; transition: all 0.2s; min-height: 100px; }
        .sol-token-box:hover { border-color: rgba(153,69,255,0.3); }
        .sol-token-select { display: flex; align-items: center; gap: 8px; padding: 8px 12px 8px 8px; border-radius: 50px; border: 1px solid rgba(153,69,255,0.25); background: linear-gradient(135deg, rgba(153,69,255,0.12), rgba(153,69,255,0.06)); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
        .sol-token-select:hover { border-color: rgba(153,69,255,0.5); transform: scale(1.02); }
        .sol-amount-input { flex: 1; background: transparent; border: none; color: #fff; font-family: 'Cinzel', serif; font-size: 32px; font-weight: 600; text-align: right; outline: none; min-width: 0; width: 100%; }
        .sol-amount-input::placeholder { color: rgba(255,255,255,0.1); }
        .sol-amount-input:read-only { color: rgba(255,255,255,0.4); }
        .sol-amount-input::-webkit-outer-spin-button, .sol-amount-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .sol-amount-input[type=number] { -moz-appearance: textfield; }
        .sol-dropdown { position: absolute; left: 0; right: 0; top: calc(100% + 6px); background: rgba(12,8,3,0.98); border: 1px solid rgba(153,69,255,0.2); border-radius: 20px; z-index: 200; box-shadow: 0 16px 48px rgba(0,0,0,0.7); overflow: hidden; backdrop-filter: blur(20px); }
        .sol-search { width: 100%; padding: 12px 16px; background: rgba(153,69,255,0.05); border: none; border-bottom: 1px solid rgba(153,69,255,0.1); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; }
        .sol-search::placeholder { color: rgba(255,255,255,0.25); }
        .sol-dropdown-list { max-height: 260px; overflow-y: auto; }
        .sol-dropdown-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 18px; background: transparent; border: none; border-bottom: 1px solid rgba(153,69,255,0.05); color: #fff; cursor: pointer; text-align: left; transition: background 0.15s; font-family: 'DM Sans', sans-serif; }
        .sol-dropdown-item:hover { background: rgba(153,69,255,0.06); }
        .sol-dropdown-item:last-child { border-bottom: none; }
        .sol-arrow-btn { width: 40px; height: 40px; border-radius: 12px; background: rgba(10,7,2,0.9); border: 2px solid rgba(153,69,255,0.25); color: rgba(153,69,255,0.7); font-size: 16px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; }
        .sol-arrow-btn:hover { border-color: #9945FF; color: #9945FF; transform: rotate(180deg); }
        .sol-swap-btn { width: 100%; margin-top: 8px; padding: 18px; border-radius: 20px; border: none; font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 1px; }
        .sol-swap-btn.active { background: linear-gradient(135deg, #9945FF, #14F195); color: #fff; }
        .sol-swap-btn.active:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(153,69,255,0.3); }
        .sol-swap-btn.disabled { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.2); cursor: not-allowed; border: 1px solid rgba(153,69,255,0.08); }
        .sol-swap-btn.loading { background: rgba(153,69,255,0.2); color: rgba(153,69,255,0.6); cursor: not-allowed; }
        .sol-slip-btn { flex: 1; padding: 7px 0; border-radius: 10px; border: 1px solid rgba(153,69,255,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .sol-slip-btn.active { border-color: #9945FF; background: rgba(153,69,255,0.12); color: #9945FF; }
      `}</style>

      {/* Card header */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 4px 12px"}}>
        <span style={{fontFamily:"'Cinzel', serif", fontSize:18, fontWeight:600, color:"#9945FF", letterSpacing:1}}>Swap</span>
        <button onClick={() => setShowSettings(!showSettings)} style={{width:36, height:36, borderRadius:10, border:"none", background:"transparent", color:showSettings?"#9945FF":"rgba(153,69,255,0.4)", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>⚙</button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div style={{background:"rgba(20,14,6,0.9)", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid rgba(153,69,255,0.1)"}}>
          <div style={{fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:10}}>Tolérance slippage</div>
          <div style={{display:"flex", gap:6}}>
            {[0.1, 0.5, 1.0, 3.0].map(v => (
              <button key={v} className={`sol-slip-btn ${slippage === v ? "active" : ""}`} onClick={() => setSlippage(v)}>{v}%</button>
            ))}
          </div>
        </div>
      )}

      

      {/* FROM */}
      <div className="sol-token-box" style={{marginBottom:2}}>
        <div style={{fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:12, fontWeight:500}}>Vendre</div>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <button className="sol-token-select" onClick={() => { setShowFromList(!showFromList); setShowToList(false); setSearchQuery(""); }}>
            <TokenLogo src={fromToken.logo} size={24} />
            {fromToken.symbol}
            <span style={{fontSize:12, opacity:0.5}}>▾</span>
          </button>
          <input type="number" placeholder="0" value={fromAmount} onChange={e => setFromAmount(e.target.value)} className="sol-amount-input" />
        </div>
        <div style={{fontSize:13, color:"rgba(153,69,255,0.5)", textAlign:"right", marginTop:6, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6}}>
          {fromAmount && <span>≈ ${(Number(fromAmount) * getPrice(fromToken.symbol)).toLocaleString(undefined, {maximumFractionDigits:2})} USD</span>}
          <PriceTag symbol={fromToken.symbol} />
        </div>
        {showFromList && (
          <div className="sol-dropdown">
            <input className="sol-search" placeholder="🔍 Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
            <div className="sol-dropdown-list">
              {filteredFrom.map(t => (
                <button key={t.mint} className="sol-dropdown-item" onClick={() => { setFromToken(t); setShowFromList(false); setSearchQuery(""); }}>
                  <TokenLogo src={t.logo} size={36} />
                  <div>
                    <div style={{fontWeight:700, fontSize:14}}>{t.symbol}</div>
                    <div style={{fontSize:11, color:"rgba(255,255,255,0.3)"}}>{t.name}</div>
                    {prices[t.symbol] && <div style={{fontSize:11, color:"rgba(153,69,255,0.6)"}}>${getPrice(t.symbol).toLocaleString(undefined, {maximumFractionDigits: getPrice(t.symbol) < 0.01 ? 8 : getPrice(t.symbol) < 1 ? 4 : 2})}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ARROW */}
      <div style={{display:"flex", justifyContent:"center", padding:"4px 0", margin:"-2px 0"}}>
        <button className="sol-arrow-btn" onClick={handleSwapTokens}>⇅</button>
      </div>

      {/* TO */}
      <div className="sol-token-box" style={{marginTop:2}}>
        <div style={{fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:12, fontWeight:500}}>Acheter</div>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <button className="sol-token-select" onClick={() => { setShowToList(!showToList); setShowFromList(false); setSearchQuery(""); }}>
            <TokenLogo src={toToken.logo} size={24} />
            {toToken.symbol}
            <span style={{fontSize:12, opacity:0.5}}>▾</span>
          </button>
          <input type="number" placeholder="0" value={quoteLoading ? "..." : toAmount} readOnly className="sol-amount-input" />
        </div>
        <div style={{fontSize:13, color:"rgba(153,69,255,0.5)", textAlign:"right", marginTop:6, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6}}>
          {toAmount && <span>≈ ${(Number(toAmount) * getPrice(toToken.symbol)).toLocaleString(undefined, {maximumFractionDigits:2})} USD</span>}
          <PriceTag symbol={toToken.symbol} />
        </div>
        {showToList && (
          <div className="sol-dropdown">
            <input className="sol-search" placeholder="🔍 Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
            <div className="sol-dropdown-list">
              {filteredTo.map(t => (
                <button key={t.mint} className="sol-dropdown-item" onClick={() => { setToToken(t); setShowToList(false); setSearchQuery(""); }}>
                  <TokenLogo src={t.logo} size={36} />
                  <div>
                    <div style={{fontWeight:700, fontSize:14}}>{t.symbol}</div>
                    <div style={{fontSize:11, color:"rgba(255,255,255,0.3)"}}>{t.name}</div>
                    {prices[t.symbol] && <div style={{fontSize:11, color:"rgba(153,69,255,0.6)"}}>${getPrice(t.symbol).toLocaleString(undefined, {maximumFractionDigits: getPrice(t.symbol) < 0.01 ? 8 : getPrice(t.symbol) < 1 ? 4 : 2})}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quote */}
      {quoteData && toAmount && fromAmount && (
        <div style={{padding:"10px 16px", background:"rgba(153,69,255,0.04)", borderRadius:12, marginTop:8, border:"1px solid rgba(153,69,255,0.1)"}}>
          <div style={{display:"flex", justifyContent:"space-between", fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:5}}>
            <span>Taux</span>
            <span style={{color:"rgba(153,69,255,0.7)", fontWeight:500}}>1 {fromToken.symbol} = {(Number(toAmount)/Number(fromAmount)).toFixed(4)} {toToken.symbol}</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:5}}>
            <span>Impact prix</span>
            <span style={{color:"#00c878", fontWeight:500}}>{"< 0.01%"}</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", fontSize:13, color:"rgba(255,255,255,0.35)"}}>
            <span>Slippage max</span>
            <span style={{color:"rgba(153,69,255,0.7)", fontWeight:500}}>{slippage}%</span>
          </div>
        </div>
      )}

      {error && <div style={{margin:"6px 0", padding:"10px 14px", borderRadius:14, background:"rgba(255,80,80,0.08)", border:"1px solid rgba(255,80,80,0.2)", color:"#ff6b6b", fontSize:13}}>{error}</div>}
      {txHash && (
        <div style={{margin:"6px 0", padding:"10px 14px", borderRadius:14, background:"rgba(20,241,149,0.08)", border:"1px solid rgba(20,241,149,0.2)", color:"#14F195", fontSize:13}}>
          ✅ Swap réussi ! <a href={`https://solscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{color:"#14F195"}}>Voir sur Solscan ↗</a>
        </div>
      )}

      <button className={`sol-swap-btn ${loading ? "loading" : fromAmount ? "active" : "disabled"}`} onClick={handleSwap} disabled={loading || !fromAmount}>
        {loading ? "⟳ Swap en cours..." : walletAddress ? (fromAmount ? `Swap ${fromToken.symbol} → ${toToken.symbol}` : "Entrez un montant") : "Connecter Phantom / Solflare"}
      </button>
    </div>
  );
}
