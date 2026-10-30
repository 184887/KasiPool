import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Bricolage_Grotesque } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "@/styles.css";

// Self-hosted by next/font: no request to Google at runtime and no layout shift.
// Only the body font is preloaded. Headline and heading fonts mostly appear after a page's data
// loads, so preloading them only competes with the JS and data on slow prepaid connections.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  preload: false,
});
const bricolage = Bricolage_Grotesque({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-bricolage",
  preload: false,
});
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: { default: "KasiPool | Collective Buying Alliance", template: "%s | KasiPool" },
  description:
    "KasiPool helps Cape Town township businesses coordinate pooled purchases for stock they already buy.",
  openGraph: {
    title: "KasiPool | Collective Buying Alliance",
    description:
      "Join other local businesses to coordinate a larger purchase, with clear quantities, prices and deadlines.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  // Home screen name and status bar on iPhone (Android reads the manifest)
  appleWebApp: { capable: true, title: "KasiPool", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#1c1a17",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA" className={`${anton.variable} ${bricolage.variable} ${archivo.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
