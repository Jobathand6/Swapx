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