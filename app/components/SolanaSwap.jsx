"use client";

import { useState, useEffect } from "react";
import { useAppKitProvider } from "@reown/appkit/react";
import { useAppKitAccount, useAppKit, useAppKitConnection } from "@reown/appkit/react";

import { Connection, VersionedTransaction } from "@solana/web3.js";

const SOLANA_RPC = "/api/solana-rpc";

const POPULAR_TOKENS = [
  { symbol: "SOL",   name: "Solana",         mint: "So11111111111111111111111111111111111111112",  logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png", decimals: 9 },
  { symbol: "USDC",  name: "USD Coin",        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png", decimals: 6 },
  { symbol: "USDT",  name: "Tether",          mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", logo: "https://assets.coingecko.com/coins/images/325/small/tether.png", decimals: 6 },
  { symbol: "BONK",  name: "Bonk",            mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", logo: "https://assets.coingecko.com/coins/images/28600/small/bonk.jpg", decimals: 5 },
  { symbol: "JUP",   name: "Jupiter",         mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  logo: "https://assets.coingecko.com/coins/images/34188/small/jup.png", decimals: 6 },
  { symbol: "WIF",   name: "dogwifhat",       mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", logo: "https://assets.coingecko.com/coins/images/33566/thumb/dogwifhat.png", decimals: 6 },
  { symbol: "TRUMP", name: "Official Trump",  mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN.png", decimals: 6 },
  { symbol: "FART",  name: "Fartcoin",        mint: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump.png", decimals: 6 },
  { symbol: "ORCA",  name: "Orca",            mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE.png", decimals: 6 },
  { symbol: "MSOL",  name: "Marinade SOL",    mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png", decimals: 9 },
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
  const [toToken,   setToToken]   = useState(POPULAR_TOKENS[1]);
  const [fromAmount,   setFromAmount]   = useState("");
  const [toAmount,     setToAmount]     = useState("");
  const [showFromList, setShowFromList] = useState(false);
  const [showToList,   setShowToList]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error,        setError]        = useState(null);
  const [txHash,       setTxHash]       = useState(null);
 const { walletProvider } = useAppKitProvider("solana");
const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=b82f7243-5b22-44ae-a3d4-d5869d9c5334", "confirmed");
const publicKey = walletProvider?.publicKey || null;
const sendTransaction = walletProvider?.sendTransaction?.bind(walletProvider) || null;
const { isConnected: connected, address, caipAddress } = useAppKitAccount();


const rawAddress = address?.includes(":") ? address.split(":").pop() : address;
const walletAddress = rawAddress || publicKey?.toString() || null;
console.log("walletAddress:", walletAddress, "address:", address);
  const [slippage,     setSlippage]     = useState(0.5);
  const [quoteData,    setQuoteData]    = useState(null);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [solBalances,  setSolBalances]  = useState({});



  useEffect(() => {
    if (!walletAddress) return;
    const fetch_ = async () => {
      try {
        const nb = {};
        const res = await fetch("/api/solana-rpc", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [walletAddress] }),
        });
        const data = await res.json();
        if (data.result?.value !== undefined) nb["So11111111111111111111111111111111111111112"] = data.result.value / 1e9;
        const splRes = await fetch("/api/solana-rpc", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "getTokenAccountsByOwner", params: [walletAddress, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed" }] }),
        });
        const splData = await splRes.json();
        if (splData.result?.value) {
          splData.result.value.forEach(acc => {
            const info = acc.account.data.parsed.info;
            nb[info.mint] = Number(info.tokenAmount.uiAmount) || 0;
          });
        }
        setSolBalances(nb);
      } catch { }
    };
    fetch_();
  }, [walletAddress]);

  const getSolBalance = (token) => {
    if (!walletAddress || !token) return null;
    const b = solBalances[token.mint];
    return b !== undefined ? b : null;
  };

  useEffect(() => {
    console.log("useEffect triggered, fromAmount:", fromAmount);
    if (!fromAmount || isNaN(fromAmount) || Number(fromAmount) === 0) { setToAmount(""); setQuoteData(null); return; }
    const t = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        const amount = Math.floor(Number(fromAmount) * Math.pow(10, fromToken.decimals));
        const params = new URLSearchParams({ type: "quote", inputMint: fromToken.mint, outputMint: toToken.mint, amount: amount.toString(), slippageBps: Math.floor(slippage * 100).toString() });
        const res = await fetch(`/api/solana?${params}`);
        const data = await res.json();
console.log("Jupiter response:", data);
if (data.outAmount) {
          setToAmount((Number(data.outAmount) / Math.pow(10, toToken.decimals)).toFixed(6));
          setQuoteData(data);
        }
      } catch { }
      finally { setQuoteLoading(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [fromAmount, fromToken, toToken, slippage]);



const handleSwap = async () => {
    if (!connected || !publicKey) { setError("Connect your Solana wallet!"); return; }
    if (!fromAmount || Number(fromAmount) === 0) { setError("Enter an amount."); return; }
    if (!quoteData) { setError("Waiting for quote..."); return; }
    setError(null); setLoading(true);
    try {
      const swapRes = await fetch("/api/solana", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteResponse: quoteData, userPublicKey: publicKey.toString(), wrapAndUnwrapSol: true }),
      });
      const swapData = await swapRes.json();
      if (!swapData.swapTransaction) throw new Error("Invalid transaction");
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      const txid = await sendTransaction(transaction, connection, { skipPreflight: true, maxRetries: 3 });
      await connection.confirmTransaction(txid, "confirmed");
      setTxHash(txid);
      setFromAmount(""); setToAmount("");
    } catch (e) { setError("Error: " + (e.message || "unknown")); }
    setLoading(false);
  };

  const handleFlip = () => {
    const tmp = fromToken; setFromToken(toToken); setToToken(tmp);
    setFromAmount(toAmount); setToAmount(fromAmount);
  };

  const filteredFrom = POPULAR_TOKENS.filter(t => t.symbol !== toToken.symbol && (t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredTo   = POPULAR_TOKENS.filter(t => t.symbol !== fromToken.symbol && (t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div style={{ width: "100%", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .sol-token-box { background: rgba(20,14,6,0.9); border: 1px solid rgba(153,69,255,0.12); border-radius: 20px; padding: 16px 20px; transition: all 0.2s; }
        .sol-token-box:hover { border-color: rgba(153,69,255,0.3); }
        .sol-token-pick { display: flex; align-items: center; gap: 8px; padding: 8px 12px 8px 8px; border-radius: 50px; border: 1px solid rgba(153,69,255,0.25); background: linear-gradient(135deg, rgba(153,69,255,0.12), rgba(153,69,255,0.06)); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
        .sol-token-pick:hover { border-color: rgba(153,69,255,0.5); transform: scale(1.02); }
        .sol-amount { flex: 1; background: transparent; border: none; color: #fff; font-family: 'Cinzel', serif; font-size: 30px; font-weight: 600; text-align: right; outline: none; min-width: 0; width: 100%; }
        .sol-amount::placeholder { color: rgba(255,255,255,0.1); }
        .sol-amount:read-only { color: rgba(255,255,255,0.38); }
        .sol-amount::-webkit-outer-spin-button, .sol-amount::-webkit-inner-spin-button { -webkit-appearance: none; }
        .sol-amount[type=number] { -moz-appearance: textfield; }
        .sol-arrow { width: 40px; height: 40px; border-radius: 12px; background: rgba(8,5,1,0.95); border: 2px solid rgba(153,69,255,0.2); color: rgba(153,69,255,0.55); font-size: 16px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; }
        .sol-arrow:hover { border-color: #9945FF; color: #9945FF; transform: rotate(180deg); }
        .sol-slip-btn { flex: 1; padding: 7px 0; border-radius: 10px; border: 1px solid rgba(153,69,255,0.1); background: transparent; color: rgba(255,255,255,0.35); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .sol-slip-btn.active { border-color: #9945FF; background: rgba(153,69,255,0.1); color: #9945FF; }
        .sol-swap-btn { width: 100%; margin-top: 6px; padding: 17px; border-radius: 20px; border: none; font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.25s; letter-spacing: 0.8px; }
        .sol-swap-btn.ready { background: linear-gradient(135deg, #9945FF, #14F195); color: #fff; }
        .sol-swap-btn.ready:hover { opacity: 0.88; transform: translateY(-1px); }
        .sol-swap-btn.idle { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.2); cursor: not-allowed; border: 1px solid rgba(153,69,255,0.06); }
        .sol-swap-btn.busy { background: rgba(153,69,255,0.15); color: rgba(153,69,255,0.5); cursor: not-allowed; }
        .sol-tok-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; background: transparent; border: none; border-radius: 12px; color: #fff; cursor: pointer; text-align: left; transition: background 0.15s; font-family: 'DM Sans', sans-serif; }
        .sol-tok-item:hover { background: rgba(153,69,255,0.06); }
      `}</style>



      {/* Settings */}
      {showSettings && (
        <div style={{ background: "rgba(10,6,0,0.9)", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(153,69,255,0.1)" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>Slippage tolerance</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0.1, 0.5, 1.0, 3.0].map(v => (
              <button key={v} className={`sol-slip-btn ${slippage === v ? "active" : ""}`} onClick={() => setSlippage(v)}>{v}%</button>
            ))}
          </div>
        </div>
      )}

      {/* Sell */}
      <div className="sol-token-box" style={{ marginBottom: 2 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginBottom: 12 }}>Sell</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="sol-token-pick" onClick={() => { setShowFromList(true); setShowToList(false); setSearchQuery(""); }}>
            <TokenLogo src={fromToken.logo} size={24} />{fromToken.symbol}<span style={{ fontSize: 11, opacity: 0.5 }}>▾</span>
          </button>
          <input type="number" className="sol-amount" placeholder="0" value={fromAmount} onChange={e => setFromAmount(e.target.value)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, minHeight: 16 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Balance: <span style={{ color: "rgba(153,69,255,0.75)", fontWeight: 600, cursor: "pointer" }} onClick={() => getSolBalance(fromToken) !== null && setFromAmount(getSolBalance(fromToken).toFixed(6))}>
              {getSolBalance(fromToken) !== null ? `${getSolBalance(fromToken).toFixed(4)} ${fromToken.symbol}` : `— ${fromToken.symbol}`}
            </span>
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0", margin: "-2px 0" }}>
        <button className="sol-arrow" onClick={handleFlip}>⇅</button>
      </div>

      {/* Buy */}
      <div className="sol-token-box" style={{ marginTop: 2 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginBottom: 12 }}>Buy</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="sol-token-pick" onClick={() => { setShowToList(true); setShowFromList(false); setSearchQuery(""); }}>
            <TokenLogo src={toToken.logo} size={24} />{toToken.symbol}<span style={{ fontSize: 11, opacity: 0.5 }}>▾</span>
          </button>
          <input type="number" className="sol-amount" placeholder={quoteLoading ? "..." : "0"} value={quoteLoading ? "..." : toAmount} readOnly />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, minHeight: 16 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Balance: <span style={{ color: "rgba(153,69,255,0.75)", fontWeight: 600 }}>
              {getSolBalance(toToken) !== null ? `${getSolBalance(toToken).toFixed(4)} ${toToken.symbol}` : `— ${toToken.symbol}`}
            </span>
          </span>
        </div>
      </div>

      {/* Quote */}
      {quoteData && toAmount && fromAmount && (
        <div style={{ padding: "10px 16px", background: "rgba(153,69,255,0.04)", borderRadius: 12, marginTop: 8, border: "1px solid rgba(153,69,255,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>
            <span>Rate</span><span style={{ color: "rgba(153,69,255,0.7)", fontWeight: 500 }}>1 {fromToken.symbol} = {(Number(toAmount) / Number(fromAmount)).toFixed(4)} {toToken.symbol}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>
            <span>Price impact</span><span style={{ color: "#00c878", fontWeight: 500 }}>&lt; 0.01%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            <span>Max slippage</span><span style={{ color: "rgba(153,69,255,0.7)", fontWeight: 500 }}>{slippage}%</span>
          </div>
        </div>
      )}

      {error  && <div style={{ margin: "4px 0", padding: "10px 14px", borderRadius: 13, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.18)", color: "#ff7070", fontSize: 13 }}>{error}</div>}
      {txHash && <div style={{ margin: "4px 0", padding: "10px 14px", borderRadius: 13, background: "rgba(20,241,149,0.06)", border: "1px solid rgba(20,241,149,0.2)", color: "#14F195", fontSize: 13 }}>✅ Swap OK ! <a href={`https://solscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: "#14F195" }}>View ↗</a></div>}



{/* Swap button */}
<button className={`sol-swap-btn ${loading ? "busy" : (connected && fromAmount) ? "ready" : "idle"}`} onClick={handleSwap} disabled={loading || !fromAmount}>
  {loading ? "⟳ Swapping..." : connected ? (fromAmount ? `Swap ${fromToken.symbol} → ${toToken.symbol}` : "Enter an amount") : "Connect your wallet"}
</button>

      {/* Token modal */}
      {(showFromList || showToList) && (
        <div onClick={() => { setShowFromList(false); setShowToList(false); setSearchQuery(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "rgba(10,7,2,0.98)", border: "1px solid rgba(153,69,255,0.2)", borderRadius: 24, width: "100%", maxWidth: 400, maxHeight: "75vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(153,69,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 600, color: "#9945FF" }}>Select a token</span>
                <button onClick={() => { setShowFromList(false); setShowToList(false); setSearchQuery(""); }} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", fontSize: 14, cursor: "pointer" }}>✕</button>
              </div>
              <input autoFocus placeholder="🔍 Search token..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(153,69,255,0.15)", background: "rgba(153,69,255,0.04)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" }} />
            </div>
            <div style={{ overflowY: "auto", padding: "8px 10px", scrollbarWidth: "thin", scrollbarColor: "rgba(153,69,255,0.2) transparent" }}>
              {(showFromList ? filteredFrom : filteredTo).map(t => (
                <button key={t.mint} className="sol-tok-item" onClick={() => { showFromList ? setFromToken(t) : setToToken(t); setShowFromList(false); setShowToList(false); setSearchQuery(""); }}>
                  <TokenLogo src={t.logo} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.symbol}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.name}</div>
                  </div>
                  {getSolBalance(t) !== null && getSolBalance(t) > 0
                    ? <div style={{ fontSize: 12, color: "rgba(153,69,255,0.75)", fontWeight: 600 }}>{getSolBalance(t).toFixed(4)}</div>
                    : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>0</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}