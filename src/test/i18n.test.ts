import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { xh } from "@/i18n/xh";
import { BUSINESS_TYPES } from "@/components/kp/BusinessForm";
import { STEPS } from "@/views/home";
import {
  FULFIL_STATUS,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  POOL_STATUS,
  TIMELINE,
} from "@/lib/status";

const SRC = path.resolve(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory())
      return ["admin", "test", "integrations", "i18n"].includes(f) ? [] : files(p);
    return /\.tsx?$/.test(f) ? [p] : [];
  });
}

/** The string literals in a call's first argument (both sides of a ternary count) */
function firstArgStrings(src: string, from: number) {
  const out: string[] = [];
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = "";
      while (src[j] !== c) {
        if (src[j] === "\\") s += src[++j];
        else s += src[j];
        j++;
      }
      out.push(s);
      i = j;
    } else if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") {
      if (depth-- === 0) break;
    } else if (c === "," && depth === 0) break;
  }
  return out;
}

/** Every English text the shop screens pass to t() or rich(), plus labels kept in data */
function usedKeys() {
  const keys = new Set<string>();
  for (const f of files(SRC)) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/\b(?:t|rich)\(/g))
      firstArgStrings(src, m.index + m[0].length).forEach((k) => k && keys.add(k));
    // <Row k="..."> labels and { title, body } options, translated where they are shown.
    // Page metadata (src/app) stays English.
    if (f.includes(`${path.sep}app${path.sep}`)) continue;
    for (const m of src.matchAll(/\bk="([^"]+)"|\b(?:title|body): "([^"]+)"/g))
      keys.add(m[1] ?? m[2]);
  }
  return keys;
}

/** English texts kept in data and translated where they are shown */
const dataKeys = [
  ...Object.values(POOL_STATUS).map((s) => s.customer),
  ...Object.values(PAYMENT_STATUS).map((s) => s.label),
  ...Object.values(ORDER_STATUS).map((s) => s.label),
  ...Object.values(FULFIL_STATUS)
    .map((s) => s.label)
    .filter((l) => l !== "-"),
  ...Object.values(PAYMENT_METHOD),
  ...TIMELINE,
  ...STEPS.flatMap((s) => [s.title, s.body]),
  ...BUSINESS_TYPES,
  "Other",
  // nextAction() results, bottom bar labels and sign-in errors
  ...Array.from(
    readFileSync(path.join(SRC, "lib", "status.ts"), "utf8").matchAll(
      /return (?:\w+ \? )?"([^"]+)"(?: : "([^"]+)")?/g,
    ),
  ).flatMap((m) => [m[1], m[2]].filter(Boolean)),
  "Home",
  "Wrong mobile number or PIN",
  "This number is already registered. Log in instead.",
  "Too many tries. Please wait a few minutes.",
  "You can't register right now. Please try again later.",
];

describe("isiXhosa translations", () => {
  it("cover every text on the shop screens", () => {
    const missing = [...new Set([...usedKeys(), ...dataKeys])].filter((k) => !(k in xh.ui));
    // I18N_MISSING=<file> npx vitest run src/test/i18n.test.ts writes the list for translators
    if (process.env.I18N_MISSING)
      writeFileSync(process.env.I18N_MISSING, JSON.stringify(missing, null, 1));
    expect(missing).toEqual([]);
  });

  it("keep the same {placeholders} and <tags> as the English", () => {
    const marks = (s: string) => [...s.matchAll(/\{\w+\}|<\/?\w+>/g)].map((m) => m[0]).sort();
    const wrong = Object.entries({ ...xh.ui, ...xh.server }).filter(
      ([en, x]) => JSON.stringify(marks(en)) !== JSON.stringify(marks(x)),
    );
    expect(wrong).toEqual([]);
  });

  it("have no em dashes", () => {
    const all = JSON.stringify(xh);
    expect(all.includes(String.fromCharCode(0x2014))).toBe(false);
  });
});
