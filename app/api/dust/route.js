import { NextResponse } from "next/server";

const ZEROX_API_KEY = process.env.NEXT_PUBLIC_ZEROX_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const chainId = searchParams.get("chainId");
  const sellToken = searchParams.get("sellToken");
  const buyToken = searchParams.get("buyToken");
  const sellAmount = searchParams.get("sellAmount");
  const taker = searchParams.get("taker");

  const params = new URLSearchParams({
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps: "100",
  });

  const res = await fetch(
    `https://api.0x.org/swap/permit2/quote?${params}`,
    {
      headers: {
        "0x-api-key": ZEROX_API_KEY,
        "0x-version": "v2",
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}