import fs from "node:fs";
import path from "node:path";

const query = process.argv.slice(2).join(" ").trim().toLowerCase();

if (!query) {
  console.error("Usage: npm run search -- <term>");
  process.exit(1);
}

const libraryPath = path.join(process.cwd(), "data", "library.json");
const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));

const matches = library.sources.filter((source) => {
  const haystack = [
    source.id,
    source.title,
    source.journal,
    source.studyDesign,
    source.evidenceTier,
    source.topic,
    source.keyTakeaway,
    source.limitations,
    ...(source.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
});

if (matches.length === 0) {
  console.log(`No sources matched "${query}".`);
  process.exit(0);
}

for (const source of matches) {
  console.log(`${source.id} | ${source.year} | ${source.evidenceTier}`);
  console.log(source.title);
  console.log(`Tags: ${source.tags.join(", ")}`);
  console.log(`Takeaway: ${source.keyTakeaway}`);
  console.log(source.url);
  console.log("");
}
