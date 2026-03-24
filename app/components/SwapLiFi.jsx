"use client";

export default function SwapLiFi() {
  return (
    <div style={{
      width: "100%",
      borderRadius: 24,
      overflow: "hidden",
      border: "1px solid rgba(212,160,23,0.15)",
      background: "#060408",
      boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
      backdropFilter: "blur(20px)",
    }}>
      <div style={{
        padding: "16px 16px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: -8,
      }}>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 18,
          fontWeight: 700,
          color: "#D4A017",
          letterSpacing: 1,
        }}>Swap</span>
        
      </div>
      <iframe
        src="https://thirdweb.com/bridge/swap-widget?theme=dark&primaryColor=D4A017&borderRadius=16"
        width="100%"
        height="580"
        style={{border:"none", display:"block"}}
        title="Pangeon Swap"
      />
    </div>
  );
}