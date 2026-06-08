import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, "dist");
const entries = ["index.html", "sw.js", "src", "public"];
const versionEntries = [...entries, "scripts/build-static.mjs"];
const buildVersionPlaceholder = "__HEALTHY_PRO_BUILD_VERSION__";

const runtimeConfig = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  supabaseKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
};

const buildVersion = createBuildVersion(runtimeConfig);

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const entry of entries) {
  cpSync(join(rootDir, entry), join(outputDir, entry), { recursive: true });
}

writeFileSync(
  join(outputDir, "src/runtime-config.js"),
  `export const RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig, null, 2)};\n`
);

replaceBuildVersion(outputDir, buildVersion);

console.log(`Built static app in dist/ (${buildVersion}).`);

function createBuildVersion(config) {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(config));
  for (const file of collectFiles(versionEntries)) {
    hash.update(file);
    hash.update(readFileSync(join(rootDir, file)));
  }
  return hash.digest("hex").slice(0, 12);
}

function collectFiles(paths) {
  const files = [];
  for (const entry of paths) {
    const absolutePath = join(rootDir, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      for (const child of readdirSync(absolutePath)) {
        files.push(...collectFiles([join(entry, child)]));
      }
    } else {
      files.push(entry);
    }
  }
  return files.sort();
}

function replaceBuildVersion(directory, version) {
  for (const child of readdirSync(directory)) {
    const absolutePath = join(directory, child);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      replaceBuildVersion(absolutePath, version);
      continue;
    }
    if (!isTextAsset(absolutePath)) continue;
    const source = readFileSync(absolutePath, "utf8");
    if (!source.includes(buildVersionPlaceholder)) continue;
    writeFileSync(absolutePath, source.replaceAll(buildVersionPlaceholder, version));
  }
}

function isTextAsset(file) {
  return [".html", ".js", ".css", ".webmanifest"].some((extension) => file.endsWith(extension));
}
