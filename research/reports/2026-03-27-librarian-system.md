# Librarian Workflow and Memory System

Date: 2026-03-27

## Goal

This project needs two retrieval systems at once:

- a research library for BPC-157 itself
- an agent memory so a new thread can continue the work without re-discovering context

## Research library structure

### Finding

- Search primary databases first: PubMed, ClinicalTrials.gov, FDA, USADA/WADA, patent sources.
- Add only sources that materially improve the history, evidence, or regulatory picture.
- Prefer original studies over downstream commentary.

### Storing

- Record every accepted source in `data/library.json`.
- Create a note in `research/source-notes/` when a source changes the top-level summary or requires nuance.
- Use stable links and persistent identifiers whenever possible.

### Cataloging

Each source record should answer:

- what kind of document is this
- is it human, preclinical, review, registry, or official guidance
- what is the strongest supported claim
- what is the main limitation

### Retrieval

- Terminal retrieval: `npm run search -- <term>`
- Human-readable reports: `research/reports/`
- Public browsing: GitHub Pages site under `docs/`

## Agent memory structure

### Startup documents

- `memory/START_HERE.md`: first document for a new thread
- `memory/resource-map.md`: where everything lives
- `memory/open-questions.md`: unfinished research edges
- `memory/session-handoff.md`: current state and next actions

### Memory rules

- Keep memory operational, not reflective.
- Update handoff and open questions whenever the source library materially changes.
- Avoid burying the active status inside long reports.

## Update loop for future threads

1. Read `memory/START_HERE.md`.
2. Scan `memory/session-handoff.md`.
3. Check `data/library.json` for current source inventory.
4. Read only the source notes relevant to the next question.
5. Update reports, memory, and the site in that order.

## Why this structure works

It avoids the usual failure mode where:

- public summaries drift from the source catalog
- new threads lose project context
- notes exist, but no one knows where to start

Here the catalog, the reports, the memory, and the website all point at the same evidence base.
