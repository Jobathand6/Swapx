"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useConnectModal, ConnectButton } from "@rainbow-me/rainbowkit";
import { useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

import { base } from "thirdweb/chains";


import SolanaSwap from "./SolanaSwap";




// ─── Token logos
const L = {
  ETH:  "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  DAI:  "https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png",
  AERO: "https://dd.dexscreener.com/ds-data/tokens/base/0x940181a94a35a4569e4529a3cdfb74e38fd98631.png",
  ZRO:  "https://dd.dexscreener.com/ds-data/tokens/base/0x6985884c4392d348587b19cb9eaaf157f13271cd.png",
  VVV:  "https://assets.coingecko.com/coins/images/36730/small/venice_logo.png",
  ZORA: "https://assets.coingecko.com/coins/images/38116/small/zora.jpg",
  BNKR: "https://assets.coingecko.com/coins/images/38200/small/bankr.jpg",
  SOL:  "https://assets.coingecko.com/coins/images/4128/small/solana.png",
};

// ─── Tokens Base uniquement
const BASE_STABLE_TOKENS = [
  { symbol: "ETH",  name: "Ethereum", address: "NATIVE", logo: L.ETH, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", logo: L.USDC, decimals: 6 },
];

const COINGECKO_IDS = {
  ETH: "ethereum", USDC: "usd-coin", DAI: "dai",
  AERO: "aerodrome-finance", ZRO: "layerzero", VVV: "venice-token",
};

const FALLBACK_PRICES = {
  ETH: 1940, USDC: 1, DAI: 1, AERO: 0.62, ZRO: 3.4, VVV: 1.2, ZORA: 0.08, BNKR: 0.08,
};

const LEVELS = [
  { name: "Fossil",  emoji: "🪨", min: 0,     max: 49,       color: "#8B7355", bg: "rgba(139,115,85,0.15)" },
  { name: "Egg",     emoji: "🥚", min: 50,    max: 499,      color: "#C8B89A", bg: "rgba(200,184,154,0.15)" },
  { name: "Reptile", emoji: "🦎", min: 500,   max: 1999,     color: "#4CAF50", bg: "rgba(76,175,80,0.15)" },
  { name: "Raptor",  emoji: "🦴", min: 2000,  max: 4999,     color: "#2196F3", bg: "rgba(33,150,243,0.15)" },
  { name: "Rex",     emoji: "🦖", min: 5000,  max: 9999,     color: "#FF5722", bg: "rgba(255,87,34,0.15)" },
  { name: "Pangean", emoji: "🌋", min: 10000, max: Infinity, color: "#D4A017", bg: "rgba(212,160,23,0.15)" },
];

const TICKER_TOKENS = [
  { sym: "ETH",  id: "ethereum" },
  { sym: "SOL",  id: "solana" },
  { sym: "USDC", id: "usd-coin" },
  { sym: "AERO", id: "aerodrome-finance" },
  { sym: "JUP",  id: "jupiter-exchange-solana" },
  { sym: "BONK", id: "bonk" },
  { sym: "WIF",  id: "dogwifcoin" },
];

function getLevel(n) { return LEVELS.find(l => n >= l.min && n <= l.max) || LEVELS[0]; }
function getProgress(n) { const l = getLevel(n); if (l.max === Infinity) return 100; return Math.floor(((n - l.min) / (l.max - l.min + 1)) * 100); }
function getNextLevel(n) { const i = LEVELS.findIndex(l => n >= l.min && n <= l.max); return i < LEVELS.length - 1 ? LEVELS[i + 1] : null; }

// ─── Token logo avec fallback
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

// ─── Fond volcans
const STARS = Array.from({ length: 36 }, (_, i) => ({
  id: i, top: `${(i * 37 + 11) % 60}%`, left: `${(i * 53 + 7) % 100}%`,
  size: i % 4 === 0 ? 2 : 1, opacity: ((i * 17 + 3) % 6) * 0.08 + 0.1,
}));

function PangeaBG() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", background: "linear-gradient(180deg,#060408 0%,#0a0805 40%,#100c04 70%,#180e00 100%)", pointerEvents: "none" }}>
      {STARS.map(s => <div key={s.id} style={{ position: "absolute", width: s.size, height: s.size, background: "#fff", borderRadius: "50%", top: s.top, left: s.left, opacity: s.opacity }} />)}
      <div style={{ position: "absolute", bottom: 0, left: "8%", width: 0, height: 0, borderLeft: "130px solid transparent", borderRight: "130px solid transparent", borderBottom: "280px solid #120800" }} />
      <div style={{ position: "absolute", bottom: 170, left: "calc(8% + 10px)", width: 200, height: 110, background: "#ff4400", borderRadius: "50%", filter: "blur(50px)", opacity: 0.13, animation: "pg-pulse 4s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: 0, left: "40%", width: 0, height: 0, borderLeft: "210px solid transparent", borderRight: "210px solid transparent", borderBottom: "400px solid #150a00" }} />
      <div style={{ position: "absolute", bottom: 260, left: "calc(40% + 70px)", width: 300, height: 160, background: "#ff5500", borderRadius: "50%", filter: "blur(70px)", opacity: 0.1, animation: "pg-pulse 5s ease-in-out infinite", animationDelay: "1.2s" }} />
      <div style={{ position: "absolute", bottom: 0, right: "5%", width: 0, height: 0, borderLeft: "160px solid transparent", borderRight: "160px solid transparent", borderBottom: "330px solid #120800" }} />
      <div style={{ position: "absolute", bottom: 190, right: "calc(5% + 20px)", width: 240, height: 140, background: "#ff4400", borderRadius: "50%", filter: "blur(60px)", opacity: 0.12, animation: "pg-pulse 4.5s ease-in-out infinite", animationDelay: "2.4s" }} />
      <style>{`@keyframes pg-pulse{0%,100%{opacity:0.08}50%{opacity:0.18}} @keyframes pg-levelup{0%{transform:scale(0.6) translateX(-50%);opacity:0}60%{transform:scale(1.1) translateX(-50%);opacity:1}100%{transform:scale(1) translateX(-50%);opacity:1}}`}</style>
    </div>
  );
}

// ─── Price ticker
function PriceTicker({ prices, changes }) {
  return (
    <div style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 999, background: "rgba(6,4,8,0.7)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(212,160,23,0.06)", padding: "5px 24px", display: "flex", gap: 20, overflowX: "auto", scrollbarWidth: "none" }}>
      {TICKER_TOKENS.map(({ sym, id }) => {
        const price = prices[id];
        const change = changes[id];
        if (!price) return null;
        return (
          <div key={sym} style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{sym}</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>${price.toLocaleString(undefined, { maximumFractionDigits: price < 0.01 ? 8 : price < 1 ? 4 : 2 })}</span>
            {change !== undefined && <span style={{ color: change >= 0 ? "#00c878" : "#ff6b6b" }}>{change >= 0 ? "▲" : "▼"}{Math.abs(change).toFixed(2)}%</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Composant principal
export default function SwapWidget() {
const { address: account, isConnected } = useAccount();
const { publicKey: solanaPublicKey, connected: solanaConnected } = useWallet();
const { setVisible: setSolanaModalVisible } = useWalletModal();
const solanaAccount = solanaPublicKey?.toString() || null;
const { openConnectModal } = useConnectModal();
const { disconnect } = useDisconnect();

const { address: evmAddress } = useAccount();
const { switchChain } = useSwitchChain();

  const [chain, setChain] = useState("base");
  const isSolana = chain === "solana";

const [fromToken, setFromToken] = useState(BASE_STABLE_TOKENS[0]);
const [toToken,   setToToken]   = useState(BASE_STABLE_TOKENS[1]);
  const [fromAmount,   setFromAmount]   = useState("");
  const [toAmount,     setToAmount]     = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapSource,   setSwapSource]   = useState(null);
  const [slippage,     setSlippage]     = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [showFromList, setShowFromList] = useState(false);
  const [showToList,   setShowToList]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [baseTrendingTokens, setBaseTrendingTokens] = useState([]);
const [baseWalletTokens, setBaseWalletTokens] = useState([]);

useEffect(() => {
  fetch("https://api.dexscreener.com/tokens/v1/base/0x940181a94a35a4569e4529a3cdfb74e38fd98631,0x6985884C4392D348587B19cb9eAAf157F13271cd,0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb,0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf,0x1111111111166b7FE7bd91427724B487980aFc69,0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b,0x4200000000000000000000000000000000000042,0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22")
    .then(r => r.json())
    .then(data => {
      const seen = new Set(BASE_STABLE_TOKENS.map(t => t.address));
      const tokens = (Array.isArray(data) ? data : [])
        .filter(p => p.baseToken?.address && !seen.has(p.baseToken.address))
        .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        .reduce((acc, p) => {
          if (!acc.find(t => t.address === p.baseToken.address)) {
            acc.push({
              symbol: p.baseToken.symbol,
              name: p.baseToken.name,
              address: p.baseToken.address,
              logo: p.info?.imageUrl || "",
              decimals: 18,
            });
          }
          return acc;
        }, [])
        .slice(0, 17);
      setBaseTrendingTokens(tokens);
    })
    .catch(() => {});
}, []);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [txHash,       setTxHash]       = useState(null);
  const [swapHistory,  setSwapHistory]  = useState([]);
  const [prices,       setPrices]       = useState({});
  const [changes,      setChanges]      = useState({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [balances,     setBalances]     = useState({});
  const [swapCount,    setSwapCount]    = useState(0);
  const [levelUpNotif, setLevelUpNotif] = useState(null);
  const [showProfile,  setShowProfile]  = useState(false);

  // Charger le compte de swaps
  useEffect(() => {
    const saved = localStorage.getItem("pangeon_swap_count");
    if (saved) setSwapCount(parseInt(saved));
  }, []);

  // Fetch prix
  useEffect(() => {
    const ids = [...TICKER_TOKENS.map(t => t.id), "usd-coin", "dai", "aerodrome-finance", "layerzero"].join(",");
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/prices?ids=${ids}`);
        const data = await res.json();
        const np = {}, nc = {};
        Object.entries(data).forEach(([id, val]) => { np[id] = val.usd; nc[id] = val.usd_24h_change; });
        setPrices(np); setChanges(nc); setPricesLoaded(true);
      } catch { setPricesLoaded(true); }
    };
    fetchPrices();
    const iv = setInterval(fetchPrices, 30000);
    return () => clearInterval(iv);
  }, []);

  // Fetch balances Base
  useEffect(() => {
if (!evmAddress || isSolana) { setBalances({}); return; }
    const fetchBalances = async () => {
      try {
        const chainHex = "0x" + (8453).toString(16);
const res = await fetch(`https://deep-index.moralis.io/api/v2.2/${evmAddress}/erc20?chain=${chainHex}`, {
          headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY || "" },
        });
        const data = await res.json();
        const nb = {};
        const list = Array.isArray(data) ? data : (data.result || []);
        list.forEach(t => { nb[t.token_address.toLowerCase()] = Number(t.balance) / Math.pow(10, Number(t.decimals)); });
const nativeRes = await fetch(`https://deep-index.moralis.io/api/v2.2/${evmAddress}/balance?chain=${chainHex}`, {
          headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY || "" },
        });
        const nativeData = await nativeRes.json();
        if (nativeData.balance) nb["NATIVE"] = Number(nativeData.balance) / 1e18;
        setBalances(nb);
      } catch { }
    };
    fetchBalances();
}, [evmAddress, isSolana]);

  const getPrice = useCallback((sym) => {
    const id = COINGECKO_IDS[sym];
    return (id && prices[id]) ? prices[id] : (FALLBACK_PRICES[sym] || 1);
  }, [prices]);

const getBalance = useCallback((token) => {
  if (!token || !evmAddress) return null;
  if (token.address === "NATIVE") return balances["NATIVE"] ?? null;
  return balances[token.address.toLowerCase()] ?? null;
}, [balances, evmAddress]);

  // Quote automatique
  useEffect(() => {
    if (isSolana || !fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) === 0) { setToAmount(""); return; }
    const t = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const decimals = fromToken.decimals;
        const amountWei = BigInt(Math.floor(Number(fromAmount) * Math.pow(10, decimals))).toString();
        const NATIVE_ADDR = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        const src  = fromToken.address === "NATIVE" ? NATIVE_ADDR : fromToken.address;
        const dest = toToken.address   === "NATIVE" ? NATIVE_ADDR : toToken.address;
        const amountReadable = (Number(amountWei) / Math.pow(10, decimals)).toString();
        const params = new URLSearchParams({ type: "price", chainId: "8453", inTokenAddress: src, outTokenAddress: dest, amount: amountReadable });
        const res = await fetch(`/api/openocean?${params}`);
        const data = await res.json();
        if (data?.data?.outAmount) {
          setToAmount((Number(data.data.outAmount) / Math.pow(10, toToken.decimals)).toFixed(6));
          setSwapSource("OpenOcean");
        } else {
          setToAmount(((Number(fromAmount) * getPrice(fromToken.symbol)) / getPrice(toToken.symbol)).toFixed(6));
          setSwapSource(null);
        }
      } catch {
        setToAmount(((Number(fromAmount) * getPrice(fromToken.symbol)) / getPrice(toToken.symbol)).toFixed(6));
        setSwapSource(null);
      } finally { setQuoteLoading(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [fromAmount, fromToken, toToken, isSolana, getPrice]);

  const handleChainSwitch = (c) => {
    setChain(c);
    setFromToken(BASE_TOKENS[0]); setToToken(BASE_TOKENS[1]);
    setFromAmount(""); setToAmount(""); setSwapSource(null); setError(null); setTxHash(null);
if (c === "base") switchChain({ chainId: base.id });
  };

  const handleFlip = () => {
    setFromToken(toToken); setToToken(fromToken);
    setFromAmount(toAmount); setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!account) { setError("Please connect your wallet first!"); return; }
    if (!fromAmount || Number(fromAmount) === 0) { setError("Please enter an amount."); return; }
    setError(null); setLoading(true); setSwapSource(null);
    try {
      const decimals = fromToken.decimals;
      const amountWei = BigInt(Math.floor(Number(fromAmount) * Math.pow(10, decimals))).toString();
      const { getSwapQuote } = await import("../lib/swap");
const quote = await getSwapQuote({ chainId: 8453, fromToken: fromToken.address, toToken: toToken.address, amount: amountWei, decimals, walletAddress: account, slippage });
      setSwapSource(quote.source);
      if (fromToken.address !== "NATIVE") {
        try {
          const { approveToken } = await import("../lib/sendSwapTx");
          await approveToken({ chainId: 8453, tokenAddress: fromToken.address, spenderAddress: quote.to });
          await new Promise(r => setTimeout(r, 3000));
        } catch { }
      }
      const { sendSwapTransaction } = await import("../lib/sendSwapTx");
      const tx = await sendSwapTransaction({ chainId: 8453, to: quote.to, data: quote.data, value: quote.value || "0", gas: quote.gas });
      const hash = tx.transactionHash || tx.hash || "confirmed";
      setTxHash(hash);
      setSwapHistory(prev => [{ from: fromToken.symbol, to: toToken.symbol, amountIn: fromAmount, amountOut: toAmount, hash, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
      const newCount = swapCount + 1;
      const oldLvl = getLevel(swapCount);
      const newLvl = getLevel(newCount);
      setSwapCount(newCount);
      localStorage.setItem("pangeon_swap_count", newCount.toString());
      if (newLvl.name !== oldLvl.name) { setLevelUpNotif(newLvl); setTimeout(() => setLevelUpNotif(null), 4000); }
    } catch (e) { setError("Swap error: " + (e.message || "unknown")); }
    setLoading(false); setFromAmount(""); setToAmount("");
  };


const BASE_TOKENS = [...baseWalletTokens, ...BASE_STABLE_TOKENS.filter(t => !baseWalletTokens.find(w => w.address === t.address)), ...baseTrendingTokens.filter(t => !baseWalletTokens.find(w => w.address === t.address))];
const baseList = searchResults.length > 0 ? searchResults : BASE_TOKENS;
const filteredFrom = baseList.filter(t => t.symbol && t.address && t.symbol !== toToken?.symbol);
const filteredTo   = baseList.filter(t => t.symbol && t.address && t.symbol !== fromToken?.symbol);

  const currentLevel = getLevel(swapCount);
  const progress     = getProgress(swapCount);
  const nextLevel    = getNextLevel(swapCount);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;} body{background:#060408;}
        .pg-nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(212,160,23,0.1);height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 24px;gap:16px;}
.pg-nav-top-mobile{display:none;}
.pg-nav-mobile{display:none;}
@media(max-width:768px){
  .pg-nav{display:none;}
  .pg-nav-top-mobile{display:flex;position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(212,160,23,0.15);height:56px;align-items:center;justify-content:space-between;padding:0 16px;}
  .pg-nav-mobile{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(212,160,23,0.15);height:64px;align-items:center;justify-content:space-around;padding:0 8px;}
  .pg-nav-mobile-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 16px;border-radius:12px;color:rgba(255,255,255,0.45);text-decoration:none;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;transition:all 0.2s;}
  .pg-nav-mobile-item.active{color:#D4A017;}
  .pg-nav-mobile-item span:first-child{font-size:20px;}
}
        .pg-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .pg-logo-text{font-family:'Cinzel',serif;font-size:22px;font-weight:700;background:linear-gradient(135deg,#D4A017,#F5C842,#D4A017);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px;}
        .pg-nav-links{display:flex;align-items:center;gap:4px;justify-content:center;}
        .pg-nav-link{padding:8px 16px;border-radius:12px;border:none;background:transparent;color:#ffffff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all 0.2s;text-decoration:none;display:inline-flex;align-items:center;gap:6px;}
        .pg-nav-link:hover,.pg-nav-link.active{color:#D4A017;background:rgba(212,160,23,0.08);}
        .pg-nav-right{display:flex;align-items:center;gap:8px;justify-content:flex-end;position:relative;}
        .pg-level-badge{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;cursor:pointer;transition:all 0.2s;border:1px solid;background:transparent;white-space:nowrap;}
        .pg-profile{position:absolute;top:54px;right:0;width:300px;background:rgba(12,8,3,0.98);border:1px solid rgba(212,160,23,0.2);border-radius:20px;z-index:300;box-shadow:0 16px 48px rgba(0,0,0,0.7);padding:20px;backdrop-filter:blur(20px);}
        .pg-level-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid;margin-bottom:6px;}
        .pg-chain-tabs{display:flex;background:rgba(10,7,2,0.9);border:1px solid rgba(212,160,23,0.1);border-radius:16px;padding:4px;margin-bottom:8px;gap:4px;}
        .pg-chain-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;border-radius:12px;border:none;background:transparent;color:rgba(255,255,255,0.35);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;}
        .pg-chain-tab.base{background:rgba(0,82,255,0.14);color:#fff;border:1px solid rgba(0,82,255,0.28);}
        .pg-chain-tab.sol{background:rgba(153,69,255,0.14);color:#fff;border:1px solid rgba(153,69,255,0.28);}
        .pg-card{background:rgba(12,8,3,0.9);border:1px solid rgba(212,160,23,0.15);border-radius:24px;padding:8px;backdrop-filter:blur(24px);}
        .pg-token-box{background:rgba(20,14,6,0.9);border:1px solid rgba(0,82,255,0.08);border-radius:20px;padding:16px 20px;transition:border-color 0.2s;}
        .pg-token-box:hover{border-color:rgba(0,82,255,0.3);}
       .pg-token-pick{display:flex;align-items:center;gap:8px;padding:8px 12px 8px 8px;border-radius:50px;border:1px solid rgba(0,82,255,0.2);background:linear-gradient(135deg,rgba(0,82,255,0.12),rgba(0,82,255,0.05));color:#fff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
        .pg-token-pick:hover{transform:scale(1.02);border-color:rgba(212,160,23,0.35);}
        .pg-amount{flex:1;background:transparent;border:none;color:#fff;font-family:'Cinzel',serif;font-size:30px;font-weight:600;text-align:right;outline:none;min-width:0;width:100%;}
        .pg-amount::placeholder{color:rgba(255,255,255,0.1);}
        .pg-amount:read-only{color:rgba(255,255,255,0.38);}
        .pg-amount::-webkit-outer-spin-button,.pg-amount::-webkit-inner-spin-button{-webkit-appearance:none;}
        .pg-amount[type=number]{-moz-appearance:textfield;}
        .pg-arrow{width:40px;height:40px;border-radius:12px;background:rgba(8,5,1,0.95);border:2px solid rgba(0,82,255,0.18);color:rgba(0,82,255,0.55);font-size:16px;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;justify-content:center;}
        .pg-arrow:hover{border-color:#0052FF;color:#0052FF;transform:rotate(180deg);}
        .pg-quote{padding:12px 18px;background:rgba(212,160,23,0.03);border-radius:14px;margin:6px 0 2px;border:1px solid rgba(212,160,23,0.07);}
        .pg-quote-row{display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:5px;}
        .pg-quote-row:last-child{margin-bottom:0;}
        .pg-quote-val{color:rgba(212,160,23,0.68);font-weight:500;}
        .pg-slip-btn{flex:1;padding:7px 0;border-radius:10px;border:1px solid rgba(212,160,23,0.1);background:transparent;color:rgba(255,255,255,0.35);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
        .pg-slip-btn.on{border-color:#D4A017;background:rgba(212,160,23,0.1);color:#D4A017;}
        .pg-swap-btn{width:100%;margin-top:6px;padding:17px;border-radius:20px;border:none;font-family:'Cinzel',serif;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.25s;letter-spacing:0.8px;}
        .pg-swap-btn.ready{background:linear-gradient(135deg,#D4A017,#F5C842,#c89010);color:#0a0600;}
        .pg-swap-btn.ready:hover{opacity:0.9;transform:translateY(-1px);}
        .pg-swap-btn.ready-sol{background:linear-gradient(135deg,#9945FF,#14F195);color:#fff;}
        .pg-swap-btn.idle{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.2);cursor:not-allowed;border:1px solid rgba(212,160,23,0.06);}
        .pg-swap-btn.busy{background:rgba(212,160,23,0.15);color:rgba(212,160,23,0.5);cursor:not-allowed;}
        .pg-error{margin:4px 0;padding:10px 14px;border-radius:13px;background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.18);color:#ff7070;font-size:13px;}
        .pg-success{margin:4px 0;padding:10px 14px;border-radius:13px;background:rgba(212,160,23,0.08);border:1px solid rgba(212,160,23,0.2);color:#D4A017;font-size:13px;}
        .pg-history{margin-top:10px;background:rgba(12,8,3,0.85);border:1px solid rgba(212,160,23,0.1);border-radius:20px;padding:16px;}
        .pg-hist-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(212,160,23,0.05);}
        .pg-hist-item:last-child{border-bottom:none;padding-bottom:0;}
        .pg-levelup{position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(12,8,3,0.95);border-radius:20px;padding:14px 22px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:pg-levelup 0.5s ease forwards;}
        .pg-modal-overlay{position:fixed;inset:0;background:transparent;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(0px);}
        .pg-modal{background:rgba(10,7,2,0.98);border:1px solid rgba(0,82,255,0.2);border-radius:24px;width:100%;max-width:400px;max-height:75vh;display:flex;flex-direction:column;}
        .pg-modal-list{overflow-y:auto;padding:8px 10px;scrollbar-width:thin;scrollbar-color:rgba(212,160,23,0.15) transparent;}
        .pg-tok-item{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;background:transparent;border:none;border-radius:12px;color:#fff;cursor:pointer;text-align:left;transition:background 0.15s;font-family:'DM Sans',sans-serif;}
        .pg-tok-item:hover{background:rgba(212,160,23,0.05);}
        .pg-settings-btn{width:32px;height:32px;border-radius:9px;border:none;background:transparent;color:rgba(0,82,255,0.38);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
        .pg-settings-btn:hover{background:rgba(0,82,255,0.07);color:#0052FF;}
      `}</style>

      <PangeaBG />

      {/* Level-up notification */}
      {levelUpNotif && (
        <div className="pg-levelup" style={{ border: `1px solid ${levelUpNotif.color}` }}>
          <span style={{ fontSize: 32 }}>{levelUpNotif.emoji}</span>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, color: levelUpNotif.color, fontSize: 14 }}>Level Up!</div>
            <div style={{ color: "#fff", fontSize: 13 }}>You are now <strong>{levelUpNotif.name}</strong> 🎉</div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="pg-nav">
        <a href="/swap" className="pg-logo">
          <img src="/logo.png" style={{ width: 40, height: 40, objectFit: "contain" }} alt="Pangeon" />
          <span className="pg-logo-text">PANGEON</span>
        </a>
        <div className="pg-nav-links">
<a href="/swap" className="pg-nav-link active">⚡ Swap</a>
<a href="/dust" className="pg-nav-link">🧹 Sweep</a>
<a href="/profile" className="pg-nav-link">👤 Profile</a>
        </div>
        <div className="pg-nav-right">



{/* Wallet connect */}
<div style={{ zIndex: 9999, position: "relative" }}>
  {isSolana ? (
    <button onClick={() => setSolanaModalVisible(true)} style={{ padding: "8px 18px", borderRadius: 12, background: solanaConnected ? "rgba(153,69,255,0.1)" : "linear-gradient(135deg,#9945FF,#7a35cc)", border: solanaConnected ? "1px solid rgba(153,69,255,0.3)" : "none", color: solanaConnected ? "#9945FF" : "#fff", fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
      {solanaConnected ? solanaAccount?.slice(0,4) + "..." + solanaAccount?.slice(-4) : "Connect Solana"}
    </button>
  ) : (
<ConnectButton.Custom>
  {({ account, chain, openConnectModal, mounted }) => {
    const connected = mounted && account && chain;
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {connected ? (
          <>
            <span style={{ color: "#D4A017", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600 }}>
              {account.displayName}
            </span>
            <button onClick={() => disconnect()} style={{ padding: "6px 12px", borderRadius: 10, background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff6b6b", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>
              Disconnect
            </button>
          </>
        ) : (
          <button onClick={openConnectModal} style={{ padding: "8px 18px", borderRadius: 12, background: "linear-gradient(135deg,#D4A017,#F5C842)", border: "none", color: "#0a0600", fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Connect Wallet
          </button>
        )}
      </div>
    );
  }}
</ConnectButton.Custom>
  )}
</div>

        </div>
      </nav>

      {/* Price ticker */}


      {/* Page */}
      <div style={{ minHeight: "100vh", paddingTop: 120, paddingBottom: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 0 }}
        onClick={() => { setShowFromList(false); setShowToList(false); setSearchQuery(""); setShowProfile(false); }}>
        <div style={{ width: "100%", maxWidth: 460, padding: "0 16px" }}>

          {/* Onglets Base / Solana */}
          <div className="pg-chain-tabs">
            <button className={`pg-chain-tab ${!isSolana ? "base" : ""}`} onClick={() => handleChainSwitch("base")}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0052FF" }} /> Base
            </button>
            <button className={`pg-chain-tab ${isSolana ? "sol" : ""}`} onClick={() => handleChainSwitch("solana")}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#9945FF" }} /> Solana
            </button>
          </div>

          {/* Carte swap */}
<div style={{ display: isSolana ? "block" : "none" }}>
  <div className="pg-card" onClick={e => e.stopPropagation()}>
    <div style={{ padding: "12px 4px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 12px" }}>
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 600, color: "#9945FF", letterSpacing: ".8px" }}>Swap</span>
        <button className="pg-settings-btn" style={{ color: "rgba(153,69,255,0.38)" }} onClick={() => window._solanaToggleSettings && window._solanaToggleSettings()}>⚙</button>
      </div>
      <SolanaSwap />
    </div>
  </div>
</div>
{!isSolana && (
            <div className="pg-card" onClick={e => e.stopPropagation()} style={{ filter: (showFromList || showToList) ? "blur(3px)" : "none", transition: "filter 0.2s" }}>
              <div style={{ padding: "12px 4px 4px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 12px" }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 600, color: "#0052FF", letterSpacing: ".8px" }}>Swap</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {swapSource && <span style={{ fontSize: 11, color: "rgba(212,160,23,0.45)" }}>⚡ {swapSource}</span>}
                    <button className="pg-settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙</button>
                  </div>
                </div>

                {/* Slippage */}
                {showSettings && (
                  <div style={{ background: "rgba(10,6,0,0.9)", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(212,160,23,0.08)" }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>Slippage tolerance</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0.1, 0.5, 1.0, 3.0].map(v => (
                        <button key={v} className={`pg-slip-btn ${slippage === v ? "on" : ""}`} onClick={() => setSlippage(v)}>{v}%</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sell */}
                <div className="pg-token-box" style={{ marginBottom: 2 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginBottom: 12 }}>Sell</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button className="pg-token-pick" onClick={() => { setShowFromList(true); setShowToList(false); setSearchQuery(""); }}>
                      <TokenLogo src={fromToken.logo} size={24} />{fromToken.symbol}<span style={{ fontSize: 11, opacity: 0.5 }}>▾</span>
                    </button>
                    <input type="number" className="pg-amount" placeholder="0" value={fromAmount} onChange={e => setFromAmount(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, minHeight: 16 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{fromAmount && `≈ $${(Number(fromAmount) * getPrice(fromToken.symbol)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</span>
                    {getBalance(fromToken) !== null && (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                        Balance: <span style={{ color: "rgba(212,160,23,0.75)", fontWeight: 600, cursor: "pointer" }} onClick={() => setFromAmount((getBalance(fromToken) || 0).toFixed(6))}>{(getBalance(fromToken) || 0).toFixed(4)} {fromToken.symbol}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ display: "flex", justifyContent: "center", padding: "4px 0", margin: "-2px 0" }}>
                  <button className="pg-arrow" onClick={handleFlip}>⇅</button>
                </div>

                {/* Buy */}
                <div className="pg-token-box" style={{ marginTop: 2 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginBottom: 12 }}>Buy</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button className="pg-token-pick" onClick={() => { setShowToList(true); setShowFromList(false); setSearchQuery(""); }}>
                      <TokenLogo src={toToken.logo} size={24} />{toToken.symbol}<span style={{ fontSize: 11, opacity: 0.5 }}>▾</span>
                    </button>
                    <input type="number" className="pg-amount" placeholder={quoteLoading ? "..." : "0"} value={quoteLoading ? "..." : toAmount} readOnly />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, minHeight: 16 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{toAmount && `≈ $${(Number(toAmount) * getPrice(toToken.symbol)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</span>
                    {getBalance(toToken) !== null && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Balance: {(getBalance(toToken) || 0).toFixed(4)} {toToken.symbol}</span>}
                  </div>
                </div>

                {/* Quote */}
                {toAmount && fromAmount && (
                  <div className="pg-quote">
                    <div className="pg-quote-row"><span>Rate</span><span className="pg-quote-val">1 {fromToken.symbol} = {(getPrice(fromToken.symbol) / getPrice(toToken.symbol)).toFixed(4)} {toToken.symbol}</span></div>
                    <div className="pg-quote-row"><span>Price impact</span><span style={{ color: "#00c878", fontWeight: 500 }}>&lt; 0.01%</span></div>
                    <div className="pg-quote-row"><span>Max slippage</span><span className="pg-quote-val">{slippage}%</span></div>
                    {swapSource && <div className="pg-quote-row"><span>Source</span><span className="pg-quote-val">⚡ {swapSource}</span></div>}
                  </div>
                )}

                {error  && <div className="pg-error">{error}</div>}
                {txHash && <div className="pg-success">✅ Swap OK ! <span style={{ fontSize: 11, opacity: 0.65, wordBreak: "break-all" }}>{txHash}</span></div>}

                <button className={`pg-swap-btn ${loading ? "busy" : (isConnected && fromAmount) ? "ready" : "idle"}`} onClick={handleSwap} disabled={loading || !fromAmount}>
                  {loading ? "⟳ Swapping..." : isConnected ? (fromAmount ? `Swap ${fromToken.symbol} → ${toToken.symbol}` : "Enter an amount") : "Connect your wallet"}
                </button>
              </div>
            </div>
          )}

          {/* Historique */}
          {swapHistory.length > 0 && !isSolana && (
            <div className="pg-history">
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 600, color: "#D4A017", letterSpacing: ".8px", marginBottom: 12 }}>Recent transactions</div>
              {swapHistory.map((s, i) => (
                <div key={i} className="pg-hist-item">
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(212,160,23,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.amountIn} {s.from} → {s.amountOut} {s.to}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{s.time}</div>
                  </div>
                  <a href={`https://basescan.org/tx/${s.hash}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#D4A017", fontWeight: 600, textDecoration: "none" }}>↗</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal sélection token */}
      {(showFromList || showToList) && !isSolana && (
        <div className="pg-modal-overlay" onClick={() => { setShowFromList(false); setShowToList(false); setSearchQuery(""); }}>
          <div className="pg-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(212,160,23,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 600, color: "#0052FF" }}>Select a token</span>
                <button onClick={() => { setShowFromList(false); setShowToList(false); setSearchQuery(""); }} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", fontSize: 14, cursor: "pointer" }}>✕</button>
              </div>
              <input autoFocus placeholder="🔍 Search token or paste address..." value={searchQuery} onChange={e => {
  const q = e.target.value;
  setSearchQuery(q);
  if (q.length >= 2) {
    fetch(`/api/solana?type=search-base&q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(results => setSearchResults(Array.isArray(results) ? results : []))
      .catch(() => setSearchResults([]));
  } else {
    setSearchResults([]);
  }
}}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(212,160,23,0.12)", background: "rgba(212,160,23,0.04)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none" }} />
            </div>
            <div className="pg-modal-list">
              {(showFromList ? filteredFrom : filteredTo).map(t => (
                <button key={t.address} className="pg-tok-item"
                  onClick={() => { showFromList ? setFromToken(t) : setToToken(t); setShowFromList(false); setShowToList(false); setSearchQuery(""); }}>
                  <TokenLogo src={t.logo} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.symbol}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.name}</div>
                  </div>
                  {getBalance(t) !== null && (getBalance(t) || 0) > 0
                    ? <div style={{ fontSize: 12, color: "rgba(212,160,23,0.75)", fontWeight: 600 }}>{(getBalance(t) || 0).toFixed(4)}</div>
                    : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>0</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

{isSolana ? (
  <button onClick={() => setSolanaModalVisible(true)} style={{ padding: "8px 14px", borderRadius: 12, background: solanaConnected ? "rgba(153,69,255,0.1)" : "linear-gradient(135deg,#9945FF,#7a35cc)", border: solanaConnected ? "1px solid rgba(153,69,255,0.3)" : "none", color: solanaConnected ? "#9945FF" : "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
    {solanaConnected ? solanaAccount?.slice(0,4) + "..." + solanaAccount?.slice(-4) : "Connect"}
  </button>
) : (
  <ConnectButton.Custom>
    {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
      const connected = mounted && account && chain;
      return (
        <button onClick={connected ? openAccountModal : openConnectModal} style={{ padding: "8px 14px", borderRadius: 12, background: connected ? "rgba(212,160,23,0.1)" : "linear-gradient(135deg,#D4A017,#F5C842)", border: connected ? "1px solid rgba(212,160,23,0.3)" : "none", color: connected ? "#D4A017" : "#0a0600", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {connected ? account.displayName : "Connect"}
        </button>
      );
    }}
  </ConnectButton.Custom>
)}

{/* Mobile bottom navbar */}
<nav className="pg-nav-mobile">
  <a href="/swap" className="pg-nav-mobile-item active">
    <span>⚡</span><span>Swap</span>
  </a>
  <a href="/dust" className="pg-nav-mobile-item">
    <span>🧹</span><span>Sweep</span>
  </a>
  <a href="/profile" className="pg-nav-mobile-item">
    <span>👤</span><span>Profile</span>
  </a>
</nav>
    </>
  );
}