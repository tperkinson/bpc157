import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libraryPath = path.join(root, "data", "library.json");
const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));

const countHumanItems = (sources) =>
  sources
    .filter((source) => source.evidenceTier.startsWith("human"))
    .length;

const reportTheme = (reportId) => {
  const themes = {
    "history-evidence": {
      glow: "rgba(215, 129, 69, 0.28)",
      glowTwo: "rgba(120, 89, 55, 0.18)",
      background: "linear-gradient(180deg, #f4eadf 0%, #f8f3ee 44%, #eadcc9 100%)",
      tint: "rgba(255, 248, 240, 0.84)",
      accent: "#864a2a",
      chip: "rgba(234, 188, 150, 0.28)"
    },
    "historical-source-summary": {
      glow: "rgba(214, 186, 117, 0.28)",
      glowTwo: "rgba(106, 88, 45, 0.18)",
      background: "linear-gradient(180deg, #eee5d5 0%, #f7f3ec 46%, #ece1cf 100%)",
      tint: "rgba(255, 252, 247, 0.84)",
      accent: "#7d4a24",
      chip: "rgba(214, 186, 117, 0.28)"
    },
    "chronological-source-report": {
      glow: "rgba(104, 152, 118, 0.22)",
      glowTwo: "rgba(55, 86, 71, 0.18)",
      background: "linear-gradient(180deg, #e4eee8 0%, #f4f7f5 44%, #dde9e0 100%)",
      tint: "rgba(247, 252, 248, 0.86)",
      accent: "#2e5a49",
      chip: "rgba(133, 176, 151, 0.25)"
    },
    "librarian-system": {
      glow: "rgba(121, 143, 176, 0.22)",
      glowTwo: "rgba(52, 63, 87, 0.16)",
      background: "linear-gradient(180deg, #e7edf6 0%, #f5f8fb 44%, #dde6f1 100%)",
      tint: "rgba(249, 251, 255, 0.86)",
      accent: "#38506f",
      chip: "rgba(157, 183, 214, 0.26)"
    }
  };

  return themes[reportId] ?? themes["historical-source-summary"];
};

const reportHighlights = (report) => {
  const sourceCount = library.sources.length;
  const humanCount = countHumanItems(library.sources);
  const preclinicalCount = library.sources.filter((source) => source.evidenceTier === "preclinical").length;
  const oldestYear = Math.min(...library.sources.map((source) => source.year));
  const newestYear = Math.max(...library.sources.map((source) => source.year));

  if (report.id === "librarian-system") {
    return [
      ["Workflow", "4 phases", "Finding, storing, cataloging, and retrieval are kept as distinct tasks."],
      ["Memory", "4 startup docs", "New threads bootstrap from START_HERE, the session handoff, the resource map, and open questions."],
      ["Publishing", `${library.reports.length} HTML reports`, "Every report now has a linked public HTML counterpart in docs/reports/."]
    ];
  }

  if (report.id === "chronological-source-report") {
    return [
      ["Coverage", `${sourceCount} sources`, "The report walks every accepted source in year order."],
      ["Timespan", `${oldestYear} to ${newestYear}`, "The library currently runs from early foundational papers to recent reviews."],
      ["Human record", `${humanCount} items`, "The chronology makes the thin human layer visible against a much larger preclinical stack."]
    ];
  }

  if (report.id === "history-evidence") {
    return [
      ["Library size", `${sourceCount} sources`, "The catalog has expanded materially, but mostly on the preclinical side."],
      ["Human evidence", `${humanCount} items`, "The accessible human record remains one registry entry and two small papers."],
      ["Preclinical weight", `${preclinicalCount} studies`, "Animal and mechanistic work still dominate the evidence base."]
    ];
  }

  return [
    ["Library size", `${sourceCount} sources`, "Most of the repository is still preclinical or review material."],
    ["Human evidence", `${humanCount} items`, "The accessible human record remains sparse."],
    ["Timespan", `${oldestYear} to ${newestYear}`, "The source inventory spans the full documented arc of the literature in this repo."]
  ];
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");

const escapeAttribute = (value) => escapeHtml(value);

const formatInline = (text) => {
  let formatted = escapeHtml(text);

  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, url) =>
      `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
  );
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

  return formatted;
};

const renderMarkdown = (content) => {
  const lines = content.split(/\r?\n/);

  if (lines[0]?.startsWith("# ")) {
    lines.shift();
  }

  while (lines[0]?.trim() === "") {
    lines.shift();
  }

  if (lines[0]?.startsWith("Date:")) {
    lines.shift();
  }

  while (lines[0]?.trim() === "") {
    lines.shift();
  }

  const html = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    html.push(`<p>${formatInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      return;
    }

    html.push(
      `<${listType}>${listItems
        .map((item) => `<li>${formatInline(item)}</li>`)
        .join("")}</${listType}>`
    );
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1].length, 4);
      html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    const bulletMatch = line.match(/^- (.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(bulletMatch[1]);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return html.join("\n");
};

const reportShell = (report, bodyHtml) => {
  const theme = reportTheme(report.id);
  const highlights = reportHighlights(report);
  const audienceLabel = report.audience === "public" ? "Public report" : "Project report";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(report.title)}</title>
    <meta name="description" content="${escapeAttribute(report.summary)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../styles.css" />
    <style>
      :root {
        --report-accent: ${theme.accent};
        --report-chip: ${theme.chip};
        --report-tint: ${theme.tint};
      }

      body {
        background:
          radial-gradient(circle at top left, ${theme.glow}, transparent 28%),
          radial-gradient(circle at bottom right, ${theme.glowTwo}, transparent 24%),
          ${theme.background};
      }

      .report-shell {
        position: relative;
        z-index: 1;
        width: min(980px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 2rem 0 4rem;
      }

      .report-hero,
      .report-body {
        background: var(--report-tint);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(24, 33, 31, 0.12);
        border-radius: 28px;
        box-shadow: 0 24px 60px rgba(28, 36, 33, 0.12);
      }

      .report-hero {
        padding: 1.8rem;
        margin-bottom: 1rem;
      }

      .report-body {
        padding: 1.6rem;
      }

      .report-meta,
      .report-links {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .report-meta {
        margin-bottom: 1rem;
      }

      .report-kicker {
        margin: 0 0 0.5rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.82rem;
      }

      .report-title {
        margin: 0;
        font-size: clamp(2.3rem, 5vw, 4.4rem);
        max-width: 16ch;
      }

      .report-subtitle {
        margin: 1rem 0 0;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.72;
        max-width: 66ch;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: var(--report-chip);
        border: 1px solid rgba(24, 33, 31, 0.12);
        font-size: 0.84rem;
      }

      .report-links {
        margin-top: 1.2rem;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
        margin: 1.4rem 0 1.6rem;
      }

      .summary-card {
        padding: 1rem;
        border: 1px solid rgba(24, 33, 31, 0.12);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.62);
      }

      .summary-card h3,
      .summary-card h4 {
        margin-bottom: 0.35rem;
      }

      .summary-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }

      .summary-value {
        display: inline-block;
        margin-bottom: 0.5rem;
        color: var(--report-accent);
        font-size: 1.45rem;
        font-weight: 700;
      }

      .report-body h2 {
        margin-top: 2rem;
        margin-bottom: 0.75rem;
      }

      .report-body h3,
      .report-body h4 {
        margin-top: 1.4rem;
        margin-bottom: 0.45rem;
      }

      .report-body p,
      .report-body li {
        color: var(--muted);
        line-height: 1.74;
      }

      .report-body ul,
      .report-body ol {
        padding-left: 1.2rem;
      }

      .report-body code {
        padding: 0.08rem 0.38rem;
        border-radius: 999px;
        background: rgba(24, 33, 31, 0.08);
        font-size: 0.92em;
      }

      .report-body a,
      .report-links a {
        color: var(--report-accent);
      }

      @media (max-width: 560px) {
        .report-shell {
          width: min(100% - 1rem, 980px);
          padding-top: 1rem;
        }

        .report-hero,
        .report-body {
          padding: 1rem;
        }

        .report-title {
          max-width: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="backdrop backdrop-one"></div>
    <div class="backdrop backdrop-two"></div>
    <main class="report-shell">
      <section class="report-hero">
        <div class="report-meta">
          <span class="pill">${audienceLabel}</span>
          <span class="pill">Updated ${escapeHtml(report.date)}</span>
        </div>
        <p class="report-kicker">BPC-157 evidence library</p>
        <h1 class="report-title">${escapeHtml(report.title)}</h1>
        <p class="report-subtitle">${escapeHtml(report.summary)}</p>
        <div class="report-links">
          <a href="../index.html#reports">Back to dashboard</a>
          <a href="https://github.com/tperkinson/bpc157/blob/main/${report.path}" target="_blank" rel="noreferrer">View markdown source</a>
          <a href="https://github.com/tperkinson/bpc157" target="_blank" rel="noreferrer">Open repository</a>
        </div>
      </section>

      <article class="report-body">
        <div class="summary-grid">
          ${highlights
            .map(
              ([title, value, detail]) => `
          <section class="summary-card">
            <span class="summary-value">${escapeHtml(value)}</span>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(detail)}</p>
          </section>`
            )
            .join("")}
        </div>
        ${bodyHtml}
      </article>
    </main>
  </body>
</html>
`;
};

for (const report of library.reports) {
  const markdownPath = path.join(root, report.path);
  const htmlPath = path.join(root, report.htmlPath);
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const html = reportShell(report, renderMarkdown(markdown));

  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html);
  console.log(`Wrote ${path.relative(root, htmlPath)}`);
}
