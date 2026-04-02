"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CHAINS_AVAILABLE = [
  { name: "Base",   symbol: "BASE", color: "#0052FF", logo: "https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg", },
  { name: "Solana", symbol: "SOL",  color: "#9945FF", logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png", dex: "⚡ Jupiter" },
];

const CHAINS_SOON = [
  { name: "Ethereum",  symbol: "ETH",  color: "#627EEA", logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { name: "Polygon",   symbol: "MATIC",color: "#8247E5", logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png" },
  { name: "BNB Chain", symbol: "BNB",  color: "#F3BA2F", logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  { name: "Arbitrum",  symbol: "ARB",  color: "#28A0F0", logo: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg" },
  { name: "Avalanche", symbol: "AVAX", color: "#E84142", logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  { name: "Optimism",  symbol: "OP",   color: "#FF0420", logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png" },
];

const LEVELS = [
  { name: "Fossil",   emoji: "🪨", min: 0,     max: 49,   color: "#8B7355", desc: "The beginning of the journey" },
  { name: "Egg",      emoji: "🥚", min: 50,    max: 499,  color: "#C8B89A", desc: "Something is hatching" },
  { name: "Reptile",  emoji: "🦎", min: 500,   max: 1999, color: "#4CAF50", desc: "You're gaining experience" },
  { name: "Raptor",   emoji: "🦴", min: 2000,  max: 4999, color: "#2196F3", desc: "A confirmed predator" },
  { name: "Rex",      emoji: "🦖", min: 5000,  max: 9999, color: "#FF5722", desc: "The summit is near" },
  { name: "Pangean",  emoji: "🌋", min: 10000, max: null, color: "#D4A017", desc: "Master of the Pangea" },
];

const STARS = Array.from({length: 60}, (_, i) => ({
  id: i, top: `${(i * 37 + 11) % 100}%`, left: `${(i * 53 + 7) % 100}%`,
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  opacity: ((i * 17 + 3) % 6) * 0.08 + 0.1,
  animDelay: `${(i % 5) * 0.8}s`,
}));

function TokenLogo({ src, size = 28 }: { src: string; size?: number }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img src={imgSrc} width={size} height={size}
      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      onError={() => setImgSrc(`https://ui-avatars.com/api/?name=?&size=${size}&background=333&color=fff&rounded=true`)}
    />
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060408; overflow-x: hidden; }
        html { scroll-behavior: smooth; }

        .land-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: rgba(6,4,8,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(212,160,23,0.1); height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
        .land-nav-logo { display: flex; align-items: center; gap: 10px; }
        .land-nav-logo-text { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; background: linear-gradient(135deg, #D4A017, #F5C842); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 2px; }
        .land-nav-links { display: flex; align-items: center; gap: 32px; }
        .land-nav-link { color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; text-decoration: none; cursor: pointer; transition: color 0.2s; background: none; border: none; }
        .land-nav-link:hover { color: #D4A017; }
        .launch-btn { padding: 10px 24px; border-radius: 12px; background: linear-gradient(135deg, #D4A017, #F5C842); border: none; color: #0a0600; font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; }
        @media(max-width:768px){ .launch-btn{ font-size:11px; padding:7px 14px; } }
        .launch-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(212,160,23,0.3); }

        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; text-align: center; padding: 80px 20px 40px; }
        .hero-bg { position: absolute; inset: 0; z-index: 0; }
        .hero-content { position: relative; z-index: 10; max-width: 800px; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 50px; border: 1px solid rgba(212,160,23,0.3); background: rgba(212,160,23,0.08); color: #D4A017; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; margin-bottom: 32px; letter-spacing: 0.5px; }
        .hero-title { font-family: 'Cinzel', serif; font-size: clamp(48px, 8vw, 96px); font-weight: 900; line-height: 1.05; color: #fff; margin-bottom: 12px; letter-spacing: -1px; }
        .hero-title-gold { background: linear-gradient(135deg, #D4A017, #F5C842, #D4A017); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-subtitle { font-family: 'DM Sans', sans-serif; font-size: clamp(16px, 2.5vw, 22px); color: rgba(255,255,255,0.5); margin-bottom: 48px; line-height: 1.6; max-width: 600px; margin-left: auto; margin-right: auto; }
        .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 60px; }
        .hero-btn-primary { padding: 16px 40px; border-radius: 16px; background: linear-gradient(135deg, #D4A017, #F5C842); border: none; color: #0a0600; font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; }
        .hero-btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(212,160,23,0.35); }
        .hero-btn-secondary { padding: 16px 40px; border-radius: 16px; background: transparent; border: 1px solid rgba(212,160,23,0.3); color: #D4A017; font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; }
        .hero-btn-secondary:hover { background: rgba(212,160,23,0.08); transform: translateY(-2px); }
        .hero-stats { display: flex; gap: 48px; justify-content: center; flex-wrap: wrap; }
        .hero-stat { text-align: center; }
        .hero-stat-value { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 700; color: #D4A017; }
        .hero-stat-label { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 4px; }

        .section { padding: 100px 40px; max-width: 1200px; margin: 0 auto; }
        .section-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 50px; border: 1px solid rgba(212,160,23,0.2); background: rgba(212,160,23,0.06); color: rgba(212,160,23,0.8); font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .section-title { font-family: 'Cinzel', serif; font-size: clamp(28px, 4vw, 48px); font-weight: 700; color: #fff; margin-bottom: 16px; line-height: 1.2; }
        .section-desc { font-family: 'DM Sans', sans-serif; font-size: 18px; color: rgba(255,255,255,0.4); line-height: 1.7; max-width: 600px; }

        .chains-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 48px; }
        .chain-card { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); transition: all 0.3s; }
        .chain-card:hover { transform: translateY(-2px); }
        .chain-card-name { font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 16px; color: #fff; }
        .chain-card-symbol { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 2px; }
        .chain-card-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; font-family: 'DM Sans', sans-serif; }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 48px; }
        .feature-card { padding: 32px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); transition: all 0.3s; }
        .feature-card:hover { border-color: rgba(212,160,23,0.2); background: rgba(212,160,23,0.03); transform: translateY(-4px); }
        .feature-icon { font-size: 40px; margin-bottom: 20px; }
        .feature-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: #D4A017; margin-bottom: 12px; }
        .feature-desc { font-family: 'DM Sans', sans-serif; font-size: 15px; color: rgba(255,255,255,0.45); line-height: 1.7; }

        .levels-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 48px; }
        .level-card { padding: 24px 20px; border-radius: 20px; border: 1px solid; text-align: center; transition: all 0.3s; }
        .level-card:hover { transform: translateY(-4px); }
        .level-emoji { font-size: 40px; margin-bottom: 12px; }
        .level-name { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700; margin-bottom: 6px; }
        .level-req { font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 8px; }
        .level-desc { font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.3); }

        .dust-visual { background: rgba(15,10,5,0.9); border: 1px solid rgba(212,160,23,0.15); border-radius: 24px; padding: 28px; }
        .dust-token-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px; }
        .dust-arrow { text-align: center; padding: 16px; color: #D4A017; font-size: 24px; }
        .dust-result { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 12px; background: rgba(212,160,23,0.08); border: 1px solid rgba(212,160,23,0.2); }

        .cta-section { text-align: center; padding: 100px 40px; position: relative; overflow: hidden; }
        .divider { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,160,23,0.2), transparent); }

        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.6} }
        @keyframes pulse { 0%,100%{opacity:0.1} 50%{opacity:0.25} }
        @keyframes mistMove { 0%,100%{transform:translateX(0)} 50%{transform:translateX(40px)} }

        @media (max-width: 768px) {
          .land-nav-links { display: none; }
          .hero-stats { gap: 24px; }
          .section { padding: 60px 20px; }
          .dust-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="land-nav">
        <div className="land-nav-logo">
          <img src="/logo.png" style={{width:40, height:40, objectFit:"contain"}} alt="Pangeon" />
          <span className="land-nav-logo-text">PANGEON</span>
        </div>
        <div className="land-nav-links">
          <button className="land-nav-link" onClick={() => document.getElementById("chains")?.scrollIntoView({behavior:"smooth"})}>Chains</button>
          <button className="land-nav-link" onClick={() => document.getElementById("dust")?.scrollIntoView({behavior:"smooth"})}>Dust Sweeper</button>
          <button className="land-nav-link" onClick={() => document.getElementById("levels")?.scrollIntoView({behavior:"smooth"})}>Levels</button>
        </div>
        <button className="launch-btn" onClick={() => router.push("/swap")}>Launch App →</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          {STARS.map(s => (
            <div key={s.id} style={{position:"absolute", width:s.size, height:s.size, background:"#fff", borderRadius:"50%", top:s.top, left:s.left, opacity:s.opacity, animation:`twinkle ${3 + parseInt(s.animDelay) + 2}s ease-in-out infinite`, animationDelay:s.animDelay}} />
          ))}
          <div style={{position:"absolute",bottom:0,left:"5%",width:0,height:0,borderLeft:"160px solid transparent",borderRight:"160px solid transparent",borderBottom:"340px solid #120800"}} />
          <div style={{position:"absolute",bottom:200,left:"calc(5% + 30px)",width:260,height:140,background:"#ff4400",borderRadius:"50%",filter:"blur(60px)",opacity:0.18,animation:"pulse 4s ease-in-out infinite"}} />
          <div style={{position:"absolute",bottom:0,left:"38%",width:0,height:0,borderLeft:"240px solid transparent",borderRight:"240px solid transparent",borderBottom:"480px solid #150a00"}} />
          <div style={{position:"absolute",bottom:320,left:"calc(38% + 100px)",width:360,height:200,background:"#ff5500",borderRadius:"50%",filter:"blur(80px)",opacity:0.14,animation:"pulse 5s ease-in-out infinite",animationDelay:"1s"}} />
          <div style={{position:"absolute",bottom:0,right:"4%",width:0,height:0,borderLeft:"180px solid transparent",borderRight:"180px solid transparent",borderBottom:"380px solid #120800"}} />
          <div style={{position:"absolute",bottom:220,right:"calc(4% + 40px)",width:280,height:160,background:"#ff4400",borderRadius:"50%",filter:"blur(60px)",opacity:0.16,animation:"pulse 4.5s ease-in-out infinite",animationDelay:"2s"}} />
          <div style={{position:"absolute",bottom:0,left:"1%",width:0,height:0,borderLeft:"22px solid transparent",borderRight:"22px solid transparent",borderBottom:"200px solid #0d0900"}} />
          <div style={{position:"absolute",bottom:0,right:"1%",width:0,height:0,borderLeft:"24px solid transparent",borderRight:"24px solid transparent",borderBottom:"220px solid #0d0900"}} />
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:150,background:"linear-gradient(180deg,transparent,rgba(30,15,0,0.7))"}} />
        </div>

        <div className="hero-content">
          <div className="hero-badge">🦕 The DEX of the Prehistoric Era</div>
          <h1 className="hero-title">
            Swap like a<br />
            <span className="hero-title-gold">Pangean</span>
          </h1>
          <p className="hero-subtitle">
            Pangeon is the first multi-chain DEX inspired by Pangea. Swap on Base and Solana, clean your dust tokens in 1 click, and evolve to the rank of Pangean.
          </p>
          <div className="hero-btns">
            <button className="hero-btn-primary" onClick={() => router.push("/swap")}>🚀 Launch App</button>
            <button className="hero-btn-secondary" onClick={() => document.getElementById("chains")?.scrollIntoView({behavior:"smooth"})}>Learn More ↓</button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="hero-stat-value">2</div><div className="hero-stat-label">Supported Chains</div></div>
            <div className="hero-stat"><div className="hero-stat-value">10k</div><div className="hero-stat-label">Available Tokens</div></div>
            <div className="hero-stat"><div className="hero-stat-value">6</div><div className="hero-stat-label">Levels to Reach</div></div>
            <div className="hero-stat"><div className="hero-stat-value">1 click</div><div className="hero-stat-label">Dust Sweeper</div></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FEATURES */}
      <section className="section">
        <div style={{textAlign:"center", marginBottom:16}}>
          <div className="section-badge">✨ Features</div>
          <h2 className="section-title">Everything you need</h2>
          <p className="section-desc" style={{margin:"0 auto"}}>Pangeon combines the best Web3 technologies to offer you a unique and immersive swap experience.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Ultra-Fast Swap</div>
            <div className="feature-desc">Powered by Paraswap and Jupiter Aggregator, Pangeon always finds the best price across all available DEXs.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧹</div>
            <div className="feature-title">Dust Sweeper</div>
            <div className="feature-desc">Got dozens of tiny tokens lying around? Pangeon scans and converts them to ETH, SOL or USDC in a single click.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <div className="feature-title">Level System</div>
            <div className="feature-desc">Every swap brings you closer to the supreme rank. From Fossil to Pangean — evolve and prove you're the master of the blockchain.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <div className="feature-title">Multi-Chain</div>
            <div className="feature-desc">2 blockchains in a single interface. Solana, Base and more comming soon — switch chains in one click.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">Live Prices</div>
            <div className="feature-desc">All token prices update in real time with 24h changes directly in the interface.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">Non-Custodial</div>
            <div className="feature-desc">Pangeon never holds your funds. You keep full control of your wallet at all times.</div>
          </div>
        </div>
      </section>

      <div className="divider" />

{/* CHAINS */}
<section className="section" id="chains">
  <div className="section-badge">⛓️ Multi-Chain</div>
  <h2 className="section-title">2 chains, 1 interface</h2>
  <p className="section-desc" style={{ marginBottom: 48 }}>Pangeon supports Base and Solana, with more chains coming soon.</p>
  
  {/* Available chains */}
  <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 64, flexWrap: "wrap" }}>
    {CHAINS_AVAILABLE.map(c => (
      <div key={c.symbol} className="chain-card" style={{ borderColor: `${c.color}44`, background: `${c.color}11`, minWidth: 220 }}>
        <img src={c.logo} width={44} height={44} style={{ borderRadius: "50%", objectFit: "cover" }} onError={(e) => (e.target as HTMLImageElement).style.display = "none"} />
        <div style={{ flex: 1 }}>
          <div className="chain-card-name">{c.name}</div>
          <div className="chain-card-symbol">{c.symbol}</div>
        </div>
 
      </div>
    ))}
  </div>

  {/* Coming soon */}
  <div style={{ textAlign: "center", marginBottom: 16 }}>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
      <div style={{ height: 1, width: 80, background: "rgba(255,255,255,0.15)" }} />
      Chain Coming Soon
      <div style={{ height: 1, width: 80, background: "rgba(255,255,255,0.15)" }} />
    </div>
  </div>
  <div className="chains-grid">
    {CHAINS_SOON.map(c => (
      <div key={c.symbol} className="chain-card" style={{ borderColor: "rgba(255,255,255,0.06)", opacity: 0.5 }}>
        <img src={c.logo} width={44} height={44} style={{ borderRadius: "50%", objectFit: "cover" }} onError={(e) => (e.target as HTMLImageElement).style.display = "none"} />
        <div style={{ flex: 1 }}>
          <div className="chain-card-name">{c.name}</div>
          <div className="chain-card-symbol">{c.symbol}</div>
        </div>
        <div className="chain-card-badge" style={{ background: "rgba(212,160,23,0.08)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.2)" }}>
          Soon
        </div>
      </div>
    ))}
  </div>
</section>

      <div className="divider" />

      {/* DUST SWEEPER */}
      <section className="section" id="dust">
        <div className="dust-grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center"}}>
          <div>
            <div className="section-badge">🧹 Dust Sweeper</div>
            <h2 className="section-title">No more leftover tokens</h2>
            <p className="section-desc">
              Farmed airdrops? Traded memecoins? Over time, your wallet looks like a prehistoric jungle — dozens of tiny worthless tokens.
            </p>
            <p style={{fontFamily:"'DM Sans', sans-serif", fontSize:16, color:"rgba(255,255,255,0.4)", lineHeight:1.7, marginTop:16}}>
              Pangeon scans all your tokens, identifies "dust" below your threshold, and converts them to ETH or SOL in seconds.
            </p>
            <div style={{display:"flex", flexDirection:"column", gap:12, marginTop:32}}>
              {["Automatic scan of all your tokens", "Customizable threshold ($1, $5, $10...)", "Convert to ETH or SOL", "Supports 2 blockchains"].map(item => (
                <div key={item} style={{display:"flex", alignItems:"center", gap:12}}>
                  <div style={{width:24, height:24, borderRadius:"50%", background:"rgba(212,160,23,0.15)", border:"1px solid rgba(212,160,23,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    <span style={{color:"#D4A017", fontSize:12}}>✓</span>
                  </div>
                  <span style={{fontFamily:"'DM Sans', sans-serif", fontSize:15, color:"rgba(255,255,255,0.6)"}}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dust-visual">
            <div style={{fontSize:13, color:"rgba(212,160,23,0.5)", marginBottom:16, fontFamily:"'DM Sans', sans-serif", textTransform:"uppercase", letterSpacing:"0.8px"}}>Before the sweep</div>
            {[
{symbol:"BONK",   logo:"https://assets.coingecko.com/coins/images/28600/small/bonk.jpg", val:"$0.87"},
{symbol:"POPCAT", logo:"https://dd.dexscreener.com/ds-data/tokens/solana/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png", val:"$1.23"},
{symbol:"PENGU",  logo:"https://dd.dexscreener.com/ds-data/tokens/solana/2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv.png", val:"$0.45"},
{symbol:"PIPPIN", logo:"https://dd.dexscreener.com/ds-data/tokens/solana/Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump.png", val:"$0.24"},
            ].map(t => (
              <div key={t.symbol} className="dust-token-row">
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <img src={t.logo} width={28} height={28} style={{borderRadius:"50%"}} onError={(e) => (e.target as HTMLImageElement).style.display="none"} />
                  <span style={{fontFamily:"'DM Sans', sans-serif", fontWeight:700, color:"#fff"}}>{t.symbol}</span>
                </div>
                <span style={{fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)"}}>{t.val}</span>
              </div>
            ))}
            <div className="dust-arrow">⬇ Sweep in 1 click ⬇</div>
            <div className="dust-result">
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <img src="https://assets.coingecko.com/coins/images/4128/small/solana.png" width={32} height={32} style={{borderRadius:"50%"}} />
                <div>
                  <div style={{fontFamily:"'Cinzel', serif", fontWeight:700, color:"#D4A017", fontSize:16}}>0.0312 SOL</div>
                  <div style={{fontFamily:"'DM Sans', sans-serif", fontSize:12, color:"rgba(255,255,255,0.35)"}}>≈ $4.47 recovered</div>
                </div>
              </div>
              <span style={{color:"#00c878", fontSize:20}}>✅</span>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* LEVELS */}
      <section className="section" id="levels">
        <div style={{textAlign:"center"}}>
          <div className="section-badge">🏆 Level System</div>
          <h2 className="section-title">Evolve, Dominate, Reign</h2>
          <p className="section-desc" style={{margin:"0 auto"}}>Every swap counts. Accumulate experience and climb the Pangeon ranks — all the way to the ultimate title of Pangean.</p>
        </div>
        <div className="levels-grid">
          {LEVELS.map(l => (
            <div key={l.name} className="level-card" style={{borderColor:`${l.color}33`, background:`${l.color}08`}}>
              <div className="level-emoji">{l.emoji}</div>
              <div className="level-name" style={{color:l.color}}>{l.name}</div>
              <div className="level-req">{l.max ? `${l.min} - ${l.max} swaps` : `${l.min}+ swaps`}</div>
              <div className="level-desc">{l.desc}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center", marginTop:40, padding:"24px 32px", borderRadius:20, background:"rgba(212,160,23,0.06)", border:"1px solid rgba(212,160,23,0.12)", maxWidth:600, margin:"40px auto 0"}}>
          <div style={{fontFamily:"'Cinzel', serif", fontSize:18, fontWeight:700, color:"#D4A017", marginBottom:8}}>🌋 The Ultimate Challenge</div>
          <div style={{fontFamily:"'DM Sans', sans-serif", fontSize:15, color:"rgba(255,255,255,0.45)", lineHeight:1.7}}>
            Reaching the <strong style={{color:"#D4A017"}}>Pangean</strong> rank requires 10,000 swaps. A feat reserved for the most dedicated traders. Are you ready?
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* CTA */}
      <section className="cta-section">
        <div style={{position:"absolute",inset:0,overflow:"hidden",zIndex:0}}>
          <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"#D4A017",filter:"blur(200px)",opacity:0.05,top:"50%",left:"50%",transform:"translate(-50%,-50%)"}} />
        </div>
        <div style={{position:"relative",zIndex:10}}>
          <div className="hero-badge" style={{marginBottom:24}}>🦕 Join the Pangea</div>
          <h2 style={{fontFamily:"'Cinzel', serif", fontSize:"clamp(32px, 5vw, 60px)", fontWeight:900, color:"#fff", marginBottom:20}}>
            Ready to swap like a<br />
            <span style={{background:"linear-gradient(135deg, #D4A017, #F5C842)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>Pangean?</span>
          </h2>
          <p style={{fontFamily:"'DM Sans', sans-serif", fontSize:18, color:"rgba(255,255,255,0.4)", marginBottom:40}}>Connect your wallet and start your evolution now.</p>
          <button className="hero-btn-primary" style={{fontSize:18, padding:"18px 48px"}} onClick={() => router.push("/swap")}>
            🚀 Launch Pangeon
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid rgba(212,160,23,0.08)", padding:"32px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <img src="/logo.png" style={{width:32, height:32, objectFit:"contain"}} alt="Pangeon" />
          <span style={{fontFamily:"'Cinzel', serif", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #D4A017, #F5C842)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:1}}>PANGEON</span>
        </div>
        <div style={{fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"rgba(255,255,255,0.2)"}}>
          Built with love ❤️
        </div>
        <div style={{fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"rgba(255,255,255,0.2)"}}>
          © 2026 Pangeon. All rights reserved.
        </div>
      </footer>
    </>
  );
}
