"use client";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "Pangeon",
  projectId: "e38ae36f744030e43be89df81d3eb7ba",
  chains: [base],
  ssr: false,
});

const queryClient = new QueryClient();
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=b82f7243-5b22-44ae-a3d4-d5869d9c5334";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#D4A017',
          accentColorForeground: '#000000',
          borderRadius: 'medium',
          fontStack: 'system',
          overlayBlur: 'small',
        })}>
          <ConnectionProvider endpoint={HELIUS_RPC}>
            <WalletProvider wallets={wallets} autoConnect>
              {children}
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}