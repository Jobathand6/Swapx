import { NextResponse } from "next/server";

const ZEROX_API_KEY = process.env.NEXT_PUBLIC_ZEROX_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "price" ou "quote"
  
  const params = new URLSearchParams({
    chainId: searchParams.get("chainId"),
    sellToken: searchParams.get("sellToken"),
    buyToken: searchParams.get("buyToken"),
    sellAmount: searchParams.get("sellAmount"),
  });

  if (type === "quote") {
    params.append("taker", searchParams.get("taker"));
    params.append("slippageBps", searchParams.get("slippageBps") || "50");
  }

  const endpoint = type === "quote" ? "quote" : "price";

  const res = await fetch(
    `https://api.0x.org/swap/permit2/${endpoint}?${params}`,
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