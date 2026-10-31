import { ImageResponse } from "next/og";

// The picture WhatsApp and other apps show for a shared KasiPool link. Built once at build time.
// Colours are the theme tokens written out, since images can't read CSS variables.
export const alt = "KasiPool | Collective Buying Alliance. Buy Together. Profit Better.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: "#1C1A17",
        color: "#F3F0EA",
      }}
    >
      <svg width="200" height="130" viewBox="0 0 400 260">
        <circle cx="130" cy="130" r="105" fill="none" stroke="#F2892B" strokeWidth="36" />
        <circle cx="270" cy="130" r="105" fill="none" stroke="#3E9A62" strokeWidth="36" />
        <path
          d="M174.4,34.8 A105,105 0 0 1 220.9,77.5"
          fill="none"
          stroke="#F2892B"
          strokeWidth="36"
        />
      </svg>
      <div style={{ display: "flex", marginTop: 40, fontSize: 120, fontWeight: 800 }}>
        Kasi<span style={{ color: "#F2892B" }}>Pool</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 44, color: "#F7C934" }}>
        Buy Together. Profit Better.
      </div>
      <div style={{ marginTop: 28, fontSize: 32, opacity: 0.8 }}>
        Local shops pool their stock orders to get wholesale prices.
      </div>
    </div>,
    size,
  );
}
