import type { MetadataRoute } from "next";

// Lets phones install KasiPool to the home screen and open it full-screen like an app
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KasiPool",
    short_name: "KasiPool",
    description: "Township businesses buy stock together at bulk prices.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F3F0EA",
    theme_color: "#1C1A17",
    lang: "en-ZA",
    categories: ["business", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Deals", url: "/offers", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      {
        name: "My Pools",
        url: "/my-pools",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
