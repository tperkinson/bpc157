const state = {
  selectedTag: "all",
  data: null
};

const els = {
  projectTitle: document.querySelector("#project-title"),
  projectSubtitle: document.querySelector("#project-subtitle"),
  repoLink: document.querySelector("#repo-link"),
  keyFindings: document.querySelector("#key-findings"),
  stats: document.querySelector("#stats"),
  researchQuestion: document.querySelector("#research-question"),
  reviewedDate: document.querySelector("#reviewed-date"),
  evidenceContext: document.querySelector("#evidence-context"),
  libraryGuide: document.querySelector("#library-guide"),
  reportList: document.querySelector("#report-list"),
  filters: document.querySelector("#filters"),
  sourceList: document.querySelector("#source-list")
};

const badge = (text) => `<span class="badge">${text}</span>`;

const sortReports = (reports) => reports.slice().sort((a, b) => {
  const aPriority = a.priority === undefined || a.priority === null ? 999 : a.priority;
  const bPriority = b.priority === undefined || b.priority === null ? 999 : b.priority;
  const priorityDiff = aPriority - bPriority;
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const dateDiff = b.date.localeCompare(a.date);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  return a.title.localeCompare(b.title);
});

const renderFindings = (findings) => {
  els.keyFindings.innerHTML = findings
    .map((finding) => `<article class="finding-card"><p>${finding}</p></article>`)
    .join("");
};

const renderStats = (stats, publicReportCount) => {
  let humanCount = 0;

  for (const key in stats.evidenceCounts) {
    if (key.indexOf("human") === 0) {
      humanCount += stats.evidenceCounts[key];
    }
  }

  const cards = [
    ["Sources", stats.sourceCount],
    ["Public reports", publicReportCount],
    ["Human-focused items", humanCount],
    ["Preclinical items", stats.evidenceCounts.preclinical || 0]
  ];

  els.stats.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <span class="stat-value">${value}</span>
          <span class="stat-label">${label}</span>
        </article>
      `
    )
    .join("");
};

const countHumanItems = (stats) => {
  let humanCount = 0;

  for (const key in stats.evidenceCounts) {
    if (key.indexOf("human") === 0) {
      humanCount += stats.evidenceCounts[key];
    }
  }

  return humanCount;
};

const renderEvidenceContext = (data) => {
  const humanCount = countHumanItems(data.stats);
  const preclinicalCount = data.stats.evidenceCounts.preclinical || 0;
  const officialCount = data.sources.filter((source) => source.tags.indexOf("official-guidance") !== -1).length;

  const cards = [
    {
      title: "Human evidence is sparse",
      value: humanCount,
      detail: "Published human records remain limited compared with the volume of claims made around BPC-157."
    },
    {
      title: "Most material is preclinical",
      value: preclinicalCount,
      detail: "The catalog is dominated by animal and mechanistic work, which is useful for plausibility but not proof of clinical benefit."
    },
    {
      title: "Official caution remains",
      value: officialCount,
      detail: "Regulatory and anti-doping sources are included so the library reflects the current risk and compliance picture, not only study claims."
    }
  ];

  els.evidenceContext.innerHTML = `
    <div class="insight-grid">
      ${cards.map((card) => `
        <article class="insight-card">
          <span class="insight-value">${card.value}</span>
          <h3>${card.title}</h3>
          <p>${card.detail}</p>
        </article>
      `).join("")}
    </div>
  `;
};

const renderLibraryGuide = () => {
  const steps = [
    "Start with the summary reports if you want the shortest public overview.",
    "Use the source filters to narrow the catalog by topic, such as human, history, safety, or review.",
    "Read both the main takeaway and the limitation line on each source card before drawing conclusions.",
    "Open the primary link when you need the original registry record, abstract, or official notice."
  ];

  els.libraryGuide.innerHTML = `
    <article class="stack-card">
      <h3>Read the library like evidence, not marketing</h3>
      <ul class="plain-list">
        ${steps.map((step) => `<li>${step}</li>`).join("")}
      </ul>
    </article>
    <article class="stack-card">
      <h3>What the tags mean</h3>
      <p class="body-copy">Tags group the same source catalog by topic and role, so you can separate human evidence, preclinical work, mechanistic papers, reviews, and official guidance.</p>
    </article>
  `;
};

const renderReports = (reports) => {
  els.reportList.innerHTML = reports
    .map(
      (report) => `
        <article class="report-card">
          <div class="report-meta">
            ${badge(report.audience)}
            <span>${report.date}</span>
          </div>
          <h3>${report.title}</h3>
          <p>${report.summary}</p>
          <div class="link-row">
            ${
              report.htmlPath
                ? `<a href="./${report.htmlPath.replace(/^docs\//, "")}" target="_blank" rel="noreferrer">Read HTML</a>`
                : ""
            }
            <a href="https://github.com/tperkinson/bpc157/blob/main/${report.path}" target="_blank" rel="noreferrer">View markdown</a>
          </div>
        </article>
      `
    )
    .join("");
};

const renderFilters = (sources) => {
  const tags = [];

  for (const source of sources) {
    for (const tag of source.tags) {
      if (tags.indexOf(tag) === -1) {
        tags.push(tag);
      }
    }
  }

  tags.sort();

  const filterTags = ["all", ...tags];

  els.filters.innerHTML = filterTags
    .map(
      (tag) => `
        <button class="filter ${tag === state.selectedTag ? "active" : ""}" data-tag="${tag}">
          ${tag}
        </button>
      `
    )
    .join("");

  els.filters.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTag = button.dataset.tag;
      renderFilters(state.data.sources);
      renderSources();
    });
  });
};

const renderSources = () => {
  const sources = state.data.sources.filter((source) => {
    return state.selectedTag === "all" || source.tags.indexOf(state.selectedTag) !== -1;
  });

  els.sourceList.innerHTML = sources
    .map(
      (source) => `
        <article class="source-card">
          <div class="source-topline">
            ${badge(source.evidenceTier)}
            <span>${source.year}</span>
          </div>
          <h3>${source.title}</h3>
          <p class="source-meta">${source.journal} · ${source.studyDesign}</p>
          <p>${source.keyTakeaway}</p>
          <p class="limit"><strong>Limit:</strong> ${source.limitations}</p>
          <div class="tag-row">${source.tags.map((tag) => badge(tag)).join("")}</div>
          <div class="link-row">
            <a href="${source.url}" target="_blank" rel="noreferrer">Primary link</a>
            ${
              source.notePath
                ? `<a href="https://github.com/tperkinson/bpc157/blob/main/${source.notePath}" target="_blank" rel="noreferrer">Source note</a>`
                : ""
            }
            ${
              source.fullTextUrl
                ? `<a href="${source.fullTextUrl}" target="_blank" rel="noreferrer">Full text</a>`
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");
};

const revealOnScroll = () => {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  document.documentElement.classList.add("motion-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
};

const init = async () => {
  const response = await fetch("./data/site-data.json");
  const data = await response.json();
  state.data = data;
  const publicReports = sortReports(
    data.reports.filter((report) => report.audience === "public")
  );

  els.projectTitle.textContent = data.project.title;
  els.projectSubtitle.textContent = data.project.subtitle;
  els.repoLink.href = data.project.repoUrl;
  els.researchQuestion.textContent = data.researchQuestion;
  els.reviewedDate.textContent = `Last reviewed: ${data.project.lastReviewed}`;

  renderSources();

  try {
    renderFilters(data.sources);
  } catch (error) {
    els.filters.innerHTML = "";
  }

  try {
    renderFindings(data.keyFindings);
  } catch (error) {
    els.keyFindings.innerHTML = "";
  }

  try {
    renderStats(data.stats, publicReports.length);
  } catch (error) {
    els.stats.innerHTML = "";
  }

  try {
    renderEvidenceContext(data);
  } catch (error) {
    els.evidenceContext.innerHTML = "";
  }

  try {
    renderLibraryGuide();
  } catch (error) {
    els.libraryGuide.innerHTML = "";
  }

  try {
    renderReports(publicReports);
  } catch (error) {
    els.reportList.innerHTML = "";
  }

  revealOnScroll();
};

init().catch((error) => {
  els.sourceList.innerHTML = `<p>Failed to load dashboard data: ${error.message}</p>`;
});
