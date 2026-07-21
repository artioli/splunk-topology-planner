# Splunk On-Prem Topology Planner

A static, browser-based web app for planning and lab-deploying **on-premises Splunk Enterprise**, with no backend. It pairs a sizing wizard with a step-by-step **Linux deployment guide** and a **Certification & Accreditation Matrix** for partner enablement planning.

Created by **artioli** with the help of **Cursor AI**.

## What's included

### Topology Planner (`#planner`)

Interactive wizard that persists inputs in `localStorage` and recalculates results as you type.

- **Workload** — daily ingest (GB/day) or EPS-based calculation with utilization %
- **Retention** — hot/warm, cold, and frozen tiers with a stacked timeline view
- **Premium apps** — Enterprise Security and ITSI overlays (separate search tiers)
- **Topology preferences** — single server (S1), auto/manual indexer count, cluster replication, RF/SF, operational and per-premium-app search head clusters, virtualization overhead
- **Management node** — License Manager, Monitoring Console, Deployment Server, Cluster Manager, SHC Deployer colocation rules
- **Results** — SVA code, server inventory, Splunk 10.4 reference hardware, disk-type guidance, storage math, network ports, Markdown export

The interface is available in **English, Portuguese, and Spanish**.

### Linux Deployment Guide (`#guide`)

Filtered, copy-paste command guide for RHEL-family Linux (with Ubuntu callouts), based on Architect lab workflows and current Splunk documentation.

| Profile | Topology |
|---------|----------|
| Single server | 1× combined (indexer + search + LM + MC + DS) |
| Distributed non-cluster | 1× indexer, 1× search head, 1× management |
| Distributed + indexer cluster | 3× indexers, 1× CM, 1× SH, 1× management |
| Distributed + IC + SHC | 3× indexers, 1× CM, 3× SH, deployer, DS, management |

- Editable hostnames/IPs and `splunkuser` as the default OS account
- Per-step Splunk doc links, target-server badges, progress checkboxes
- Optional Universal Forwarder appendix
- Copy the full guide as Markdown

### Enablement Matrix (`#enablement`)

Partner-focused certification and accreditation planner with time, cost, and prerequisite path maps.

- **Catalog tabs** — accreditations (default), certifications, technical badges/assessments, and full course pricing catalog
- **Filters** — track (General / Observability / Security / Core), persona, partner-only, cost/time range, search, hide completed
- **Path map** — layered prerequisite ladder with badge images, Mindtickle deeplinks, and Splunk/Credly references
- **OR prerequisites** — branch selector for alternative paths (e.g. SOAR Consultant I)
- **Team plan** — multi-select credentials with deduped total time/cost rollup
- **Progress tracking** — mark credentials complete in `localStorage`; remaining totals update
- **Export** — copy path or full matrix as Markdown/CSV
- **Matrix table** — sortable Excel replacement view

Data sources (see `src/enablement/data/manifest.json`):

- [Splunk Education pricing](https://www.splunk.com/en_us/training/pricing.html)
- [Splunk certifications](https://www.splunk.com/en_us/training/certification.html)
- [Student handbook (PDF)](https://www.splunk.com/en_us/pdfs/training/splunk-education-student-handbook.pdf)
- Partner accreditation metadata (Mindtickle) and [Splunk Credly badges](https://www.credly.com/organizations/splunk/badges)

**Refreshing enablement data:** edit JSON under `src/enablement/data/`, update `manifest.json` `lastUpdated`, run `node scripts/seed-credly-badges.mjs` if credentials were added, then `npm test && npm run build`.

## How to use

Plan your deployment in `#planner` (enter ingest, retention, and topology preferences; review the SVA code, storage, and hardware), then open `#guide` and pick the profile that matches your SVA to get the ordered install commands. Use `#enablement` to map certification and partner accreditation paths with time and cost estimates for enablement planning.

## Where the information comes from

Official Splunk docs used as the basis for recommendations:

- [Splunk Validated Architectures](https://help.splunk.com/en/data-management/splunk-validated-architectures)
- [Splunk Enterprise 10.4 — Reference hardware](https://help.splunk.com/en/splunk-enterprise/get-started/deployment-capacity-manual/10.4/performance-reference/reference-hardware)
- [Splunk Enterprise 10.4 — Performance recommendations](https://help.splunk.com/en/splunk-enterprise/get-started/deployment-capacity-manual/10.4/performance-reference/summary-of-performance-recommendations)
- [Splunk Enterprise 10.4 — Network components](https://help.splunk.com/en/splunk-enterprise/administer/inherit-a-splunk-deployment/10.4/inherited-deployment-tasks/components-and-their-relationship-with-the-network)
- [Enterprise Security 8.5 — Production minimums](https://help.splunk.com/en/splunk-enterprise-security-8/install/8.5/planning/minimum-specifications-for-a-production-deployment)
- [ITSI 4.21 — Plan your deployment](https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/4.21/planning/plan-your-itsi-deployment)

## Structure and stack

```
src/
  planner/   # Topology sizing wizard
  guide/     # Linux deployment guide (steps, profiles, UI)
  lib/       # Sizing engines (topology, storage, network, hardware)
  ui/        # Results and retention visualization
  i18n/      # English / Portuguese / Spanish locales
```

Stack: **Vite + TypeScript + Vitest** — vanilla TS, deployed as a static site.

## Changelog / What's been built

<!-- Add the newest entry at the top of this section on each update. Keep it in place; do not create separate files. -->

This section is updated in place with each change.

### Planner improvements
- Virtualization overhead % field (default 15) that scales indexer compute, surfaced with a `VIRT` spec-source badge.
- Role-based disk-type guidance in the hardware table.
- Auto/manual clustering rework: auto mode clusters at ≥ 2 indexers with automatic RF/SF defaults (2 indexers → RF2/SF2, 3+ → RF3/SF2); a manual **Cluster Replication** toggle gates RF/SF inputs; RF/SF are hidden in auto mode.
- Per-premium-app Search Head Cluster controls for Enterprise Security and ITSI (with member counts).
- Search-head quantity hidden in auto mode (still computed behind the scenes).
- Results view preserves scroll position and expanded sections across recomputes.
- Guidance disclaimer footnote in the planner footer.

### Topology panel reorder
- Reordered the Topology preferences controls: S1 → auto config → max volume / indexer count → Cluster Replication → RF/SF → operational SHC + SH quantity → ES SHC + quantity → ITSI SHC + quantity.
- Moved the premium-app SHC toggles into the Topology panel and restyled them to match the operational SHC block.
- Corrected the "Max volume per indexer" label.

### Internationalization
- Full UI translation across English, Portuguese, and Spanish (generated locale files).

### Baseline
- Topology sizing engine, storage/network/hardware models, and SVA code derivation.
- Linux deployment guide with selectable profiles, per-step doc links, and progress tracking.
- `localStorage` input persistence, theme toggle, Vitest test suite, and GitHub Pages deployment.

## Disclaimers

**Planning estimates only.** Outputs are derived from public Splunk documentation and simplified formulas. They do not replace a formal sizing exercise, license quote, or architecture review.

**Lab and training focus.** The deployment guide is written for lab environments (e.g. Architect exam prep). Commands use placeholders for passwords and secrets — never commit real credentials. Some shortcuts (such as disabling the firewall) are marked as lab-only; production deployments should follow Splunk hardening guidance.

**Not affiliated with Splunk.** This is an independent community tool. Splunk, Splunk Enterprise, SVA, Enterprise Security, and ITSI are trademarks of Splunk LLC.

**Validate before production.** Confirm sizing, licensing, topology, and security with [Splunk Sales](https://www.splunk.com/en_us/about-splunk/contact-us.html) or Splunk Professional Services before any production rollout.

**No warranty.** This software is provided as-is, without warranty of any kind. Use at your own risk.

## License

See repository license file if present; otherwise treat as internal/educational use unless a license is added.
