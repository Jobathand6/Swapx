import { NextResponse } from "next/server";
import { createJupiterApiClient } from "@jup-ag/api";

const jupiterApi = createJupiterApiClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "quote") {
    const inputMint = searchParams.get("inputMint");
    const outputMint = searchParams.get("outputMint");
    const amount = searchParams.get("amount");
    const slippageBps = parseInt(searchParams.get("slippageBps") || "50");

    try {
      const quote = await jupiterApi.quoteGet({
        inputMint,
        outputMint,
        amount: parseInt(amount),
        slippageBps,
      });
      return NextResponse.json(quote);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
if (type === "search") {
  const query = searchParams.get("q") || "";
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    const seen = new Set();
// Fetch decimals from Helius
    let decimalsMap = {};
    try {
      const mints = (data.pairs || [])
        .filter(p => p.chainId === "solana")
        .map(p => p.baseToken.address)
        .slice(0, 20);
      
      const heliusRes = await fetch("https://mainnet.helius-rpc.com/?api-key=b82f7243-5b22-44ae-a3d4-d5869d9c5334", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "getMultipleAccounts",
          params: [mints, { encoding: "jsonParsed" }]
        }),
      });
      const heliusData = await heliusRes.json();
      heliusData.result?.value?.forEach((acc, i) => {
        if (acc?.data?.parsed?.info?.decimals !== undefined) {
          decimalsMap[mints[i]] = acc.data.parsed.info.decimals;
        }
      });
    } catch { }

    const results = (data.pairs || [])
      .filter(p => p.chainId === "solana")
      .map(p => ({
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        mint: p.baseToken.address,
        logo: p.info?.imageUrl || "",
        decimals: decimalsMap[p.baseToken.address] ?? 6,
      }))
      .filter(t => {
        if (seen.has(t.mint)) return false;
        seen.add(t.mint);
        return true;
      })
      .slice(0, 20);
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
if (type === "search-base") {
  const query = searchParams.get("q") || "";
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    const seen = new Set();
    const results = (data.pairs || [])
      .filter(p => p.chainId === "base")
      .map(p => ({
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        address: p.baseToken.address,
        logo: p.info?.imageUrl || "",
        decimals: 18,
      }))
      .filter(t => {
        if (seen.has(t.address)) return false;
        seen.add(t.address);
        return true;
      })
      .slice(0, 20);
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function POST(request) {
  const body = await request.json();
  
try {
    const swapResult = await jupiterApi.swapPost({
      swapRequest: {
        quoteResponse: body.quoteResponse,
        userPublicKey: body.userPublicKey,
        wrapAndUnwrapSol: body.wrapAndUnwrapSol ?? true,
      }
    });
    return NextResponse.json(swapResult);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}