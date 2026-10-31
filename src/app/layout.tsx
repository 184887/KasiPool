import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Bricolage_Grotesque } from "next/font/google";
import type { ReactNode } from "react";
import { getDictionary, getLang } from "@/i18n/server";
import { SITE_URL } from "@/lib/site";
import { Providers } from "./providers";
import "@/styles.css";

// Self-hosted by next/font: no request to Google at runtime and no layout shift.
// Only the body font is preloaded. The heading fonts load when a page uses them, so pages that
// show "Loading" first don't download fonts they don't need yet (data costs money).
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
  metadataBase: new URL(SITE_URL),
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The language saved on this phone. Reading it makes pages render per request, so a shop
  // that chose isiXhosa never sees the English version first.
  const lang = await getLang();
  const dict = await getDictionary(lang);
  return (
    <html
      lang={lang === "xh" ? "xh-ZA" : "en-ZA"}
      className={`${anton.variable} ${bricolage.variable} ${archivo.variable}`}
    >
      <body>
        <Providers lang={lang} dict={dict}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
