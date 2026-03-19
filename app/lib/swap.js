export async function getSwapQuote({ chainId, fromToken, toToken, amount, walletAddress, slippage = 0.5 }) {
  try {
    const sellToken = fromToken === "NATIVE" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : fromToken;
    const buyToken = toToken === "NATIVE" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : toToken;

    const params = new URLSearchParams({
      type: "quote",
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount: amount,
      taker: walletAddress,
      slippageBps: Math.floor(slippage * 100).toString(),
    });

    const res = await fetch(`/api/swap?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Quote error:", e);
    throw e;
  }
}

export async function getSwapPrice({ chainId, fromToken, toToken, amount }) {
  try {
    const sellToken = fromToken === "NATIVE" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : fromToken;
    const buyToken = toToken === "NATIVE" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : toToken;

    const params = new URLSearchParams({
      type: "price",
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount: amount,
    });

    const res = await fetch(`/api/swap?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Price error:", e);
    throw e;
  }
}