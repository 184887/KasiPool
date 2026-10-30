import { cookies } from "next/headers";
import { LANG_COOKIE, type Dictionary, type Lang } from "./config";

/** The language saved on this phone (English unless the shop chose isiXhosa) */
export async function getLang(): Promise<Lang> {
  return (await cookies()).get(LANG_COOKIE)?.value === "xh" ? "xh" : "en";
}

/** Only the chosen language is sent to the phone; English needs no dictionary */
export async function getDictionary(lang: Lang): Promise<Dictionary> {
  if (lang === "xh") return (await import("./xh")).xh;
  return { ui: {}, server: {} };
}
