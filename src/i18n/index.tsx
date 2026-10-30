"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/format";

import { LANG_COOKIE, type Dictionary, type Lang } from "./config";

export { LANGS, type Lang } from "./config";
type Vars = Record<string, string | number>;
export type TFn = (en: string, vars?: Vars) => string;

const fill = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;

/** Turns "{name}" templates into regexes, once per dictionary */
function serverPatterns(server: Record<string, string>) {
  return Object.entries(server)
    .filter(([en]) => en.includes("{"))
    .map(([en, xh]) => {
      const names: string[] = [];
      const source = en
        .split(/(\{\w+\})/)
        .map((part) => {
          const m = /^\{(\w+)\}$/.exec(part);
          if (!m) return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          names.push(m[1]);
          return "(.+?)";
        })
        .join("");
      return { re: new RegExp(`^${source}$`, "s"), names, xh };
    });
}

function makeT(lang: Lang, dict: Dictionary) {
  const patterns = serverPatterns(dict.server);
  /** Translates a piece of UI text written in English */
  const t = (en: string, vars?: Vars) => fill(dict.ui[en] ?? en, vars);
  /**
   * Same, with simple tags kept: t.rich("Tap <b>Add</b>", { b: (c) => <b>{c}</b> }).
   * Tags can't be nested.
   */
  const rich = (en: string, tags: Record<string, (chunk: ReactNode) => ReactNode>, vars?: Vars) =>
    t(en, vars)
      .split(/(<\w+>.*?<\/\w+>)/s)
      .map((part, i) => {
        const m = /^<(\w+)>(.*?)<\/\1>$/s.exec(part);
        const wrap = m && tags[m[1]];
        return wrap ? <span key={i}>{wrap(m[2])}</span> : part;
      });
  /** Translates a message that came from the database, such as a notification or an error */
  const server = (en: string | null | undefined) => {
    if (!en || lang === "en") return en ?? "";
    const exact = dict.server[en] ?? dict.ui[en];
    if (exact) return exact;
    // Filled-in parts can be words we know too: "your shop", or "5 bales" (a number and a unit)
    const part = (v: string) => {
      const q = /^(\d+) (.+)$/.exec(v);
      return q ? `${q[1]} ${dict.ui[q[2]] ?? q[2]}` : (dict.ui[v] ?? v);
    };
    for (const p of patterns) {
      const m = p.re.exec(en);
      if (m) return fill(p.xh, Object.fromEntries(p.names.map((n, i) => [n, part(m[i + 1])])));
    }
    return en;
  };
  /** "5 bales", with the unit translated (units come from the products table in English) */
  const qty = (n: number, unit: string) => `${n} ${t(plural(unit, n))}`;
  return { lang, t, rich, server, qty };
}

/** English with {placeholders} filled, for code that runs outside a component */
export const english: TFn = (en, vars) => fill(en, vars);

const Ctx = createContext(makeT("en", { ui: {}, server: {} }));

export function LanguageProvider({
  lang,
  dict,
  children,
}: {
  lang: Lang;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo(() => makeT(lang, dict), [lang, dict]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The current language and its translate functions */
export const useT = () => useContext(Ctx);

/** Saves the language on this phone for a year and reloads the page in it */
export function useSetLang() {
  const router = useRouter();
  return (lang: Lang) => {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
}
