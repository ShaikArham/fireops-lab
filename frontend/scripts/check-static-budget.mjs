import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const outputDirectory = join(process.cwd(), "out");
const entryHtml = join(outputDirectory, "index.html");

if (!statSync(entryHtml, { throwIfNoEntry: false })?.isFile()) {
  throw new Error("Static export is missing out/index.html. Run npm run build first.");
}

function filesUnder(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

function measure(files) {
  const contents = files.map((file) => readFileSync(file));
  return {
    raw: contents.reduce((total, content) => total + content.byteLength, 0),
    gzip: contents.reduce((total, content) => total + gzipSync(content).byteLength, 0),
  };
}

const html = measure([entryHtml]);
const assets = filesUnder(join(outputDirectory, "_next", "static"));
const javascript = measure(assets.filter((file) => file.endsWith(".js")));
const css = measure(assets.filter((file) => file.endsWith(".css")));
const budgets = [
  // The static landing page includes the guided workspace fallback; keep a strict 64 KB raw cap.
  ["entry HTML", html, 64_000],
  ["JavaScript assets", javascript, 800_000],
  ["CSS assets", css, 40_000],
];

for (const [name, size, limit] of budgets) {
  console.log(
    `${name}: ${(size.raw / 1024).toFixed(1)} KB raw, ${(size.gzip / 1024).toFixed(1)} KB gzipped per file (budget ${(limit / 1024).toFixed(0)} KB raw)`,
  );
  if (size.raw > limit) {
    throw new Error(`${name} exceeded the ${limit} byte static asset budget.`);
  }
}

console.log("Static export asset budgets passed.");
