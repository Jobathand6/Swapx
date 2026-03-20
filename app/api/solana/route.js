import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "quote") {
    const inputMint = searchParams.get("inputMint");
    const outputMint = searchParams.get("outputMint");
    const amount = searchParams.get("amount");
    const slippageBps = searchParams.get("slippageBps") || "50";

    const res = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (type === "swap") {
    const body = await request.json().catch(() => ({}));
    const res = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (type === "tokens") {
    const res = await fetch("https://token.jup.ag/strict");
    const data = await res.json();
    return NextResponse.json(data.slice(0, 50));
  }

  return NextResponse.json({ error: "Type invalide" }, { status: 400 });
}

export async function POST(request) {
  const body = await request.json();
  
  const res = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  const data = await res.json();
  return NextResponse.json(data);
}