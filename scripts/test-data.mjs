// Loads or clears the test data in supabase/test-data/ on the local Supabase stack
// (`npx supabase start` first). See docs/testing.md.
//   node scripts/test-data.mjs          clear, then load fresh test data
//   node scripts/test-data.mjs clear    only clear it
// Runs psql inside the local database container in one transaction, so a failure changes nothing.
// `supabase db query` can't be used: it runs one statement per file.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const projectId = readFileSync("supabase/config.toml", "utf8").match(
  /^project_id\s*=\s*"(.+)"/m,
)?.[1];
if (!projectId) throw new Error("project_id not found in supabase/config.toml");

const files = ["supabase/test-data/clear.sql"];
if (process.argv[2] !== "clear") files.push("supabase/test-data/load.sql");
const sql = files.map((f) => readFileSync(f, "utf8")).join("\n");

execFileSync(
  "docker",
  [
    "exec",
    "-i",
    `supabase_db_${projectId}`,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "--single-transaction",
    "-q",
  ],
  { input: sql, stdio: ["pipe", "inherit", "inherit"] },
);
