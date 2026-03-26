"use client";
import "./globals.css";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

const { connectors } = getDefaultWallets({
  appName: "Pangeon",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
});

const config = createConfig({
  chains: [base],
  connectors,
  transports: { [base.id]: http() },
});

const queryClient = new QueryClient();
const solanaWallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <ConnectionProvider endpoint={SOLANA_RPC}>
                <WalletProvider wallets={solanaWallets} autoConnect>
                  <WalletModalProvider>
                    {children}
                  </WalletModalProvider>
                </WalletProvider>
              </ConnectionProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}