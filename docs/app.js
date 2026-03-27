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
  workflow: document.querySelector("#workflow"),
  agentMemory: document.querySelector("#agent-memory"),
  reportList: document.querySelector("#report-list"),
  filters: document.querySelector("#filters"),
  sourceList: document.querySelector("#source-list")
};

const badge = (text) => `<span class="badge">${text}</span>`;

const renderFindings = (findings) => {
  els.keyFindings.innerHTML = findings
    .map((finding) => `<article class="finding-card"><p>${finding}</p></article>`)
    .join("");
};

const renderStats = (stats) => {
  const cards = [
    ["Sources", stats.sourceCount],
    ["Reports", stats.reportCount],
    ["Human-focused items", Object.entries(stats.evidenceCounts)
      .filter(([key]) => key.startsWith("human"))
      .reduce((sum, [, count]) => sum + count, 0)],
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

const renderWorkflow = (workflow) => {
  els.workflow.innerHTML = workflow
    .map(
      (item) => `
        <article class="stack-card">
          <h3>${item.phase}</h3>
          <p>${item.goal}</p>
          <ul class="plain-list">
            ${item.steps.map((step) => `<li>${step}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
};

const renderAgentMemory = (agentMemory) => {
  els.agentMemory.innerHTML = `
    <article class="stack-card">
      <h3>Mission</h3>
      <p>${agentMemory.mission}</p>
    </article>
    <article class="stack-card">
      <h3>Startup checklist</h3>
      <ul class="plain-list">
        ${agentMemory.startupChecklist.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </article>
    <article class="stack-card">
      <h3>Core resources</h3>
      <ul class="plain-list">
        ${agentMemory.resources.map((item) => `<li><code>${item}</code></li>`).join("")}
      </ul>
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
          <a href="https://github.com/tperkinson/bpc157/blob/main/${report.path}" target="_blank" rel="noreferrer">Open report</a>
        </article>
      `
    )
    .join("");
};

const renderFilters = (sources) => {
  const tags = Array.from(
    new Set(sources.flatMap((source) => source.tags))
  ).sort();

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
    return state.selectedTag === "all" || source.tags.includes(state.selectedTag);
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

  els.projectTitle.textContent = data.project.title;
  els.projectSubtitle.textContent = data.project.subtitle;
  els.repoLink.href = data.project.repoUrl;
  els.researchQuestion.textContent = data.researchQuestion;
  els.reviewedDate.textContent = `Last reviewed: ${data.project.lastReviewed}`;

  renderFindings(data.keyFindings);
  renderStats(data.stats);
  renderWorkflow(data.librarianWorkflow);
  renderAgentMemory(data.agentMemory);
  renderReports(data.reports);
  renderFilters(data.sources);
  renderSources();
  revealOnScroll();
};

init().catch((error) => {
  els.sourceList.innerHTML = `<p>Failed to load dashboard data: ${error.message}</p>`;
});
