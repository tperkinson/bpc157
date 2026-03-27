import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libraryPath = path.join(root, "data", "library.json");
const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));

const referenceSeeds = library.sources.filter((source) =>
  ["review", "systematic-review"].includes(source.evidenceTier) &&
  /pmc\.ncbi\.nlm\.nih\.gov/.test(source.fullTextUrl || "")
);

const normalizeWhitespace = (value) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const extractPmcId = (url) => {
  const match = url.match(/PMC\d+/);
  return match ? match[0] : null;
};

const extractReferences = (xml, sourceId) => {
  const refBlocks = xml.match(/<ref id="[^"]+">[\s\S]*?<\/ref>/g) || [];

  return refBlocks
    .map((block) => {
      const titleMatch = block.match(/<article-title>([\s\S]*?)<\/article-title>/);
      const pmidMatch = block.match(/<pub-id pub-id-type="pmid">(\d+)<\/pub-id>/);
      const title = titleMatch ? normalizeWhitespace(titleMatch[1]) : "";

      return {
        title,
        pmid: pmidMatch ? pmidMatch[1] : "",
        discoveredVia: sourceId
      };
    })
    .filter((reference) => /(^|[\s-])BPC[\s-]?157|gastric pentadecapeptide/i.test(reference.title));
};

const discovered = [];

for (const seed of referenceSeeds) {
  const pmcId = extractPmcId(seed.fullTextUrl);

  if (!pmcId) {
    continue;
  }

  const response = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcId}&retmode=xml`
  );

  const xml = await response.text();
  discovered.push(...extractReferences(xml, seed.id));
}

const existingPmids = new Set(
  library.sources
    .map((source) => source.pmid)
    .filter(Boolean)
);

const deduped = Object.values(
  discovered.reduce((acc, reference) => {
    const key = reference.pmid || reference.title.toLowerCase();

    if (!acc[key]) {
      acc[key] = { ...reference, discoveredVia: [reference.discoveredVia] };
    } else if (!acc[key].discoveredVia.includes(reference.discoveredVia)) {
      acc[key].discoveredVia.push(reference.discoveredVia);
    }

    return acc;
  }, {})
)
  .filter((reference) => !existingPmids.has(reference.pmid))
  .sort((a, b) => a.title.localeCompare(b.title));

console.log(JSON.stringify(deduped, null, 2));
