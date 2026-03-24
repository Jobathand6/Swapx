import { createWalletClient, createPublicClient, custom, http, parseEther } from "viem";
import { mainnet, polygon, bsc, arbitrum, avalanche, base, optimism } from "viem/chains";

const CHAIN_MAP = {
  1: mainnet,
  137: polygon,
  56: bsc,
  42161: arbitrum,
  43114: avalanche,
  8453: base,
  10: optimism,
};

export async function sendSwapTransaction({ chainId, to, data, value = "0", gas }) {
  const provider = window.ethereum?.providers?.find(p => p.isMetaMask) || window.ethereum;
  if (!provider) throw new Error("No wallet detected");

  const chain = CHAIN_MAP[chainId];
  if (!chain) throw new Error("Unsupported chain");

  const walletClient = createWalletClient({
    chain,
    transport: custom(provider),
  });

  const [address] = await walletClient.getAddresses();

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  // Estimer le gas si non fourni
  let gasLimit = gas ? BigInt(gas) : undefined;
  if (!gasLimit) {
    try {
      gasLimit = await publicClient.estimateGas({
        account: address,
        to: to,
        data: data,
        value: BigInt(value || "0"),
      });
      gasLimit = (gasLimit * 120n) / 100n; // +20% de marge
    } catch (e) {
      console.log("Gas estimation failed, using default");
    }
  }

  const txHash = await walletClient.sendTransaction({
    account: address,
    to: to,
    data: data,
    value: BigInt(value || "0"),
    ...(gasLimit && { gas: gasLimit }),
  });

  return { transactionHash: txHash };
}

export async function approveToken({ chainId, tokenAddress, spenderAddress }) {
  const provider = window.ethereum?.providers?.find(p => p.isMetaMask) || window.ethereum;
  if (!provider) throw new Error("No wallet detected");

  const chain = CHAIN_MAP[chainId];
  if (!chain) throw new Error("Unsupported chain");

 const walletClient = createWalletClient({
    chain,
    transport: custom(provider),
  });

  const [address] = await walletClient.getAddresses();

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Changer de chaîne si nécessaire
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    console.log("Chain switch:", e.message);
  }

  // Encode approve(spender, maxUint256)
  const maxUint256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const approveData = "0x095ea7b3" +
    spenderAddress.slice(2).padStart(64, "0") +
    maxUint256.slice(2);

  const txHash = await walletClient.sendTransaction({
    account: address,
    to: tokenAddress,
    data: approveData,
    value: BigInt(0),
  });

  return txHash;
}
