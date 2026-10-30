/** Public address of the site. Metadata resolves relative image and canonical URLs against it. */
export const SITE_URL = "https://kasipool.co.za";

/**
 * Link preview picture (1200x630) for WhatsApp, Facebook and X. A page that sets its own
 * `openGraph` replaces the root layout's, so each one lists this image again.
 */
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "KasiPool: Buy Together. Profit Better.",
};
