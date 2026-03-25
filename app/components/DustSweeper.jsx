"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";

const CHAINS_CONFIG = [
  { id: "0x1",    name: "Ethereum",  symbol: "ETH",  color: "#627EEA", moralisId: "0x1",    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { id: "0x89",   name: "Polygon",   symbol: "MATIC",color: "#8247E5", moralisId: "0x89",   logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png" },
  { id: "0x38",   name: "BNB Chain", symbol: "BNB",  color: "#F3BA2F", moralisId: "0x38",   logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  { id: "0xa4b1", name: "Arbitrum",  symbol: "ARB",  color: "#28A0F0", moralisId: "0xa4b1", logo: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg" },
  { id: "0xa86a", name: "Avalanche", symbol: "AVAX", color: "#E84142", moralisId: "0xa86a", logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  { id: "0x2105", name: "Base",      symbol: "ETH",  color: "#0052FF", moralisId: "0x2105", logo: "https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg" },
  { id: "0xa",    name: "Optimism",  symbol: "ETH",  color: "#FF0420", moralisId: "0xa",    logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png" },
];

const OO_CHAIN_NAMES = {
  "0x1": "eth", "0x89": "polygon", "0x38": "bsc",
  "0xa4b1": "arbitrum", "0xa86a": "avax", "0x2105": "base", "0xa": "optimism"
};

const RECEIVE_TOKENS = {
  "0x1":    { symbol: "ETH",  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "0x89":   { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
  "0x38":   { symbol: "BNB",  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "0xa4b1": { symbol: "ETH",  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "0xa86a": { symbol: "AVAX", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "0x2105": { symbol: "ETH",  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "0xa":    { symbol: "ETH",  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
};

const STARS = Array.from({length:40},(_,i)=>({id:i,top:`${(i*37+11)%60}%`,left:`${(i*53+7)%100}%`,size:i%4===0?2:1,opacity:((i*17+3)%6)*0.08+0.1}));

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

export default function DustSweeper({ onClose, fullPage = false }) {
  const account = useActiveAccount();
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
    if (!account?.address) { setError("Connect your wallet first"); return; }
    setLoading(true); setError(null); setTokens([]); setSelectedTokens([]); setScanned(false);
    try {
      const res = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${account.address}/erc20?chain=${selectedChain.moralisId}&limit=500`,
        { headers: { "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY || "", "Accept": "application/json" } }
      );
      const data = await res.json();
      if (!data.result || data.result.length === 0) { setTokens([]); setScanned(true); setLoading(false); return; }

      const chainName = OO_CHAIN_NAMES[selectedChain.id] || "ethereum";
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
      } catch(e) { console.log("DexScreener error:", e); }

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
    } catch(e) {
      setError("Error: " + (e.message || "unknown"));
    }
    setLoading(false);
  };

  const handleSweep = async () => {
    if (!account?.address) return;
    if (selectedTokens.length === 0) { setError("Please select at least one token."); return; }
    setSweeping(true); setError(null);
    const { sendSwapTransaction, approveToken } = await import("../lib/sendSwapTx");
    const chainIdNum = parseInt(selectedChain.id, 16);
    const receiveAddr = receiveToken === "native"
      ? RECEIVE_TOKENS[selectedChain.id]?.address
      : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    let sweptCount = 0;
    let totalReceived = 0;
    for (const token of tokens.filter(t => selectedTokens.includes(t.address))) {
      try {
        const amountReadable = token.balance;
        const src = token.address;
        const dest = receiveAddr;
        try {
          const approveRes = await fetch(`/api/openocean?type=quote&chainId=${chainIdNum}&inTokenAddress=${src}&outTokenAddress=${dest}&amount=${amountReadable}&slippage=3&account=${account.address}`);
          const approveData = await approveRes.json();
          if (approveData?.data?.to) {
            await approveToken({ chainId: chainIdNum, tokenAddress: token.address, spenderAddress: approveData.data.to });
            await new Promise(r => setTimeout(r, 2000));
          }
        } catch(e) { console.log("Approve skipped:", e.message); }
        const params = new URLSearchParams({ type:"quote", chainId:chainIdNum.toString(), inTokenAddress:src, outTokenAddress:dest, amount:amountReadable, slippage:"3", account:account.address });
        const res = await fetch(`/api/openocean?${params}`);
        const data = await res.json();
        if (data?.data?.to) {
          await sendSwapTransaction({ chainId: chainIdNum, to: data.data.to, data: data.data.data, value: data.data.value || "0", gas: data.data.estimatedGas });
          sweptCount++;
          totalReceived += token.valueUsd * 0.97;
        }
      } catch(e) { console.error(`Error swap ${token.symbol}:`, e); }
    }
    setSweeping(false);
    if (sweptCount > 0) {
      const recvSymbol = receiveToken === "native" ? RECEIVE_TOKENS[selectedChain.id]?.symbol : "USDC";
      setSweptResult({ count: sweptCount, value: totalReceived.toFixed(2), receivedToken: recvSymbol });
    } else {
      setError("Sweep failed. Please try again.");
    }
  };

  const totalSelected = tokens.filter(t => selectedTokens.includes(t.address)).reduce((s, t) => s + t.valueUsd, 0);
  const estimatedReceive = totalSelected * 0.97;

  const content = (
    <div style={{fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes pulse{0%,100%{opacity:0.1}50%{opacity:0.2}}
        .dust-card{background:rgba(15,10,5,0.85);border:1px solid rgba(212,160,23,0.15);border-radius:24px;padding:20px 24px;backdrop-filter:blur(20px);box-shadow:0 8px 48px rgba(0,0,0,0.6);margin-bottom:16px;}
        .dust-label{font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;font-weight:600;margin-bottom:10px;}
        .chain-btn{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all 0.2s;}
        .chain-btn.active{border-color:rgba(212,160,23,0.4);background:rgba(212,160,23,0.1);color:#D4A017;}
        .chain-btn:hover{border-color:rgba(212,160,23,0.2);color:#fff;}
        .thresh-btn{padding:8px 16px;border-radius:10px;border:1px solid rgba(212,160,23,0.1);background:transparent;color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
        .thresh-btn.active{border-color:#D4A017;background:rgba(212,160,23,0.12);color:#D4A017;}
        .scan-btn{width:100%;padding:16px;border-radius:16px;border:none;background:linear-gradient(135deg,#D4A017,#F5C842);color:#0a0600;font-family:'Cinzel',serif;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;letter-spacing:0.5px;}
        .scan-btn:hover{opacity:0.9;transform:translateY(-1px);}
        .scan-btn:disabled{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.2);cursor:not-allowed;transform:none;}
        .token-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(212,160,23,0.06);cursor:pointer;transition:all 0.15s;}
        .token-row:last-child{border-bottom:none;}
        .sweep-btn{width:100%;padding:16px;border-radius:16px;border:none;background:linear-gradient(135deg,#D4A017,#F5C842);color:#0a0600;font-family:'Cinzel',serif;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;margin-top:16px;}
        .sweep-btn:disabled{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.2);cursor:not-allowed;}
      `}</style>

      <div className="dust-card">
        <div className="dust-label">Select chain to scan</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {CHAINS_CONFIG.map(c => (
            <button key={c.id} className={`chain-btn ${selectedChain.id===c.id?"active":""}`} onClick={()=>{setSelectedChain(c);setTokens([]);setScanned(false);}}>
              <TokenImg src={c.logo} size={16}/>{c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="dust-card">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <div className="dust-label">Threshold (max value in $)</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[1,5,10,50].map(v=>(
                <button key={v} className={`thresh-btn ${threshold===v&&!customThreshold?"active":""}`} onClick={()=>{setThreshold(v);setCustomThreshold("");}}>
                  ${v}
                </button>
              ))}
              <input placeholder="Custom $..." value={customThreshold} onChange={e=>setCustomThreshold(e.target.value)}
                style={{width:90,padding:"7px 10px",borderRadius:10,border:`1px solid ${customThreshold?"#D4A017":"rgba(212,160,23,0.1)"}`,background:customThreshold?"rgba(212,160,23,0.12)":"transparent",color:customThreshold?"#D4A017":"rgba(255,255,255,0.4)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}
              />
            </div>
          </div>
          <div>
            <div className="dust-label">Convert to</div>
            <div style={{display:"flex",gap:6}}>
              <button className={`thresh-btn ${receiveToken==="native"?"active":""}`} onClick={()=>setReceiveToken("native")}>
                {RECEIVE_TOKENS[selectedChain.id]?.symbol || "Native"}
              </button>
              <button className={`thresh-btn ${receiveToken==="usdc"?"active":""}`} onClick={()=>setReceiveToken("usdc")}>USDC</button>
            </div>
          </div>
        </div>
      </div>

      <button className="scan-btn" onClick={handleScan} disabled={loading||!account}>
        {loading ? "⟳ Scanning..." : `Scan on ${selectedChain.name}`}
      </button>

      {error && <div style={{margin:"12px 0",padding:"12px 16px",borderRadius:14,background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",fontSize:13}}>{error}</div>}

      {scanned && !sweptResult && (
        <div className="dust-card" style={{marginTop:16}}>
          {tokens.length === 0 ? (
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:40,marginBottom:12}}>✨</div>
              <div style={{fontFamily:"'Cinzel',serif",color:"#D4A017",fontSize:16,fontWeight:600}}>Your wallet is clean on {selectedChain.name}!</div>
              <div style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:8}}>No dust found under ${effectiveThreshold}</div>
            </div>
          ) : (
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontFamily:"'Cinzel',serif",color:"#D4A017",fontSize:15,fontWeight:600}}>{tokens.length} dust token(s) found</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setSelectedTokens(tokens.map(t=>t.address))} style={{padding:"4px 10px",borderRadius:8,border:"1px solid rgba(212,160,23,0.2)",background:"transparent",color:"#D4A017",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>All</button>
                  <button onClick={()=>setSelectedTokens([])} style={{padding:"4px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>None</button>
                </div>
              </div>
              {tokens.map(t=>(
                <div key={t.address} className="token-row" onClick={()=>setSelectedTokens(prev=>prev.includes(t.address)?prev.filter(a=>a!==t.address):[...prev,t.address])}>
                  <input type="checkbox" checked={selectedTokens.includes(t.address)} onChange={()=>{}} style={{accentColor:"#D4A017",width:16,height:16,flexShrink:0}}/>
                  <TokenImg src={t.logo} size={32}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,color:"#fff"}}>{t.symbol}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{t.balance} tokens</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,color:"rgba(212,160,23,0.8)",fontWeight:600}}>${t.valueUsd.toFixed(3)}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>${t.priceUsd.toFixed(6)}/token</div>
                  </div>
                </div>
              ))}
              {selectedTokens.length > 0 && (
                <div style={{marginTop:16,padding:"14px 16px",borderRadius:14,background:"rgba(212,160,23,0.06)",border:"1px solid rgba(212,160,23,0.12)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:6}}>
                    <span>Selected tokens</span><span style={{color:"#fff"}}>{selectedTokens.length}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:6}}>
                    <span>Total value</span><span style={{color:"#fff"}}>${totalSelected.toFixed(2)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:6}}>
                    <span>Fees (3%)</span><span style={{color:"#ff6b6b"}}>-${(totalSelected*0.03).toFixed(2)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:600,borderTop:"1px solid rgba(212,160,23,0.1)",paddingTop:8,marginTop:4}}>
                    <span style={{color:"rgba(255,255,255,0.6)"}}>You will receive ≈</span>
                    <span style={{color:"#D4A017"}}>${estimatedReceive.toFixed(2)} in {receiveToken==="native"?RECEIVE_TOKENS[selectedChain.id]?.symbol:"USDC"}</span>
                  </div>
                </div>
              )}
              <button className="sweep-btn" onClick={handleSweep} disabled={sweeping||selectedTokens.length===0}>
                {sweeping ? "⟳ Sweeping..." : `🧹 Sweep ${selectedTokens.length} token(s)`}
              </button>
            </>
          )}
        </div>
      )}

      {sweptResult && (
        <div className="dust-card" style={{marginTop:16,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>🎉</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:20,fontWeight:700,color:"#D4A017",marginBottom:8}}>Sweep successful!</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:4}}>{sweptResult.count} tokens swapped to {sweptResult.receivedToken}</div>
          <div style={{fontSize:15,color:"#00c878",fontWeight:600,marginBottom:20}}>Value recovered: ~${sweptResult.value}</div>
          <button onClick={()=>{setSweptResult(null);setTokens([]);setScanned(false);}} style={{padding:"10px 24px",borderRadius:12,border:"1px solid rgba(212,160,23,0.3)",background:"rgba(212,160,23,0.08)",color:"#D4A017",fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:600,cursor:"pointer"}}>
            New Sweep
          </button>
        </div>
      )}
    </div>
  );

  // Full page mode with Pangea background
  if (fullPage) {
    return (
      <div style={{position:"relative",minHeight:"100vh"}}>
        <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",background:"linear-gradient(180deg,#060408 0%,#0a0805 40%,#100c04 70%,#180e00 100%)"}}>
          {STARS.map(s=><div key={s.id} style={{position:"absolute",width:s.size,height:s.size,background:"#fff",borderRadius:"50%",top:s.top,left:s.left,opacity:s.opacity}}/>)}
          <div style={{position:"absolute",bottom:0,left:"8%",width:0,height:0,borderLeft:"140px solid transparent",borderRight:"140px solid transparent",borderBottom:"300px solid #120800"}}/>
          <div style={{position:"absolute",bottom:180,left:"calc(8% + 20px)",width:220,height:120,background:"#ff4400",borderRadius:"50%",filter:"blur(50px)",opacity:0.15,animation:"pulse 4s ease-in-out infinite"}}/>
          <div style={{position:"absolute",bottom:0,left:"42%",width:0,height:0,borderLeft:"220px solid transparent",borderRight:"220px solid transparent",borderBottom:"420px solid #150a00"}}/>
          <div style={{position:"absolute",bottom:280,left:"calc(42% + 80px)",width:320,height:180,background:"#ff5500",borderRadius:"50%",filter:"blur(70px)",opacity:0.12,animation:"pulse 5s ease-in-out infinite"}}/>
          <div style={{position:"absolute",bottom:0,right:"6%",width:0,height:0,borderLeft:"170px solid transparent",borderRight:"170px solid transparent",borderBottom:"350px solid #120800"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:120,background:"linear-gradient(180deg,transparent,rgba(30,15,0,0.6))"}}/>
        </div>
        <div style={{position:"relative",zIndex:10,paddingTop:80,paddingBottom:60}}>
          <div style={{textAlign:"center",marginBottom:32,padding:"0 20px"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:36,fontWeight:700,background:"linear-gradient(135deg,#D4A017,#F5C842)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:2,marginBottom:8}}>
              🧹 Dust Sweeper
            </div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:16}}>
              Scan and convert your dust tokens across all chains
            </div>
          </div>
          <div style={{maxWidth:680,margin:"0 auto",padding:"0 20px"}}>
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Popup mode
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}>
      <div style={{background:"rgba(12,8,3,0.98)",border:"1px solid rgba(212,160,23,0.2)",borderRadius:24,width:"100%",maxWidth:560,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.8)",scrollbarWidth:"none"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 16px",borderBottom:"1px solid rgba(212,160,23,0.1)",position:"sticky",top:0,background:"rgba(12,8,3,0.98)",zIndex:10}}>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:18,fontWeight:700,color:"#D4A017",letterSpacing:1}}>🧹 Dust Sweeper</span>
          {onClose && <button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        </div>
        <div style={{padding:"20px 24px"}}>
          {content}
        </div>
      </div>
    </div>
  );
}
