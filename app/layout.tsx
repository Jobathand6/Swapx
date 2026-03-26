"use client";
import "./globals.css";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { base } from "@reown/appkit/networks";
import { solana } from "@reown/appkit/networks";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

const projectId = "e38ae36f744030e43be89df81d3eb7ba";
const queryClient = new QueryClient();

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base],
});

const solanaAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
});

createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  networks: [base, solana],
  defaultNetwork: base,
  projectId,
  metadata: {
    name: "Pangeon",
    description: "Pangeon DEX — Swap & Dust Sweeper",
    url: "https://swapx-vavo.vercel.app",
    icons: ["/logo.png"],
  },
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#D4A017",
    "--w3m-border-radius-master": "12px",
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}