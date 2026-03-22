import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const network = searchParams.get("network") || "polygon";

  if (type === "price") {
    const srcToken = searchParams.get("srcToken");
    const destToken = searchParams.get("destToken");
    const amount = searchParams.get("amount");
    const srcDecimals = searchParams.get("srcDecimals") || "18";
    const destDecimals = searchParams.get("destDecimals") || "18";

    const res = await fetch(
      `https://apiv5.paraswap.io/prices?srcToken=${srcToken}&destToken=${destToken}&amount=${amount}&srcDecimals=${srcDecimals}&destDecimals=${destDecimals}&side=SELL&network=${network}`,
      { headers: { "Accept": "application/json" } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (type === "transaction") {
    const body = await request.json().catch(() => ({}));
    const userAddress = searchParams.get("userAddress");
    const network2 = searchParams.get("network") || "polygon";

    const res = await fetch(
      `https://apiv5.paraswap.io/transactions/${network2}?ignoreChecks=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ ...body, userAddress }),
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Type invalide" }, { status: 400 });
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network") || "polygon";
  const userAddress = searchParams.get("userAddress");
  const body = await request.json();

  const res = await fetch(
    `https://apiv5.paraswap.io/transactions/${network}?ignoreChecks=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ ...body, userAddress }),
    }
  );
  const data = await res.json();
  return NextResponse.json(data);
}