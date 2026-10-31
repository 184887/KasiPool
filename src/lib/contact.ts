/** Digits for a wa.me link: "082 123 4567" or "+27 82 123 4567" -> "27821234567" */
export function waNumber(n: string) {
  const d = n.replace(/\D/g, "");
  return d.startsWith("0") ? `27${d.slice(1)}` : d;
}

/** Tappable links for the contact details set in Admin -> Settings */
export const contactHref = {
  whatsapp: (n: string) => `https://wa.me/${waNumber(n)}`,
  phone: (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`,
  email: (e: string) => `mailto:${e}`,
};
