# BPC-157 Research Library

This repository tracks a small evidence-focused research project on BPC-157. It combines:

- a structured source library
- human-readable research reports
- agent memory for fresh threads
- a static GitHub Pages dashboard

## Project Layout

- `data/library.json`: single source of truth for sources, findings, workflows, reports, and memory summaries
- `research/reports/`: narrative reports for readers
- `research/source-notes/`: source-level notes
- `memory/`: startup brief, handoff, open questions, and resource map for a new agent thread
- `scripts/`: validation, search, and site build utilities
- `docs/`: static site files for GitHub Pages

## Commands

```bash
npm run validate
npm run build
npm run search -- human
```

`npm run build` validates `data/library.json` and writes `docs/data/site-data.json`, which powers the public site.

## GitHub Pages

This repo is set up for GitHub Pages deployment through [`.github/workflows/deploy-pages.yml`](/Users/terryperkinson/codex/bpc157/.github/workflows/deploy-pages.yml). Once the repository is public and GitHub Pages is enabled, the expected URL is:

`https://tperkinson.github.io/bpc157/`

## Research Scope

The current pass is intentionally narrow:

- origin/history of BPC-157 as a gastric pentadecapeptide
- actual published studies and registered trial records
- distinction between preclinical data and human evidence
- official regulatory/sports-governance context relevant to public claims

This is not medical advice and it is not a treatment recommendation.
