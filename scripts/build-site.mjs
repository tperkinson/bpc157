import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const validate = spawnSync("node", ["scripts/validate-library.mjs"], {
  cwd: root,
  stdio: "inherit"
});

if (validate.status !== 0) {
  process.exit(validate.status ?? 1);
}

const libraryPath = path.join(root, "data", "library.json");
const outputDir = path.join(root, "docs", "data");
const outputPath = path.join(outputDir, "site-data.json");

const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));
const publicReports = library.reports.filter((report) => report.audience === "public");
const {
  librarianWorkflow: _librarianWorkflow,
  agentMemory: _agentMemory,
  reports: _reports,
  ...publicLibrary
} = library;

const evidenceCounts = library.sources.reduce((acc, source) => {
  acc[source.evidenceTier] = (acc[source.evidenceTier] || 0) + 1;
  return acc;
}, {});

const topicCounts = library.sources.reduce((acc, source) => {
  acc[source.topic] = (acc[source.topic] || 0) + 1;
  return acc;
}, {});

const payload = {
  ...publicLibrary,
  reports: publicReports,
  generatedAt: new Date().toISOString(),
  stats: {
    sourceCount: library.sources.length,
    reportCount: publicReports.length,
    evidenceCounts,
    topicCounts
  }
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n");

console.log(`Wrote ${path.relative(root, outputPath)}`);
