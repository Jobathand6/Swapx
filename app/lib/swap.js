const CHAIN_NETWORK_MAP = {
  1: "1",
  137: "137",
  56: "56",
  42161: "42161",
  43114: "43114",
  8453: "8453",
  10: "10",
};

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function getSwapPrice({ chainId, fromToken, toToken, amount }) {
  try {
    const network = CHAIN_NETWORK_MAP[chainId] || "1";
    const srcToken = fromToken === "NATIVE" ? NATIVE_TOKEN : fromToken;
    const destToken = toToken === "NATIVE" ? NATIVE_TOKEN : toToken;

    const params = new URLSearchParams({
      type: "price",
      network,
      srcToken,
      destToken,
      amount,
    });

    const res = await fetch(`/api/paraswap?${params}`);
    const data = await res.json();

    if (data?.priceRoute?.destAmount) {
      return { buyAmount: data.priceRoute.destAmount, priceRoute: data.priceRoute };
    }
    return null;
  } catch (e) {
    console.error("Paraswap price error:", e);
    return null;
  }
}

export async function getSwapQuote({ chainId, fromToken, toToken, amount, walletAddress, slippage = 0.5 }) {
  try {
    const network = CHAIN_NETWORK_MAP[chainId] || "1";
    const srcToken = fromToken === "NATIVE" ? NATIVE_TOKEN : fromToken;
    const destToken = toToken === "NATIVE" ? NATIVE_TOKEN : toToken;

    // Étape 1 : obtenir le priceRoute
    const priceParams = new URLSearchParams({
      type: "price",
      network,
      srcToken,
      destToken,
      amount,
    });

    const priceRes = await fetch(`/api/paraswap?${priceParams}`);
    const priceData = await priceRes.json();

    if (!priceData?.priceRoute) throw new Error("Pas de priceRoute");

    // Étape 2 : obtenir la transaction
    const txParams = new URLSearchParams({
      network,
      userAddress: walletAddress,
    });

    const txRes = await fetch(`/api/paraswap?${txParams}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        srcToken,
        destToken,
        srcAmount: amount,
        priceRoute: priceData.priceRoute,
        userAddress: walletAddress,
        slippage: Math.floor(slippage * 100),
      }),
    });

    const txData = await txRes.json();

    if (txData?.transaction) {
      return { transaction: txData.transaction };
    }
    if (txData?.to) {
      return { transaction: txData };
    }

    throw new Error(txData?.error || "Transaction invalide");
  } catch (e) {
    console.error("Paraswap quote error:", e);
    throw e;
  }
}