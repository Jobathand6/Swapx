"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";



const LEVELS = [
  { name: "Fossil",  emoji: "🪨", min: 0,     max: 49,       color: "#8B7355", bg: "rgba(139,115,85,0.15)",   desc: "Effectue ton premier swap pour commencer l'aventure." },
  { name: "Egg",     emoji: "🥚", min: 50,    max: 499,      color: "#C8B89A", bg: "rgba(200,184,154,0.15)",  desc: "50 swaps accomplis. Quelque chose couve..." },
  { name: "Reptile", emoji: "🦎", min: 500,   max: 1999,     color: "#4CAF50", bg: "rgba(76,175,80,0.15)",    desc: "500 swaps. Tu évolues rapidement !" },
  { name: "Raptor",  emoji: "🦴", min: 2000,  max: 4999,     color: "#2196F3", bg: "rgba(33,150,243,0.15)",   desc: "2000 swaps. Un prédateur redoutable." },
  { name: "Rex",     emoji: "🦖", min: 5000,  max: 9999,     color: "#FF5722", bg: "rgba(255,87,34,0.15)",    desc: "5000 swaps. Tu domines la chaîne." },
  { name: "Pangean", emoji: "🌋", min: 10000, max: Infinity, color: "#D4A017", bg: "rgba(212,160,23,0.15)",   desc: "10000 swaps. Tu as atteint le sommet de Pangée." },
];

function getLevel(n) { return LEVELS.find(l => n >= l.min && n <= l.max) || LEVELS[0]; }
function getProgress(n) { const l = getLevel(n); if (l.max === Infinity) return 100; return Math.floor(((n - l.min) / (l.max - l.min + 1)) * 100); }
function getNextLevel(n) { const i = LEVELS.findIndex(l => n >= l.min && n <= l.max); return i < LEVELS.length - 1 ? LEVELS[i + 1] : null; }

const STARS = Array.from({ length: 36 }, (_, i) => ({
  id: i, top: `${(i * 37 + 11) % 60}%`, left: `${(i * 53 + 7) % 100}%`,
  size: i % 4 === 0 ? 2 : 1, opacity: ((i * 17 + 3) % 6) * 0.08 + 0.1,
}));

export default function ProfilePage() {
 const { address: account } = useAppKitAccount();
  const [swapCount,    setSwapCount]    = useState(0);
  const [swapVolume,   setSwapVolume]   = useState(0);
  const [dustVolume,   setDustVolume]   = useState(0);

  useEffect(() => {
    const sc = localStorage.getItem("pangeon_swap_count");
    const sv = localStorage.getItem("pangeon_swap_volume");
    const dv = localStorage.getItem("pangeon_dust_volume");
    if (sc) setSwapCount(parseInt(sc));
    if (sv) setSwapVolume(parseFloat(sv));
    if (dv) setDustVolume(parseFloat(dv));
  }, []);

  const currentLevel = getLevel(swapCount);
  const progress     = getProgress(swapCount);
  const nextLevel    = getNextLevel(swapCount);

  const shortAddress = account?.address
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        body { background: #060408; }
        .prof-card { background: rgba(12,8,3,0.9); border: 1px solid rgba(212,160,23,0.15); border-radius: 24px; padding: 24px; backdrop-filter: blur(24px); margin-bottom: 16px; }
        .prof-stat { background: rgba(20,14,6,0.9); border: 1px solid rgba(212,160,23,0.08); border-radius: 16px; padding: 16px 20px; flex: 1; }
        .prof-level-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; border: 1px solid; margin-bottom: 10px; transition: all 0.2s; }
        .prof-level-item:last-child { margin-bottom: 0; }
      `}</style>

      {/* Fond volcans */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "linear-gradient(180deg,#060408 0%,#0a0805 40%,#100c04 70%,#180e00 100%)" }}>
        {STARS.map(s => <div key={s.id} style={{ position: "absolute", width: s.size, height: s.size, background: "#fff", borderRadius: "50%", top: s.top, left: s.left, opacity: s.opacity }} />)}
        <div style={{ position: "absolute", bottom: 0, left: "8%", width: 0, height: 0, borderLeft: "130px solid transparent", borderRight: "130px solid transparent", borderBottom: "280px solid #120800" }} />
        <div style={{ position: "absolute", bottom: 170, left: "calc(8% + 10px)", width: 200, height: 110, background: "#ff4400", borderRadius: "50%", filter: "blur(50px)", opacity: 0.13 }} />
        <div style={{ position: "absolute", bottom: 0, left: "40%", width: 0, height: 0, borderLeft: "210px solid transparent", borderRight: "210px solid transparent", borderBottom: "400px solid #150a00" }} />
        <div style={{ position: "absolute", bottom: 260, left: "calc(40% + 70px)", width: 300, height: 160, background: "#ff5500", borderRadius: "50%", filter: "blur(70px)", opacity: 0.1 }} />
        <div style={{ position: "absolute", bottom: 0, right: "5%", width: 0, height: 0, borderLeft: "160px solid transparent", borderRight: "160px solid transparent", borderBottom: "330px solid #120800" }} />
        <div style={{ position: "absolute", bottom: 190, right: "calc(5% + 20px)", width: 240, height: 140, background: "#ff4400", borderRadius: "50%", filter: "blur(60px)", opacity: 0.12 }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(6,4,8,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,160,23,0.1)", height: 64, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 24px", gap: 16 }}>
        <a href="/swap" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png" style={{ width: 40, height: 40, objectFit: "contain" }} alt="Pangeon" />
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, background: "linear-gradient(135deg,#D4A017,#F5C842,#D4A017)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>PANGEON</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <a href="/profile" style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: "rgba(212,160,23,0.08)", color: "#D4A017", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>👤 Profil</a>
          <a href="/swap"    style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: "transparent", color: "#ffffff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>⚡ Swap</a>
          <a href="/dust"    style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: "transparent", color: "#ffffff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>🧹 Sweep</a>
        </div>
<div style={{ display: "flex", justifyContent: "flex-end" }}>
  <appkit-button />
</div>

      </nav>

      {/* Contenu */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: 90, paddingBottom: 60, maxWidth: 680, margin: "0 auto", padding: "90px 20px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{currentLevel.emoji}</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 700, color: currentLevel.color, marginBottom: 6 }}>{currentLevel.name}</div>
          {shortAddress && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", background: "rgba(212,160,23,0.06)", padding: "4px 12px", borderRadius: 8, display: "inline-block" }}>{shortAddress}</div>}
        </div>

        {/* Barre de progression */}
        <div className="prof-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 600, color: "#D4A017" }}>Progression</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{swapCount} swaps</span>
          </div>
          <div style={{ width: "100%", height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", borderRadius: 5, width: `${progress}%`, background: `linear-gradient(90deg,${currentLevel.color},${nextLevel ? nextLevel.color : currentLevel.color})`, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            <span>{currentLevel.name} ({currentLevel.min})</span>
            <span style={{ color: currentLevel.color, fontWeight: 600 }}>{progress}%</span>
            <span>{nextLevel ? `${nextLevel.name} (${nextLevel.min})` : "MAX"}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div className="prof-stat">
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Swaps effectués</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 700, color: "#D4A017" }}>{swapCount}</div>
          </div>
          <div className="prof-stat">
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Volume Swap</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 700, color: "#D4A017" }}>${swapVolume.toFixed(2)}</div>
          </div>
          <div className="prof-stat">
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Volume Dust</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 700, color: "#D4A017" }}>${dustVolume.toFixed(2)}</div>
          </div>
        </div>

        {/* Niveaux */}
        <div className="prof-card">
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 600, color: "#D4A017", marginBottom: 16 }}>Les 6 niveaux</div>
          {LEVELS.map(l => {
            const unlocked = swapCount >= l.min;
            const isCurrent = l.name === currentLevel.name;
            return (
              <div key={l.name} className="prof-level-item" style={{ borderColor: isCurrent ? l.color : unlocked ? `${l.color}40` : "rgba(255,255,255,0.06)", background: isCurrent ? l.bg : "transparent", opacity: unlocked ? 1 : 0.45 }}>
                <span style={{ fontSize: 32 }}>{l.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 15, color: isCurrent ? l.color : "#fff" }}>{l.name}</span>
                    {isCurrent && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: l.bg, color: l.color, border: `1px solid ${l.color}50`, fontWeight: 600 }}>ACTUEL</span>}
                    {unlocked && !isCurrent && <span style={{ fontSize: 10, color: "#00c878" }}>✓ Débloqué</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{l.desc}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{l.max === Infinity ? `${l.min}+ swaps` : `${l.min} – ${l.max} swaps`}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}