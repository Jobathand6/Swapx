import { createConfig, http } from "wagmi";
import { mainnet, polygon, bsc, arbitrum, avalanche, base, optimism } from "wagmi/chains";
import { metaMask, coinbaseWallet, walletConnect } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, bsc, arbitrum, avalanche, base, optimism],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: "Pangeon" }),
    walletConnect({ projectId: "YOUR_PROJECT_ID" }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
});
