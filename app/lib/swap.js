const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const OO_CHAIN_MAP = {
  1: "eth",
  137: "polygon",
  56: "bsc",
  42161: "arbitrum",
  43114: "avax",
  8453: "base",
  10: "optimism",
};

const PS_CHAIN_MAP = {
  1: "1",
  137: "137",
  56: "56",
  42161: "42161",
  43114: "43114",
  8453: "8453",
  10: "10",
};

// Chains where Paraswap works better
const PREFER_PARASWAP = [1, 137, 42161, 10];
// Chains where OpenOcean works better
const PREFER_OPENOCEAN = [56, 43114, 8453];

async function tryOpenOcean({ chainId, src, dest, amountReadable, walletAddress, slippage }) {
  const chain = OO_CHAIN_MAP[chainId];
  if (!chain) throw new Error("Chain not supported by OpenOcean");

  const params = new URLSearchParams({
    type: "quote",
    chainId: chainId.toString(),
    inTokenAddress: src,
    outTokenAddress: dest,
    amount: amountReadable,
    slippage: slippage.toString(),
    account: walletAddress,
  });

  const res = await fetch(`/api/openocean?${params}`);
  const data = await res.json();

  if (data?.data?.to && data?.data?.data) {
    return {
      to: data.data.to,
      data: data.data.data,
      value: data.data.value || "0",
      gas: data.data.estimatedGas,
      source: "OpenOcean",
    };
  }
  throw new Error(data?.error || "OpenOcean: no route found");
}

async function tryParaswap({ chainId, src, dest, amountWei, walletAddress, slippage }) {
  const network = PS_CHAIN_MAP[chainId];
  if (!network) throw new Error("Chain not supported by Paraswap");

  // Step 1: get priceRoute
  const priceParams = new URLSearchParams({
    type: "price",
    network,
    srcToken: src,
    destToken: dest,
    amount: amountWei,
    maxImpact: "100",
  });

  const priceRes = await fetch(`/api/paraswap?${priceParams}`);
  const priceData = await priceRes.json();

  if (!priceData?.priceRoute) throw new Error("Paraswap: no price route");

  // Step 2: get transaction
  const txParams = new URLSearchParams({
    network,
    userAddress: walletAddress,
    ignoreChecks: "true",
    ignoreGasEstimate: "true",
    maxImpact: "100",
  });

  const txRes = await fetch(`/api/paraswap?${txParams}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      srcToken: src,
      destToken: dest,
      srcAmount: amountWei,
      priceRoute: priceData.priceRoute,
      userAddress: walletAddress,
      slippage: Math.floor(slippage * 100),
      maxImpact: 100,
    }),
  });

  const txData = await txRes.json();
  const tx = txData?.transaction || (txData?.to ? txData : null);

  if (tx?.to && tx?.data) {
    return {
      to: tx.to,
      data: tx.data,
      value: tx.value || "0",
      gas: tx.gas,
      source: "Paraswap",
    };
  }
  throw new Error(txData?.error || "Paraswap: no transaction");
}

export async function getSwapPrice({ chainId, fromToken, toToken, amount, decimals = 18 }) {
  try {
    const src = fromToken === "NATIVE" ? NATIVE : fromToken;
    const dest = toToken === "NATIVE" ? NATIVE : toToken;
    const amountReadable = (Number(amount) / Math.pow(10, decimals)).toString();

    // Try OpenOcean for price
    const params = new URLSearchParams({
      type: "price",
      chainId: chainId.toString(),
      inTokenAddress: src,
      outTokenAddress: dest,
      amount: amountReadable,
    });

    const res = await fetch(`/api/openocean?${params}`);
    const data = await res.json();

    if (data?.data?.outAmount) {
      return { buyAmount: data.data.outAmount };
    }

    // Fallback: try Paraswap for price
    const network = PS_CHAIN_MAP[chainId];
    if (network) {
      const priceParams = new URLSearchParams({
        type: "price",
        network,
        srcToken: src,
        destToken: dest,
        amount,
        maxImpact: "100",
      });
      const priceRes = await fetch(`/api/paraswap?${priceParams}`);
      const priceData = await priceRes.json();
      if (priceData?.priceRoute?.destAmount) {
        return { buyAmount: priceData.priceRoute.destAmount };
      }
    }

    return null;
  } catch (e) {
    console.error("getSwapPrice error:", e);
    return null;
  }
}

export async function getSwapQuote({ chainId, fromToken, toToken, amount, decimals = 18, walletAddress, slippage = 1.0 }) {
  const src = fromToken === "NATIVE" ? NATIVE : fromToken;
  const dest = toToken === "NATIVE" ? NATIVE : toToken;
  const amountReadable = (Number(amount) / Math.pow(10, decimals)).toString();

  const errors = [];

  if (PREFER_PARASWAP.includes(chainId)) {
    // Try Paraswap first
    try {
      return await tryParaswap({ chainId, src, dest, amountWei: amount, walletAddress, slippage });
    } catch (e) {
      console.log("Paraswap failed, trying OpenOcean:", e.message);
      errors.push("Paraswap: " + e.message);
    }
    // Fallback to OpenOcean
    try {
      return await tryOpenOcean({ chainId, src, dest, amountReadable, walletAddress, slippage });
    } catch (e) {
      errors.push("OpenOcean: " + e.message);
    }
  } else {
    // Try OpenOcean first
    try {
      return await tryOpenOcean({ chainId, src, dest, amountReadable, walletAddress, slippage });
    } catch (e) {
      console.log("OpenOcean failed, trying Paraswap:", e.message);
      errors.push("OpenOcean: " + e.message);
    }
    // Fallback to Paraswap
    try {
      return await tryParaswap({ chainId, src, dest, amountWei: amount, walletAddress, slippage });
    } catch (e) {
      errors.push("Paraswap: " + e.message);
    }
  }

  throw new Error("No swap route found: " + errors.join(" | "));
}
