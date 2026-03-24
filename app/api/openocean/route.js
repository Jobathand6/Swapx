import { NextResponse } from "next/server";

const CHAIN_MAP = {
  1: "eth",
  137: "polygon",
  56: "bsc",
  42161: "arbitrum",
  43114: "avax",
  8453: "base",
  10: "optimism",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const chainId = searchParams.get("chainId");
  const chain = CHAIN_MAP[chainId] || "eth";

  if (type === "quote") {
    const inTokenAddress = searchParams.get("inTokenAddress");
    const outTokenAddress = searchParams.get("outTokenAddress");
    const amount = searchParams.get("amount");
    const slippage = searchParams.get("slippage") || "1";
    const account = searchParams.get("account");

    const res = await fetch(
      `https://open-api.openocean.finance/v3/${chain}/swap_quote?inTokenAddress=${inTokenAddress}&outTokenAddress=${outTokenAddress}&amount=${amount}&slippage=${slippage}&account=${account}&gasPrice=50`,
      { headers: { "Accept": "application/json" } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (type === "price") {
    const inTokenAddress = searchParams.get("inTokenAddress");
    const outTokenAddress = searchParams.get("outTokenAddress");
    const amount = searchParams.get("amount");

    const res = await fetch(
      `https://open-api.openocean.finance/v3/${chain}/quote?inTokenAddress=${inTokenAddress}&outTokenAddress=${outTokenAddress}&amount=${amount}&gasPrice=50`,
      { headers: { "Accept": "application/json" } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}