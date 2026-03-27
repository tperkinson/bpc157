import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libraryPath = path.join(root, "data", "library.json");
const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));

const errors = [];

const requiredSourceFields = [
  "id",
  "title",
  "year",
  "studyType",
  "studyDesign",
  "evidenceTier",
  "keyTakeaway",
  "limitations",
  "url",
  "tags"
];

const requiredReportFields = [
  "id",
  "title",
  "date",
  "summary",
  "path",
  "htmlPath",
  "audience"
];

const ensureUnique = (items, label) => {
  const seen = new Set();

  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`${label} duplicate id: ${item.id}`);
    }
    seen.add(item.id);
  }
};

ensureUnique(library.sources, "source");
ensureUnique(library.reports, "report");

for (const source of library.sources) {
  for (const field of requiredSourceFields) {
    if (
      source[field] === undefined ||
      source[field] === null ||
      source[field] === ""
    ) {
      errors.push(`source ${source.id} missing ${field}`);
    }
  }

  if (!Array.isArray(source.tags) || source.tags.length === 0) {
    errors.push(`source ${source.id} must have at least one tag`);
  }
}

for (const report of library.reports) {
  for (const field of requiredReportFields) {
    if (
      report[field] === undefined ||
      report[field] === null ||
      report[field] === ""
    ) {
      errors.push(`report ${report.id} missing ${field}`);
    }
  }

  const reportPath = path.join(root, report.path);
  if (!fs.existsSync(reportPath)) {
    errors.push(`report ${report.id} path does not exist: ${report.path}`);
  }
}

if (!Array.isArray(library.keyFindings) || library.keyFindings.length === 0) {
  errors.push("project must include keyFindings");
}

if (errors.length > 0) {
  console.error("Library validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const tierCounts = library.sources.reduce((acc, source) => {
  acc[source.evidenceTier] = (acc[source.evidenceTier] || 0) + 1;
  return acc;
}, {});

console.log("Library validation passed.");
console.log(`Sources: ${library.sources.length}`);
console.log(`Reports: ${library.reports.length}`);
console.log("Evidence tiers:");
for (const [tier, count] of Object.entries(tierCounts).sort()) {
  console.log(`- ${tier}: ${count}`);
}
