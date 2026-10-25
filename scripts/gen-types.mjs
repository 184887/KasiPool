// Regenerates src/integrations/supabase/types.ts from the local Supabase database
// (`npx supabase start` first), then marks the RPC arguments that accept null:
// Postgres function signatures don't say which arguments may be null, so the generator
// types them all as required values.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { format, resolveConfig } from "prettier";

const TARGET = "src/integrations/supabase/types.ts";

/** RPC name -> arguments the function accepts as null */
const NULLABLE_ARGS = {
  admin_create_po: ["_expected"],
  propose_pool: ["_max_qty", "_min_per", "_max_per", "_note"],
};

const prettier = { ...(await resolveConfig(TARGET)), filepath: TARGET };
const raw = execSync("npx -y supabase gen types typescript --local", { encoding: "utf8" });
// The generator output is unformatted; format first so the layout below is predictable
let out = await format(raw, prettier);

const functions = out.indexOf("Functions: {");
for (const [fn, args] of Object.entries(NULLABLE_ARGS)) {
  const at = out.indexOf(` ${fn}: {`, functions);
  const argsStart = out.indexOf("Args: {", at);
  if (at === -1 || argsStart === -1) throw new Error(`RPC ${fn} not found in generated types`);
  // Find the closing brace of the Args object
  let i = argsStart + "Args: ".length;
  let depth = 0;
  do {
    if (out[i] === "{") depth++;
    if (out[i] === "}") depth--;
    i++;
  } while (depth > 0);
  let block = out.slice(argsStart, i);
  for (const arg of args) {
    const re = new RegExp(`(\\b${arg}\\??: )([^;\\n}]+?)(\\s*[;\\n}])`);
    if (!re.test(block)) throw new Error(`Argument ${fn}.${arg} not found`);
    block = block.replace(re, (m, head, type, tail) =>
      type.includes("null") ? m : `${head}${type} | null${tail}`,
    );
  }
  out = out.slice(0, argsStart) + block + out.slice(i);
}

out = await format(out, prettier);
writeFileSync(TARGET, out);
console.log(`Wrote ${TARGET}`);
