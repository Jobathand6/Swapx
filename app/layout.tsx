import "./globals.css";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('load', function() {
            try {
              if (window.phantom?.solana) {
                window.phantom.solana._events = {};
                window.phantom.solana.isConnected = true;
              }
            } catch(e) {}
          });
        `}} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}