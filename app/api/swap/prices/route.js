import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 30 },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}