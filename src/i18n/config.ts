export type Lang = "en" | "xh";
export const LANGS: { code: Lang; name: string }[] = [
  { code: "en", name: "English" },
  { code: "xh", name: "isiXhosa" },
];
export const LANG_COOKIE = "kp-lang";

/**
 * Translations are keyed by the English text, so English needs no dictionary and anything not
 * translated yet shows in English. `server` holds messages written by the database
 * (notifications, errors), which may contain {placeholders} for names, numbers and dates.
 */
export type Dictionary = { ui: Record<string, string>; server: Record<string, string> };
