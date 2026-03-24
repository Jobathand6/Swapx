const CHAIN_MAP_PARASWAP = {
  1: "1", 137: "137", 56: "56", 42161: "42161",
  43114: "43114", 8453: "8453", 10: "10",
};

const CHAIN_MAP_OPENOCEAN = {
  1: "eth", 137: "polygon", 56: "bsc", 42161: "arbitrum",
  43114: "avax", 8453: "base", 10: "optimism",
};

const NATIVE_TOKEN_PARASWAP = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const NATIVE_TOKEN_OPENOCEAN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function getSwapPrice({ chainId, fromToken, toToken, amount, decimals = 18 }) {
  console.log("getSwapPrice called - amount:", amount, "decimals:", decimals);
  try {
    const srcToken = fromToken === "NATIVE" ? NATIVE_TOKEN_OPENOCEAN : fromToken;
    const destToken = toToken === "NATIVE" ? NATIVE_TOKEN_OPENOCEAN : toToken;

    const amountReadable = (Number(amount) / Math.pow(10, decimals)).toString();

    const params = new URLSearchParams({
      type: "price",
      chainId: chainId.toString(),
      inTokenAddress: srcToken,
      outTokenAddress: destToken,
      amount: amountReadable,
    });

    const res = await fetch(`/api/openocean?${params}`);
    const data = await res.json();

    if (data?.data?.outAmount) {
      return { buyAmount: data.data.outAmount };
    }
    return null;
  } catch (e) {
    console.error("OpenOcean price error:", e);
    return null;
  }
}

export async function getSwapQuote({ chainId, fromToken, toToken, amount, decimals = 18, walletAddress, slippage = 0.5 }) {
  try {
    const srcToken = fromToken === "NATIVE" ? NATIVE_TOKEN_OPENOCEAN : fromToken;
    const destToken = toToken === "NATIVE" ? NATIVE_TOKEN_OPENOCEAN : toToken;

    const amountReadable = (Number(amount) / Math.pow(10, decimals)).toString();

    const params = new URLSearchParams({
      type: "quote",
      chainId: chainId.toString(),
      inTokenAddress: srcToken,
      outTokenAddress: destToken,
      amount: amountReadable,
      slippage: slippage.toString(),
      account: walletAddress,
    });

    const res = await fetch(`/api/openocean?${params}`);
    const data = await res.json();

    console.log("OpenOcean response:", JSON.stringify(data?.data));
    if (data?.data?.to) {
      return {
        transaction: {
          to: data.data.to,
          data: data.data.data,
          value: "0",
          gas: data.data.estimatedGas,
        }
      };
    }

    throw new Error(data?.error || "No transaction data");
  } catch (e) {
    console.error("OpenOcean quote error:", e);
    throw e;
  }
}