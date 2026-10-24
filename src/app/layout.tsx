import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "@/styles.css";

export const metadata: Metadata = {
  title: "KasiPool — Individual businesses. Combined buying power.",
  description:
    "KasiPool helps Cape Town township businesses coordinate pooled purchases for stock they already buy.",
  openGraph: {
    title: "KasiPool — Individual businesses. Combined buying power.",
    description:
      "Join other local businesses to coordinate a larger purchase, with clear quantities, prices and deadlines.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#142344",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
