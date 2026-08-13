import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, "dist-cloudbase", "apps", "healthy");
const buildVersionPlaceholder = "__HEALTHY_PRO_BUILD_VERSION__";
const entries = [
  ["index.html", "index.html"],
  ["sw.js", "sw.js"],
  ["src/web", "src/web"],
  ["public/icon.svg", "public/icon.svg"],
  ["public/manifest.webmanifest", "public/manifest.webmanifest"],
  ["public/assets/equipment", "public/assets/equipment"],
  ["public/assets/web", "public/assets/web"]
];

const buildVersion = createBuildVersion();

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const [source, destination] of entries) {
  cpSync(join(rootDir, source), join(outputDir, destination), { recursive: true });
}

replaceBuildVersion(outputDir, buildVersion);
writeFileSync(
  join(outputDir, "build-meta.json"),
  `${JSON.stringify({ app: "healthy", basePath: "/apps/healthy/", buildVersion }, null, 2)}\n`
);

console.log(`Built Healthy Web companion at dist-cloudbase/apps/healthy (${buildVersion}).`);

function createBuildVersion() {
  const hash = createHash("sha256");
  for (const [source] of entries) {
    for (const file of collectFiles(source)) {
      hash.update(file);
      hash.update(readFileSync(join(rootDir, file)));
    }
  }
  hash.update(readFileSync(fileURLToPath(import.meta.url)));
  return hash.digest("hex").slice(0, 12);
}

function collectFiles(entry) {
  const absolutePath = join(rootDir, entry);
  const stat = statSync(absolutePath);
  if (!stat.isDirectory()) return [entry];
  return readdirSync(absolutePath)
    .flatMap((child) => collectFiles(join(entry, child)))
    .sort();
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
