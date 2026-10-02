// Rebuilds index.json from providers/*: each provider's built file (hashed), its meta.json, and the
// platforms its captures were recorded on. `--check` fails if index.json is not what this would write,
// which is how CI proves the index matches the files it points at.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describeProvider } from "@stefanolabs/autodev-provider-kit";

const RAW = "https://raw.githubusercontent.com/stefanolabs/autodev-providers/main";
const providers = readdirSync("providers", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const entries = providers.map((dir) => {
  const base = join("providers", dir);
  const d = describeProvider(join(base, "provider.mjs"));
  if (d.name !== dir) throw new Error(`providers/${dir}: the file names itself '${d.name}'; the folder must match`);
  const meta = JSON.parse(readFileSync(join(base, "meta.json"), "utf8"));
  const caps = join(base, "captures");
  const platforms = existsSync(caps)
    ? [...new Set(readdirSync(caps).filter((f) => f.endsWith(".meta.json")).map((f) => JSON.parse(readFileSync(join(caps, f), "utf8")).platform).filter(Boolean))].sort()
    : [];
  return {
    name: d.name, description: meta.description, author: meta.author, cli: d.binary, homepage: meta.homepage ?? null,
    apiVersion: d.apiVersion, platforms, file: { url: `${RAW}/providers/${dir}/provider.mjs`, sha256: d.sha256 },
  };
});
const text = JSON.stringify({ version: 1, providers: entries }, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync("index.json", "utf8") !== text) { console.error("index.json is stale: run npm run index"); process.exit(1); }
} else writeFileSync("index.json", text);
