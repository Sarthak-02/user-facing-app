/**
 * Translates en/translation.json → locales/<lang>/translation.json
 * using Google Translate web endpoint (gtx). Preserves {{mustache}} tokens.
 *
 * Usage: node scripts/build-locale-from-en.mjs <langCode>
 * Example: node scripts/build-locale-from-en.mjs hi
 * Example: node scripts/build-locale-from-en.mjs kn
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const enPath = path.join(root, "src/i18n/locales/en/translation.json");

const TARGET_LANG = (process.argv[2] || "hi").trim().toLowerCase();
if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(TARGET_LANG.replace("_", "-"))) {
  console.error("Usage: node scripts/build-locale-from-en.mjs <langCode>  (e.g. hi, kn)");
  process.exit(1);
}
const langFolder = TARGET_LANG.split("-")[0];
const outPath = path.join(root, "src/i18n/locales", langFolder, "translation.json");

const PRESERVE_EXACT = new Set([
  "Digi School",
  "CBSE",
  "ICSE",
  "GPA",
  "PDF",
  "DOC",
  "PPT",
  "AI",
  "TBD",
  "PASS",
  "FAIL",
  "N/A",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
  "P",
  "A",
  "H",
  "S",
]);

const TOKEN_RE = /\{\{[^}]+\}\}/g;

function protectInterpolation(s) {
  const tokens = [];
  const out = s.replace(TOKEN_RE, (m) => {
    const i = tokens.length;
    tokens.push(m);
    return `⟦${i}⟧`;
  });
  return { out, tokens };
}

function restoreInterpolation(s, tokens) {
  return s.replace(/⟦(\d+)⟧/g, (_, idx) => tokens[Number(idx)] ?? _);
}

async function translateLine(text) {
  if (!text || PRESERVE_EXACT.has(text)) return text;
  const { out, tokens } = protectInterpolation(text);
  if (!out.trim()) return text;

  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
      langFolder
    )}&dt=t&q=` + encodeURIComponent(out);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate HTTP ${res.status}`);
  const data = await res.json();
  const translated = data[0].map((chunk) => chunk[0]).join("");
  return restoreInterpolation(translated, tokens);
}

async function main() {
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const cache = new Map();
  const keys = [];
  (function walk(o) {
    if (o !== null && typeof o === "object" && !Array.isArray(o)) {
      Object.values(o).forEach(walk);
    } else if (typeof o === "string") keys.push(o);
  })(en);

  const unique = [...new Set(keys)];
  console.error(`Translating ${unique.length} unique strings → ${langFolder}…`);

  for (let i = 0; i < unique.length; i++) {
    const s = unique[i];
    if (!cache.has(s)) {
      try {
        const tr = await translateLine(s);
        cache.set(s, tr);
      } catch (e) {
        console.error(`Failed on (${i + 1}/${unique.length}):`, s.slice(0, 80), e.message);
        cache.set(s, s);
      }
      await new Promise((r) => setTimeout(r, 55));
    }
    if ((i + 1) % 50 === 0) console.error(`  …${i + 1}/${unique.length}`);
  }

  function applyCached(o) {
    if (o !== null && typeof o === "object" && !Array.isArray(o)) {
      const out = {};
      for (const [k, v] of Object.entries(o)) out[k] = applyCached(v);
      return out;
    }
    if (typeof o === "string") return cache.get(o) ?? o;
    return o;
  }

  const result = applyCached(en);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.error("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
