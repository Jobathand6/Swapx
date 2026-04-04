"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi";;
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

const projectId = "e38ae36f744030e43be89df81d3eb7ba";

const config = createConfig({
  chains: [base],
  connectors: [
    walletConnect({ projectId }),
    injected(),
    coinbaseWallet({ appName: "Pangeon" }),
  ],
  transports: {
    [base.id]: http(),
  },
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#D4A017",
    "--w3m-border-radius-master": "12px",
    "--w3m-font-family": "'DM Sans', sans-serif",
  },
});

const queryClient = new QueryClient();
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=b82f7243-5b22-44ae-a3d4-d5869d9c5334";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={HELIUS_RPC}>
          <WalletProvider wallets={wallets} autoConnect>
            {children}
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}