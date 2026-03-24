"use client";

import { useState, useEffect } from "react";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { ethereum, polygon, bsc, arbitrum, avalanche, base, optimism } from "thirdweb/chains";
import { useSwitchActiveWalletChain } from "thirdweb/react";
import DustSweeper from "./DustSweeper";
import SolanaSwap from "./SolanaSwap";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "demo",
});

const WALLETS = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("com.trustwallet.app"),
  createWallet("walletConnect"),
];

const LEVELS = [
  { name: "Fossil",  emoji: "🪨", min: 0,     max: 49,   color: "#8B7355", bg: "rgba(139,115,85,0.15)" },
  { name: "Egg",     emoji: "🥚", min: 50,    max: 499,  color: "#C8B89A", bg: "rgba(200,184,154,0.15)" },
  { name: "Reptile", emoji: "🦎", min: 500,   max: 1999, color: "#4CAF50", bg: "rgba(76,175,80,0.15)" },
  { name: "Raptor",  emoji: "🦴", min: 2000,  max: 4999, color: "#2196F3", bg: "rgba(33,150,243,0.15)" },
  { name: "Rex",     emoji: "🦖", min: 5000,  max: 9999, color: "#FF5722", bg: "rgba(255,87,34,0.15)" },
  { name: "Pangean", emoji: "🌋", min: 10000, max: Infinity, color: "#D4A017", bg: "rgba(212,160,23,0.15)" },
];

function getLevel(n) { return LEVELS.find(l => n >= l.min && n <= l.max) || LEVELS[0]; }
function getProgress(n) { const l = getLevel(n); if (l.max === Infinity) return 100; return Math.floor(((n - l.min) / (l.max - l.min + 1)) * 100); }
function getNextLevel(n) { const i = LEVELS.findIndex(l => n >= l.min && n <= l.max); return i < LEVELS.length - 1 ? LEVELS[i + 1] : null; }

const L = {
  ETH:"https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  USDC:"https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USDT:"https://assets.coingecko.com/coins/images/325/small/tether.png",
  WBTC:"https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
  DAI:"https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png",
  UNI:"https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  MATIC:"https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  WETH:"https://assets.coingecko.com/coins/images/2518/small/weth.png",
  BNB:"https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  BUSD:"https://assets.coingecko.com/coins/images/9576/small/BUSD.png",
  CAKE:"https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png",
  ARB:"https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  AVAX:"https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  OP:"https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  BASE:"https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg",
  SOL:"https://assets.coingecko.com/coins/images/4128/small/solana.png",
  LINK:"https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  AAVE:"https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
  SHIB:"https://assets.coingecko.com/coins/images/11939/small/shiba.png",
  PEPE:"https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
  LDO:"https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png",
  MKR:"https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png",
  CRV:"https://assets.coingecko.com/coins/images/12124/small/Curve.png",
  GRT:"https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png",
  SAND:"https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg",
  MANA:"https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png",
  APE:"https://assets.coingecko.com/coins/images/24383/small/apecoin.jpg",
  LRC:"https://assets.coingecko.com/coins/images/913/small/LRC.png",
  IMX:"https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png",
};

const COINGECKO_IDS = {
  ETH:"ethereum",AVAX:"avalanche-2",BNB:"binancecoin",MATIC:"matic-network",ARB:"arbitrum",OP:"optimism",
  USDC:"usd-coin",USDT:"tether",DAI:"dai",WBTC:"wrapped-bitcoin",WETH:"weth",BUSD:"binance-usd",
  UNI:"uniswap",CAKE:"pancakeswap-token",LINK:"chainlink",AAVE:"aave",SHIB:"shiba-inu",PEPE:"pepe",
  LDO:"lido-dao",MKR:"maker",CRV:"curve-dao-token",GRT:"the-graph",SAND:"the-sandbox",MANA:"decentraland",
  APE:"apecoin",LRC:"loopring",IMX:"immutable-x",
};

const FALLBACK = {
  ETH:1850,AVAX:35,BNB:320,MATIC:0.9,ARB:1.2,OP:2.5,USDC:1,USDT:1,DAI:1,WBTC:65000,WETH:1850,
  BUSD:1,UNI:8,CAKE:2.5,LINK:14,AAVE:90,SHIB:0.000009,PEPE:0.000007,LDO:1.8,MKR:1500,
  CRV:0.4,GRT:0.15,SAND:0.35,MANA:0.35,APE:1.2,LRC:0.18,IMX:1.5,
};

const EVM_CHAINS = [
  {id:1,     name:"Ethereum", shortName:"ETH",  color:"#627EEA",chain:ethereum, logo:L.ETH},
  {id:137,   name:"Polygon",  shortName:"MATIC",color:"#8247E5",chain:polygon,  logo:L.MATIC},
  {id:56,    name:"BNB Chain",shortName:"BNB",  color:"#F3BA2F",chain:bsc,      logo:L.BNB},
  {id:42161, name:"Arbitrum", shortName:"ARB",  color:"#28A0F0",chain:arbitrum, logo:L.ARB},
  {id:43114, name:"Avalanche",shortName:"AVAX", color:"#E84142",chain:avalanche,logo:L.AVAX},
  {id:8453,  name:"Base",     shortName:"BASE", color:"#0052FF",chain:base,     logo:L.BASE},
  {id:10,    name:"Optimism", shortName:"OP",   color:"#FF0420",chain:optimism, logo:L.OP},
];
const SOLANA_CHAIN = {id:"solana",name:"Solana",shortName:"SOL",color:"#9945FF",logo:L.SOL};

const TOKENS_BY_CHAIN = {
  1:[
    {symbol:"ETH", name:"Ethereum",   address:"NATIVE",logo:L.ETH, decimals:18},
    {symbol:"USDC",name:"USD Coin",   address:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",logo:L.USDC,decimals:6},
    {symbol:"USDT",name:"Tether",     address:"0xdAC17F958D2ee523a2206206994597C13D831ec7",logo:L.USDT,decimals:6},
    {symbol:"WBTC",name:"Wrapped BTC",address:"0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",logo:L.WBTC,decimals:8},
    {symbol:"DAI", name:"Dai",        address:"0x6B175474E89094C44Da98b954EedeAC495271d0F",logo:L.DAI, decimals:18},
    {symbol:"UNI", name:"Uniswap",    address:"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",logo:L.UNI, decimals:18},
    {symbol:"LINK",name:"Chainlink",  address:"0x514910771AF9Ca656af840dff83E8264EcF986CA",logo:L.LINK,decimals:18},
    {symbol:"AAVE",name:"Aave",       address:"0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",logo:L.AAVE,decimals:18},
    {symbol:"SHIB",name:"Shiba Inu",  address:"0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",logo:L.SHIB,decimals:18},
    {symbol:"PEPE",name:"Pepe",       address:"0x6982508145454Ce325dDbE47a25d4ec3d2311933",logo:L.PEPE,decimals:18},
    {symbol:"LDO", name:"Lido DAO",   address:"0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",logo:L.LDO, decimals:18},
    {symbol:"MKR", name:"Maker",      address:"0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",logo:L.MKR, decimals:18},
    {symbol:"CRV", name:"Curve",      address:"0xD533a949740bb3306d119CC777fa900bA034cd52",logo:L.CRV, decimals:18},
    {symbol:"GRT", name:"The Graph",  address:"0xc944E90C64B2c07662A292be6244BDf05Cda44a7",logo:L.GRT, decimals:18},
    {symbol:"SAND",name:"Sandbox",    address:"0x3845badAde8e6dFF049820680d1F14bD3903a5d0",logo:L.SAND,decimals:18},
    {symbol:"MANA",name:"Decentraland",address:"0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",logo:L.MANA,decimals:18},
    {symbol:"APE", name:"ApeCoin",    address:"0x4d224452801ACEd8B2F0aebE155379bb5D594381",logo:L.APE, decimals:18},
    {symbol:"LRC", name:"Loopring",   address:"0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD",logo:L.LRC, decimals:18},
    {symbol:"IMX", name:"Immutable X",address:"0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF",logo:L.IMX, decimals:18},
  ],
  137:[
    {symbol:"MATIC",name:"Polygon",    address:"NATIVE",logo:L.MATIC,decimals:18},
    {symbol:"USDC", name:"USD Coin",   address:"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",logo:L.USDC,decimals:6},
    {symbol:"USDT", name:"Tether",     address:"0xc2132D05D31c914a87C6611C10748AEb04B58e8F",logo:L.USDT,decimals:6},
    {symbol:"WETH", name:"Wrapped ETH",address:"0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",logo:L.WETH,decimals:18},
    {symbol:"DAI",  name:"Dai",        address:"0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",logo:L.DAI, decimals:18},
    {symbol:"LINK", name:"Chainlink",  address:"0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",logo:L.LINK,decimals:18},
    {symbol:"AAVE", name:"Aave",       address:"0xD6DF932A45C0f255f85145f286eA0b292B21C90B",logo:L.AAVE,decimals:18},
  ],
  56:[
    {symbol:"BNB", name:"BNB",        address:"NATIVE",logo:L.BNB, decimals:18},
    {symbol:"BUSD",name:"BUSD",       address:"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",logo:L.BUSD,decimals:18},
    {symbol:"USDT",name:"Tether",     address:"0x55d398326f99059fF775485246999027B3197955",logo:L.USDT,decimals:18},
    {symbol:"CAKE",name:"PancakeSwap",address:"0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",logo:L.CAKE,decimals:18},
    {symbol:"ETH", name:"Ethereum",   address:"0x2170Ed0880ac9A755fd29B2688956BD959F933F8",logo:L.ETH, decimals:18},
    {symbol:"LINK",name:"Chainlink",  address:"0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD",logo:L.LINK,decimals:18},
  ],
  42161:[
    {symbol:"ETH", name:"Ethereum",   address:"NATIVE",logo:L.ETH, decimals:18},
    {symbol:"ARB", name:"Arbitrum",   address:"0x912CE59144191C1204E64559FE8253a0e49E6548",logo:L.ARB, decimals:18},
    {symbol:"USDC",name:"USD Coin",   address:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",logo:L.USDC,decimals:6},
    {symbol:"USDT",name:"Tether",     address:"0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",logo:L.USDT,decimals:6},
    {symbol:"LINK",name:"Chainlink",  address:"0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",logo:L.LINK,decimals:18},
    {symbol:"AAVE",name:"Aave",       address:"0xba5DdD1f9d7F570dc94a51479a000E3BCE967196",logo:L.AAVE,decimals:18},
  ],
  43114:[
    {symbol:"AVAX",name:"Avalanche",  address:"NATIVE",logo:L.AVAX,decimals:18},
    {symbol:"USDC",name:"USD Coin",   address:"0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",logo:L.USDC,decimals:6},
    {symbol:"USDT",name:"Tether",     address:"0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",logo:L.USDT,decimals:6},
    {symbol:"WETH",name:"Wrapped ETH",address:"0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",logo:L.WETH,decimals:18},
  ],
  8453:[
    {symbol:"ETH", name:"Ethereum",   address:"NATIVE",logo:L.ETH, decimals:18},
    {symbol:"USDC",name:"USD Coin",   address:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",logo:L.USDC,decimals:6},
    {symbol:"DAI", name:"Dai",        address:"0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",logo:L.DAI, decimals:18},
  ],
  10:[
    {symbol:"ETH", name:"Ethereum",   address:"NATIVE",logo:L.ETH, decimals:18},
    {symbol:"OP",  name:"Optimism",   address:"0x4200000000000000000000000000000000000042",logo:L.OP,  decimals:18},
    {symbol:"USDC",name:"USD Coin",   address:"0x7F5c764cBc14f9669B88837ca1490cCa17c31607",logo:L.USDC,decimals:6},
    {symbol:"USDT",name:"Tether",     address:"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",logo:L.USDT,decimals:6},
  ],
};

function TokenLogo({src,size=28}) {
  const [s,setS] = useState(src);
  useEffect(()=>{setS(src)},[src]);
  return <img src={s} width={size} height={size} style={{borderRadius:"50%",objectFit:"cover",flexShrink:0,background:"#333"}} onError={()=>setS(`https://ui-avatars.com/api/?name=?&size=${size}&background=333&color=fff&rounded=true`)} />;
}

const STARS = Array.from({length:40},(_,i)=>({id:i,top:`${(i*37+11)%60}%`,left:`${(i*53+7)%100}%`,size:i%4===0?2:1,opacity:((i*17+3)%6)*0.08+0.1}));

function PangeaBG() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",background:"linear-gradient(180deg,#060408 0%,#0a0805 40%,#100c04 70%,#180e00 100%)"}}>
      {STARS.map(s=><div key={s.id} style={{position:"absolute",width:s.size,height:s.size,background:"#fff",borderRadius:"50%",top:s.top,left:s.left,opacity:s.opacity}}/>)}
      <div style={{position:"absolute",bottom:0,left:"8%",width:0,height:0,borderLeft:"140px solid transparent",borderRight:"140px solid transparent",borderBottom:"300px solid #120800"}}/>
      <div style={{position:"absolute",bottom:180,left:"calc(8% + 20px)",width:220,height:120,background:"#ff4400",borderRadius:"50%",filter:"blur(50px)",opacity:0.15,animation:"pulse 4s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:0,left:"42%",width:0,height:0,borderLeft:"220px solid transparent",borderRight:"220px solid transparent",borderBottom:"420px solid #150a00"}}/>
      <div style={{position:"absolute",bottom:280,left:"calc(42% + 80px)",width:320,height:180,background:"#ff5500",borderRadius:"50%",filter:"blur(70px)",opacity:0.12,animation:"pulse 5s ease-in-out infinite",animationDelay:"1s"}}/>
      <div style={{position:"absolute",bottom:0,right:"6%",width:0,height:0,borderLeft:"170px solid transparent",borderRight:"170px solid transparent",borderBottom:"350px solid #120800"}}/>
      <div style={{position:"absolute",bottom:200,right:"calc(6% + 30px)",width:260,height:150,background:"#ff4400",borderRadius:"50%",filter:"blur(60px)",opacity:0.13,animation:"pulse 4.5s ease-in-out infinite",animationDelay:"2s"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:120,background:"linear-gradient(180deg,transparent,rgba(30,15,0,0.6))"}}/>
      <style>{`@keyframes pulse{0%,100%{opacity:0.1}50%{opacity:0.2}}@keyframes levelUp{0%{transform:scale(0.5) translateX(-50%);opacity:0}50%{transform:scale(1.2) translateX(-50%);opacity:1}100%{transform:scale(1) translateX(-50%);opacity:1}}`}</style>
    </div>
  );
}

// Multi-API swap function
async function executeSwap({chainId, fromToken, toToken, amountWei, decimals, walletAddress, slippage}) {
  const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const src = fromToken === "NATIVE" ? NATIVE : fromToken;
  const dest = toToken === "NATIVE" ? NATIVE : toToken;
  const amountReadable = (Number(amountWei) / Math.pow(10, decimals)).toString();

  const OO_CHAINS = {1:"eth",137:"polygon",56:"bsc",42161:"arbitrum",43114:"avax",8453:"base",10:"optimism"};
  const chain = OO_CHAINS[chainId] || "eth";

  // Try OpenOcean
  try {
    const params = new URLSearchParams({type:"quote",chainId:chainId.toString(),inTokenAddress:src,outTokenAddress:dest,amount:amountReadable,slippage:slippage.toString(),account:walletAddress});
    const res = await fetch(`/api/openocean?${params}`);
    const data = await res.json();
    if (data?.data?.to && data?.data?.data) {
      return {
        to: data.data.to,
        data: data.data.data,
        value: data.data.value || "0",
        gas: data.data.estimatedGas,
        source: "OpenOcean",
      };
    }
  } catch(e) { console.log("OpenOcean failed:", e.message); }

  // Try Paraswap
  try {
    const priceParams = new URLSearchParams({type:"price",network:chainId.toString(),srcToken:src,destToken:dest,amount:amountWei});
    const priceRes = await fetch(`/api/paraswap?${priceParams}`);
    const priceData = await priceRes.json();
    if (priceData?.priceRoute) {
      const txParams = new URLSearchParams({network:chainId.toString(),userAddress:walletAddress,ignoreChecks:"true",ignoreGasEstimate:"true",maxImpact:"100"});
      const txRes = await fetch(`/api/paraswap?${txParams}`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({srcToken:src,destToken:dest,srcAmount:amountWei,priceRoute:priceData.priceRoute,userAddress:walletAddress,slippage:Math.floor(slippage*100),maxImpact:100}),
      });
      const txData = await txRes.json();
      const tx = txData?.transaction || (txData?.to ? txData : null);
      if (tx?.to) {
        return { to: tx.to, data: tx.data, value: tx.value || "0", gas: tx.gas, source: "Paraswap" };
      }
    }
  } catch(e) { console.log("Paraswap failed:", e.message); }

  throw new Error("No swap route found. Please try again.");
}

export default function SwapWidget() {
  const account = useActiveAccount();
  const switchChain = useSwitchActiveWalletChain();
  const [selectedChain, setSelectedChain] = useState(EVM_CHAINS[0]);
  const [fromToken, setFromToken] = useState(TOKENS_BY_CHAIN[1][0]);
  const [toToken, setToToken] = useState(TOKENS_BY_CHAIN[1][1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(1.0);
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChainMenu, setShowChainMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [swapHistory, setSwapHistory] = useState([]);
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [swapCount, setSwapCount] = useState(0);
  const [levelUpNotif, setLevelUpNotif] = useState(null);
  const [showDustSweeper, setShowDustSweeper] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [balances, setBalances] = useState({});
  const [swapSource, setSwapSource] = useState(null);

  const isSolana = selectedChain.id === "solana";
  const tokens = isSolana ? [] : (TOKENS_BY_CHAIN[selectedChain.id] || []);
  const currentLevel = getLevel(swapCount);
  const progress = getProgress(swapCount);
  const nextLevel = getNextLevel(swapCount);

  useEffect(() => {
    const saved = localStorage.getItem("pangeon_swap_count");
    if (saved) setSwapCount(parseInt(saved));
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = Object.values(COINGECKO_IDS).join(",");
        const res = await fetch(`/api/prices?ids=${ids}`);
        const data = await res.json();
        const np = {}; const nc = {};
        Object.entries(COINGECKO_IDS).forEach(([sym,id]) => {
          if (data[id]) { np[sym] = data[id].usd; nc[sym] = data[id].usd_24h_change; }
        });
        setPrices(np); setPriceChanges(nc); setPricesLoaded(true);
      } catch(e) { setPricesLoaded(true); }
    };
    fetchPrices();
    const iv = setInterval(fetchPrices, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!account?.address || isSolana) { setBalances({}); return; }
      try {
        const chainHex = "0x" + selectedChain.id.toString(16);
        const res = await fetch(`https://deep-index.moralis.io/api/v2.2/${account.address}/erc20?chain=${chainHex}`,{headers:{"X-API-Key":process.env.NEXT_PUBLIC_MORALIS_API_KEY||""}});
        const data = await res.json();
        const nb = {};
        const list = Array.isArray(data) ? data : (data.result || []);
        list.forEach(t => { nb[t.token_address.toLowerCase()] = Number(t.balance) / Math.pow(10, Number(t.decimals)); });
        const nr = await fetch(`https://deep-index.moralis.io/api/v2.2/${account.address}/balance?chain=${chainHex}`,{headers:{"X-API-Key":process.env.NEXT_PUBLIC_MORALIS_API_KEY||""}});
        const nd = await nr.json();
        if (nd.balance) nb["NATIVE"] = Number(nd.balance) / Math.pow(10, 18);
        setBalances(nb);
      } catch(e) { console.error("Balance error:", e); }
    };
    fetchBalances();
  }, [account?.address, selectedChain.id, isSolana]);

  const getBalance = (token) => {
    if (!token || !account) return null;
    if (token.address === "NATIVE") return balances["NATIVE"] ?? null;
    const b = balances[token.address.toLowerCase()];
    return b !== undefined ? b : null;
  };

  const getPrice = (sym) => prices[sym] || FALLBACK[sym] || 1;

  useEffect(() => {
    if (!isSolana) {
      const t = TOKENS_BY_CHAIN[selectedChain.id] || [];
      setFromToken(t[0]); setToToken(t[1]);
      setFromAmount(""); setToAmount(""); setSwapSource(null);
    }
  }, [selectedChain]);

  useEffect(() => {
    if (isSolana || !fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) === 0) { setToAmount(""); return; }
    const t = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        if (!selectedChain?.id || !fromToken?.address || !toToken?.address) {
          setToAmount(((Number(fromAmount) * getPrice(fromToken?.symbol)) / getPrice(toToken?.symbol)).toFixed(6));
          return;
        }
        const decimals = fromToken?.decimals || 18;
        const amountWei = BigInt(Math.floor(Number(fromAmount) * Math.pow(10, decimals))).toString();
        const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        const src = fromToken.address === "NATIVE" ? NATIVE : fromToken.address;
        const dest = toToken.address === "NATIVE" ? NATIVE : toToken.address;
        const amountReadable = (Number(amountWei) / Math.pow(10, decimals)).toString();
        const OO = {1:"eth",137:"polygon",56:"bsc",42161:"arbitrum",43114:"avax",8453:"base",10:"optimism"};
        const params = new URLSearchParams({type:"price",chainId:selectedChain.id.toString(),inTokenAddress:src,outTokenAddress:dest,amount:amountReadable});
        const res = await fetch(`/api/openocean?${params}`);
        const data = await res.json();
        if (data?.data?.outAmount) {
          const toDecimals = toToken?.decimals || 18;
          setToAmount((Number(data.data.outAmount) / Math.pow(10, toDecimals)).toFixed(6));
        } else {
          setToAmount(((Number(fromAmount) * getPrice(fromToken?.symbol)) / getPrice(toToken?.symbol)).toFixed(6));
        }
      } catch {
        setToAmount(((Number(fromAmount) * getPrice(fromToken?.symbol)) / getPrice(toToken?.symbol)).toFixed(6));
      } finally { setQuoteLoading(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [fromAmount, fromToken, toToken, prices, isSolana]);

  const handleSwapTokens = () => {
    const tmp = fromToken; setFromToken(toToken); setToToken(tmp);
    setFromAmount(toAmount); setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!account) { setError("Please connect your wallet first!"); return; }
    if (!fromAmount || Number(fromAmount) === 0) { setError("Please enter an amount."); return; }
    if (!selectedChain?.id || !fromToken?.address) { setError("No token selected."); return; }
    setError(null); setLoading(true); setSwapSource(null);
    try {
      const decimals = fromToken?.decimals || 18;
      const amountWei = BigInt(Math.floor(Number(fromAmount) * Math.pow(10, decimals))).toString();
      const quote = await executeSwap({
        chainId: Number(selectedChain.id),
        fromToken: fromToken.address,
        toToken: toToken.address,
        amountWei,
        decimals,
        walletAddress: account.address,
        slippage,
      });
      setSwapSource(quote.source);

      // Approve if needed
      if (fromToken.address !== "NATIVE") {
        try {
          const { approveToken } = await import("../lib/sendSwapTx");
          await approveToken({ chainId: Number(selectedChain.id), tokenAddress: fromToken.address, spenderAddress: quote.to });
          await new Promise(r => setTimeout(r, 3000));
        } catch(e) { console.log("Approve skipped:", e.message); }
      }

      // Send transaction
      const { sendSwapTransaction } = await import("../lib/sendSwapTx");
      const tx = await sendSwapTransaction({
        chainId: Number(selectedChain.id),
        to: quote.to,
        data: quote.data,
        value: quote.value || "0",
        gas: quote.gas,
      });
      console.log("TX result:", tx);
      const hash = tx.transactionHash || tx.hash || "confirmed";
      setTxHash(hash);
      setSwapHistory(prev => [{from:fromToken.symbol,to:toToken.symbol,amountIn:fromAmount,amountOut:toAmount,chain:selectedChain.name,hash,time:new Date().toLocaleTimeString()},...prev.slice(0,4)]);
      const newCount = swapCount + 1;
      const oldLvl = getLevel(swapCount);
      const newLvl = getLevel(newCount);
      setSwapCount(newCount);
      localStorage.setItem("pangeon_swap_count", newCount.toString());
      if (newLvl.name !== oldLvl.name) { setLevelUpNotif(newLvl); setTimeout(()=>setLevelUpNotif(null),4000); }
    } catch(e) {
      setError("Swap error: " + (e.message || "unknown"));
    }
    setLoading(false); setFromAmount(""); setToAmount("");
  };

  const filteredFrom = tokens.filter(t => t.symbol !== toToken?.symbol && (t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredTo = tokens.filter(t => t.symbol !== fromToken?.symbol && (t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase())));

  const PriceTag = ({symbol}) => {
    const p = getPrice(symbol); const c = priceChanges[symbol];
    if (!pricesLoaded) return <span style={{color:"rgba(212,160,23,0.3)",fontSize:11}}>...</span>;
    return <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>${p.toLocaleString(undefined,{maximumFractionDigits:p<0.01?8:p<1?4:2})}{c!==undefined&&<span style={{color:c>=0?"#00c878":"#ff6b6b",marginLeft:4}}>{c>=0?"▲":"▼"}{Math.abs(c).toFixed(2)}%</span>}</span>;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}body{background:#060408;}
        .nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(6,4,8,0.8);backdrop-filter:blur(20px);border-bottom:1px solid rgba(200,150,50,0.1);height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 24px;gap:16px;}
        .nav-logo{display:flex;align-items:center;gap:10px;justify-content:flex-start;}
        .nav-logo-text{font-family:'Cinzel',serif;font-size:22px;font-weight:700;background:linear-gradient(135deg,#D4A017,#F5C842,#D4A017);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px;white-space:nowrap;}
        .nav-links{display:flex;align-items:center;gap:4px;justify-content:center;}
        .nav-link{padding:8px 16px;border-radius:12px;border:none;background:transparent;color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
        .nav-link:hover{color:#D4A017;background:rgba(212,160,23,0.08);}
        .nav-right{display:flex;align-items:center;gap:8px;justify-content:flex-end;position:relative;}
        .chain-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:12px;border:1px solid rgba(212,160,23,0.2);background:rgba(212,160,23,0.06);color:#D4A017;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
        .chain-btn:hover{background:rgba(212,160,23,0.12);}
        .level-badge{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:12px;cursor:pointer;transition:all 0.2s;white-space:nowrap;border:1px solid;}
        .page{min-height:100vh;padding-top:100px;padding-bottom:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;font-family:'DM Sans',sans-serif;}
        .swap-wrap{width:100%;max-width:480px;padding:0 16px;position:relative;z-index:10;}
        .card{background:rgba(15,10,5,0.85);border:1px solid rgba(212,160,23,0.15);border-radius:24px;padding:8px;backdrop-filter:blur(20px);box-shadow:0 8px 48px rgba(0,0,0,0.6);}
        .token-box{background:rgba(20,14,6,0.9);border:1px solid rgba(212,160,23,0.08);border-radius:20px;padding:16px 20px;position:relative;transition:all 0.2s;}
        .token-box:hover{border-color:rgba(212,160,23,0.2);}
        .token-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
        .token-select-btn{display:flex;align-items:center;gap:8px;padding:8px 12px 8px 8px;border-radius:50px;border:1px solid rgba(212,160,23,0.2);background:linear-gradient(135deg,rgba(212,160,23,0.12),rgba(212,160,23,0.06));color:#fff;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
        .token-select-btn:hover{border-color:rgba(212,160,23,0.4);transform:scale(1.02);}
        .amount-input{flex:1;background:transparent;border:none;color:#fff;font-family:'Cinzel',serif;font-size:32px;font-weight:600;text-align:right;outline:none;min-width:0;width:100%;}
        .amount-input::placeholder{color:rgba(255,255,255,0.1);}
        .amount-input:read-only{color:rgba(255,255,255,0.4);}
        .amount-input::-webkit-outer-spin-button,.amount-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
        .amount-input[type=number]{-moz-appearance:textfield;}
        .balance-row{display:flex;justify-content:space-between;align-items:center;margin-top:6px;min-height:18px;}
        .balance-usd{font-size:12px;color:rgba(255,255,255,0.25);}
        .balance-amount{font-size:12px;color:rgba(255,255,255,0.35);}
        .balance-amount span{color:rgba(212,160,23,0.8);font-weight:600;cursor:pointer;}
        .arrow-wrap{display:flex;justify-content:center;padding:4px 0;margin:-2px 0;}
        .arrow-btn{width:40px;height:40px;border-radius:12px;background:rgba(10,7,2,0.9);border:2px solid rgba(212,160,23,0.2);color:rgba(212,160,23,0.6);font-size:16px;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;justify-content:center;}
        .arrow-btn:hover{border-color:#D4A017;color:#D4A017;transform:rotate(180deg);}
        .swap-btn{width:100%;margin-top:8px;padding:18px;border-radius:20px;border:none;font-family:'Cinzel',serif;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.2s;letter-spacing:1px;}
        .swap-btn.active{background:linear-gradient(135deg,#D4A017,#F5C842,#D4A017);color:#0a0600;}
        .swap-btn.active:hover{opacity:0.9;transform:translateY(-1px);box-shadow:0 8px 24px rgba(212,160,23,0.3);}
        .swap-btn.disabled{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.2);cursor:not-allowed;border:1px solid rgba(212,160,23,0.08);}
        .swap-btn.loading{background:rgba(212,160,23,0.2);color:rgba(212,160,23,0.6);cursor:not-allowed;}
        .quote-box{padding:12px 20px;}
        .quote-row{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,0.35);margin-bottom:6px;}
        .quote-row span:last-child{color:rgba(212,160,23,0.7);font-weight:500;}
        .settings-panel{background:rgba(20,14,6,0.9);border-radius:16px;padding:14px 16px;margin-bottom:6px;border:1px solid rgba(212,160,23,0.08);}
        .slip-btn{flex:1;padding:7px 0;border-radius:10px;border:1px solid rgba(212,160,23,0.1);background:transparent;color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
        .slip-btn.active{border-color:#D4A017;background:rgba(212,160,23,0.12);color:#D4A017;}
        .chain-dropdown{position:absolute;top:54px;right:0;width:260px;background:rgba(12,8,3,0.98);border:1px solid rgba(212,160,23,0.15);border-radius:20px;z-index:300;box-shadow:0 16px 48px rgba(0,0,0,0.7);padding:8px;backdrop-filter:blur(20px);}
        .chain-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:none;background:transparent;color:#fff;cursor:pointer;width:100%;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
        .chain-item:hover{background:rgba(212,160,23,0.06);}
        .chain-item.active{background:rgba(212,160,23,0.1);}
        .chain-item-info{flex:1;min-width:0;}
        .chain-item-name{font-weight:600;font-size:13px;white-space:nowrap;}
        .chain-item-symbol{font-size:11px;color:rgba(255,255,255,0.3);}
        .history-card{background:rgba(15,10,5,0.85);border:1px solid rgba(212,160,23,0.12);border-radius:24px;padding:20px;margin-top:12px;backdrop-filter:blur(20px);}
        .history-item{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(212,160,23,0.06);}
        .history-item:last-child{border-bottom:none;padding-bottom:0;}
        .error-box{margin:6px 0;padding:12px 16px;border-radius:14px;background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.2);color:#ff6b6b;font-size:13px;}
        .success-box{margin:6px 0;padding:12px 16px;border-radius:14px;background:rgba(212,160,23,0.08);border:1px solid rgba(212,160,23,0.2);color:#D4A017;font-size:13px;}
        .card-header{display:flex;align-items:center;justify-content:space-between;padding:12px 12px 8px;}
        .card-title{font-family:'Cinzel',serif;font-size:18px;font-weight:600;color:#D4A017;letter-spacing:1px;}
        .settings-btn{width:36px;height:36px;border-radius:10px;border:none;background:transparent;color:rgba(212,160,23,0.4);font-size:18px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;}
        .settings-btn:hover{background:rgba(212,160,23,0.08);color:#D4A017;}
        .price-ticker{display:flex;gap:20px;overflow-x:auto;padding:8px 24px;border-bottom:1px solid rgba(212,160,23,0.06);background:rgba(6,4,8,0.6);scrollbar-width:none;}
        .price-ticker::-webkit-scrollbar{display:none;}
        .price-ticker-item{display:flex;align-items:center;gap:6px;white-space:nowrap;font-size:12px;font-family:'DM Sans',sans-serif;}
        .profile-modal{position:absolute;top:54px;right:0;width:300px;background:rgba(12,8,3,0.98);border:1px solid rgba(212,160,23,0.2);border-radius:20px;z-index:300;box-shadow:0 16px 48px rgba(0,0,0,0.7);padding:20px;backdrop-filter:blur(20px);}
        .level-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid;margin-bottom:6px;}
        .level-up-notif{position:fixed;top:80px;left:50%;z-index:9999;background:rgba(12,8,3,0.95);border-radius:20px;padding:16px 24px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:levelUp 0.5s ease forwards;}
      `}</style>

      <PangeaBG />

      {levelUpNotif && (
        <div className="level-up-notif" style={{border:`1px solid ${levelUpNotif.color}`}}>
          <span style={{fontSize:32}}>{levelUpNotif.emoji}</span>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:levelUpNotif.color,fontSize:15}}>Level Up!</div>
            <div style={{color:"#fff",fontSize:13}}>You are now <strong>{levelUpNotif.name}</strong> 🎉</div>
          </div>
        </div>
      )}

      <nav className="nav">
        <div className="nav-logo">
          <img src="/logo.png" style={{width:44,height:44,objectFit:"contain"}} />
          <span className="nav-logo-text">PANGEON</span>
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={()=>setShowDustSweeper(true)}>🧹 Sweep</button>
        </div>
        <div className="nav-right">
          <button className="level-badge" style={{borderColor:`${currentLevel.color}40`,background:currentLevel.bg,color:currentLevel.color}} onClick={()=>setShowProfile(!showProfile)}>
            <span style={{fontSize:16}}>{currentLevel.emoji}</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700}}>{currentLevel.name}</span>
            <span style={{fontSize:10,opacity:0.6}}>#{swapCount}</span>
          </button>

          <button className="chain-btn" onClick={()=>setShowChainMenu(!showChainMenu)}>
            <TokenLogo src={selectedChain.logo} size={18} />
            {selectedChain.shortName}
            <span style={{fontSize:10,opacity:0.6}}>▾</span>
          </button>

          {showProfile && (
            <div className="profile-modal">
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <span style={{fontSize:40}}>{currentLevel.emoji}</span>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:18,fontWeight:700,color:currentLevel.color}}>{currentLevel.name}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{swapCount} swaps completed</div>
                </div>
              </div>
              {nextLevel && (
                <>
                  <div style={{width:"100%",height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",borderRadius:4,width:`${progress}%`,background:`linear-gradient(90deg,${currentLevel.color},${nextLevel.color})`,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:16}}>
                    <span>{currentLevel.name} ({currentLevel.min})</span><span>{progress}%</span><span>{nextLevel.name} ({nextLevel.min})</span>
                  </div>
                </>
              )}
              {LEVELS.map(l => {
                const u = swapCount >= l.min; const ic = l.name === currentLevel.name;
                return <div key={l.name} className="level-item" style={{borderColor:ic?l.color:u?`${l.color}40`:"rgba(255,255,255,0.06)",background:ic?l.bg:"transparent",opacity:u?1:0.4}}>
                  <span style={{fontSize:20}}>{l.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,color:ic?l.color:"#fff"}}>{l.name}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{l.max===Infinity?`${l.min}+ swaps`:`${l.min} - ${l.max} swaps`}</div>
                  </div>
                  <span style={{color:u?"#00c878":"transparent",fontSize:14}}>✓</span>
                </div>;
              })}
            </div>
          )}

          {showChainMenu && (
            <div className="chain-dropdown">
              <div style={{fontSize:12,color:"rgba(212,160,23,0.5)",padding:"4px 12px 8px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.8px"}}>Select network</div>
              {EVM_CHAINS.map(c => (
                <button key={c.id} className={`chain-item ${selectedChain.id===c.id?"active":""}`} onClick={()=>{setSelectedChain(c);setShowChainMenu(false);if(c.chain)switchChain(c.chain);}}>
                  <TokenLogo src={c.logo} size={24}/>
                  <div className="chain-item-info">
                    <div className="chain-item-name">{c.name}</div>
                    <div className="chain-item-symbol">{c.shortName}</div>
                  </div>
                  {selectedChain.id===c.id&&<span style={{marginLeft:"auto",color:"#D4A017",flexShrink:0}}>✓</span>}
                </button>
              ))}
              <button className={`chain-item ${isSolana?"active":""}`} onClick={()=>{setSelectedChain(SOLANA_CHAIN);setShowChainMenu(false);}} style={{borderTop:"1px solid rgba(153,69,255,0.15)",marginTop:4,paddingTop:12}}>
                <TokenLogo src={L.SOL} size={24}/>
                <div className="chain-item-info">
                  <div className="chain-item-name">Solana</div>
                  <div className="chain-item-symbol" style={{color:"#9945FF"}}>SOL</div>
                </div>
                {isSolana&&<span style={{marginLeft:"auto",color:"#9945FF",flexShrink:0}}>✓</span>}
              </button>
            </div>
          )}

          <ConnectButton client={client} wallets={WALLETS} theme="dark"
            connectButton={{label:"Connect",style:{background:"linear-gradient(135deg,#D4A017,#F5C842)",color:"#0a0600",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"13px",borderRadius:"12px",padding:"8px 16px",border:"none",letterSpacing:"0.5px",whiteSpace:"nowrap"}}}
            connectedButton={{style:{background:"rgba(212,160,23,0.08)",color:"#D4A017",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"13px",borderRadius:"12px",padding:"8px 12px",border:"1px solid rgba(212,160,23,0.2)",whiteSpace:"nowrap"}}}
          />
        </div>
      </nav>

      {pricesLoaded && (
        <div className="price-ticker" style={{position:"fixed",top:64,left:0,right:0,zIndex:999}}>
          {Object.entries(COINGECKO_IDS).map(([symbol]) => (
            <div key={symbol} className="price-ticker-item">
              <TokenLogo src={L[symbol]} size={14}/>
              <span style={{color:"#fff",fontWeight:600,marginRight:2}}>{symbol}</span>
              <PriceTag symbol={symbol}/>
            </div>
          ))}
        </div>
      )}

      <div className="page" onClick={()=>{setShowChainMenu(false);setSearchQuery("");setShowProfile(false);setShowFromList(false);setShowToList(false);}}>
        <div className="swap-wrap">
          {isSolana ? (
            <div className="card" onClick={e=>e.stopPropagation()}>
              <div className="card-header">
                <span className="card-title" style={{color:"#9945FF"}}>Swap</span>
                <span style={{fontSize:11,color:"rgba(153,69,255,0.5)"}}>◎ Solana</span>
              </div>
              <SolanaSwap />
            </div>
          ) : (
            <div className="card" onClick={e=>e.stopPropagation()}>
              <div className="card-header">
                <span className="card-title">Swap</span>
                <button className="settings-btn" onClick={()=>setShowSettings(!showSettings)}>⚙</button>
              </div>

              {showSettings && (
                <div className="settings-panel">
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:10}}>Slippage tolerance</div>
                  <div style={{display:"flex",gap:6}}>
                    {[0.1,0.5,1.0,3.0].map(v=>(
                      <button key={v} className={`slip-btn ${slippage===v?"active":""}`} onClick={()=>setSlippage(v)}>{v}%</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="token-box" style={{marginBottom:2}}>
                <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:12,fontWeight:500}}>Sell</div>
                <div className="token-row">
                  <button className="token-select-btn" onClick={()=>{setShowFromList(true);setShowToList(false);setSearchQuery("");}}>
                    <TokenLogo src={fromToken?.logo} size={24}/>{fromToken?.symbol}<span style={{fontSize:12,opacity:0.5}}>▾</span>
                  </button>
                  <input className="amount-input" type="number" placeholder="0" value={fromAmount} onChange={e=>setFromAmount(e.target.value)}/>
                </div>
                <div className="balance-row">
                  <span className="balance-usd">{fromAmount&&`≈ $${(Number(fromAmount)*getPrice(fromToken?.symbol)).toLocaleString(undefined,{maximumFractionDigits:2})}`}</span>
                  {getBalance(fromToken)!==null&&<span className="balance-amount">Balance: <span onClick={()=>setFromAmount((getBalance(fromToken)||0).toFixed(6))}>{(getBalance(fromToken)||0).toFixed(4)} {fromToken?.symbol}</span></span>}
                </div>
              </div>

              <div className="arrow-wrap">
                <button className="arrow-btn" onClick={handleSwapTokens}>⇅</button>
              </div>

              <div className="token-box" style={{marginTop:2}}>
                <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:12,fontWeight:500}}>Buy</div>
                <div className="token-row">
                  <button className="token-select-btn" onClick={()=>{setShowToList(true);setShowFromList(false);setSearchQuery("");}}>
                    <TokenLogo src={toToken?.logo} size={24}/>{toToken?.symbol}<span style={{fontSize:12,opacity:0.5}}>▾</span>
                  </button>
                  <input className="amount-input" type="number" placeholder="0" value={quoteLoading?"...":toAmount} readOnly/>
                </div>
                <div className="balance-row">
                  <span className="balance-usd">{toAmount&&`≈ $${(Number(toAmount)*getPrice(toToken?.symbol)).toLocaleString(undefined,{maximumFractionDigits:2})}`}</span>
                  {getBalance(toToken)!==null&&<span className="balance-amount">Balance: <span>{(getBalance(toToken)||0).toFixed(4)} {toToken?.symbol}</span></span>}
                </div>
              </div>

              {toAmount&&fromAmount&&(
                <div className="quote-box">
                  <div className="quote-row"><span>Rate</span><span>1 {fromToken?.symbol} = {(getPrice(fromToken?.symbol)/getPrice(toToken?.symbol)).toFixed(6)} {toToken?.symbol}</span></div>
                  <div className="quote-row"><span>Price impact</span><span style={{color:"#00c878"}}>{"< 0.01%"}</span></div>
                  <div className="quote-row"><span>Max slippage</span><span>{slippage}%</span></div>
                  {swapSource&&<div className="quote-row" style={{marginBottom:0}}><span>Source</span><span>⚡ {swapSource}</span></div>}
                </div>
              )}

              {error&&<div className="error-box">{error}</div>}
              {txHash&&<div className="success-box">✅ Swap successful! {txHash}</div>}

              <button className={`swap-btn ${loading?"loading":fromAmount?"active":"disabled"}`} onClick={handleSwap} disabled={loading||!fromAmount}>
                {loading?"⟳ Swapping...":account?(fromAmount?`Swap ${fromToken?.symbol} → ${toToken?.symbol}`:"Enter an amount"):"Connect your wallet"}
              </button>
            </div>
          )}

          {swapHistory.length>0&&!isSolana&&(
            <div className="history-card">
              <div style={{fontSize:15,fontWeight:700,color:"#D4A017",marginBottom:14,fontFamily:"'Cinzel',serif",letterSpacing:1}}>Recent transactions</div>
              {swapHistory.map((s,i)=>(
                <div key={i} className="history-item">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(212,160,23,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✅</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{s.amountIn} {s.from} → {s.amountOut} {s.to}</div>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>{s.chain} · {s.time}</div>
                    </div>
                  </div>
                  <span style={{fontSize:12,color:"#D4A017",fontWeight:600,cursor:"pointer"}}>↗</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(showFromList||showToList)&&!isSolana&&(
        <div onClick={()=>{setShowFromList(false);setShowToList(false);setSearchQuery("");}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"rgba(12,8,3,0.98)",border:"1px solid rgba(212,160,23,0.2)",borderRadius:24,width:"100%",maxWidth:420,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.8)"}}>
            <div style={{padding:"20px 20px 16px",borderBottom:"1px solid rgba(212,160,23,0.1)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:700,color:"#D4A017"}}>Select a token</span>
                <button onClick={()=>{setShowFromList(false);setShowToList(false);setSearchQuery("");}} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer"}}>✕</button>
              </div>
              <input autoFocus placeholder="🔍 Search for a token..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{width:"100%",padding:"12px 16px",borderRadius:14,border:"1px solid rgba(212,160,23,0.15)",background:"rgba(212,160,23,0.05)",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none"}}/>
            </div>
            <div style={{overflowY:"auto",padding:"8px 12px",scrollbarWidth:"thin",scrollbarColor:"rgba(212,160,23,0.2) transparent"}}>
              {(showFromList?filteredFrom:filteredTo).map(t=>(
                <button key={t.address} onClick={()=>{showFromList?setFromToken(t):setToToken(t);setShowFromList(false);setShowToList(false);setSearchQuery("");}}
                  style={{display:"flex",alignItems:"center",gap:14,width:"100%",padding:"12px 14px",background:"transparent",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",transition:"background 0.15s",fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}
                  onMouseOver={e=>e.currentTarget.style.background="rgba(212,160,23,0.06)"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <TokenLogo src={t.logo} size={40}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:15}}>{t.symbol}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{t.name}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {getBalance(t)!==null&&(getBalance(t)||0)>0?(
                      <div style={{fontSize:13,color:"rgba(212,160,23,0.8)",fontWeight:600}}>{(getBalance(t)||0).toFixed(4)} {t.symbol}</div>
                    ):(
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.15)"}}>0</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDustSweeper&&<DustSweeper onClose={()=>setShowDustSweeper(false)}/>}
    </>
  );
}
