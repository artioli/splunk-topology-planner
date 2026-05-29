# Splunk On-Prem Topology Planner

A static, mobile-friendly web app for planning and lab-deploying **on-premises Splunk Enterprise**. It combines a sizing wizard with a step-by-step **Linux deployment guide**, both running in the browser with no backend.

Use it to translate workload inputs into **Splunk Validated Architecture (SVA)** recommendations, storage estimates, hardware baselines, firewall ports, and ordered install commands for common lab topologies.

## What’s included

### Topology Planner (`#planner`)

Interactive wizard that persists inputs in `localStorage` and recalculates results as you type.

- **Workload** — daily ingest (GB/day) or EPS-based calculation with utilization %
- **Retention** — hot/warm, cold, and frozen tiers with stacked timeline view
- **Premium apps** — Enterprise Security and ITSI overlays (separate search tiers)
- **Topology preferences** — single server (S1), auto indexer count, SHC, RF/SF
- **Management node** — License Manager, Monitoring Console, Deployment Server, Cluster Manager, SHC Deployer colocation rules
- **Results** — SVA code, server inventory, Splunk 10.4 reference hardware, storage math, network ports, Markdown export

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
- Copy full guide as Markdown

## Quick start

### Run locally

```bash
git clone <your-repo-url>
cd splunk-topology-planner
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

| Page | URL |
|------|-----|
| Topology planner | `http://localhost:5173/#planner` |
| Deployment guide | `http://localhost:5173/#guide` |

### Typical workflow

1. **Plan** — open `#planner`, enter ingest, retention, and topology preferences; review SVA code, storage, and hardware.
2. **Match profile** — in `#guide`, pick the profile that matches your SVA (e.g. S1 → Single, C3 → IC + SHC).
3. **Customize hosts** — update IPs/hostnames in the guide form; commands update automatically.
4. **Deploy** — follow steps in order on each Linux host; use copy buttons for commands.
5. **Validate** — run health checks and CLI verification steps at the end of the guide.

### Build and test

```bash
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
npm test         # Vitest unit tests
```

## Publish to GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or `master`). The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds and deploys `dist/`.
4. Site URL: `https://<user>.github.io/<repo-name>/`

To match the Pages base path when building locally:

```powershell
# PowerShell
$env:GITHUB_REPOSITORY = "your-user/splunk-topology-planner"
npm run build
```

## Project structure

```
src/
  app.ts              # Hash router (#planner / #guide)
  planner/            # Topology sizing wizard
  guide/              # Linux deployment guide (steps, profiles, UI)
  lib/                # Sizing engines (topology, storage, network, hardware)
  ui/                 # Results and retention visualization
```

Stack: **Vite**, **TypeScript**, **Vitest**. No framework — vanilla TS for a small, deployable static site.

## UX and supported viewports

The UI is optimized for phones, tablets, and desktops without a separate mobile app.

| Viewport | Behavior |
|----------|----------|
| **&lt; 640px** (phone) | Single-column forms; bottom tab nav (Planner / Guide); command blocks stack vertically (Copy below command); horizontal scroll for wide tables; wizard panels 4–6 start collapsed |
| **640px – 1023px** (tablet) | Two-column form grids where appropriate; top nav with theme toggle |
| **≥ 1024px** (desktop) | Planner: wizard left, live results right (sticky); guide: config left, steps right; sticky summary bar on planner |

**Theme:** Use the **Auto / Light / Dark** button in the top nav. Preference is stored in `localStorage`.

**Planner mobile:** After your first input change, a **Jump to results** button appears. A sticky **Copy summary** bar sits above the bottom nav.

**Guide:** Progress bar shows completed steps; **Jump to step** dropdown scrolls to a step; completed steps are hidden by default (toggle **Show completed steps**).

Manual checks before release: iPhone-width (~390px), iPad (~768px), desktop (1280px) — nav, tables, command copy, planner side-by-side layout, guide progress.


Official Splunk docs used as the basis for recommendations:

- [Splunk Validated Architectures](https://help.splunk.com/en/data-management/splunk-validated-architectures)
- [Splunk Enterprise 10.4 — Reference hardware](https://help.splunk.com/en/splunk-enterprise/get-started/deployment-capacity-manual/10.4/performance-reference/reference-hardware)
- [Splunk Enterprise 10.4 — Performance recommendations](https://help.splunk.com/en/splunk-enterprise/get-started/deployment-capacity-manual/10.4/performance-reference/summary-of-performance-recommendations)
- [Splunk Enterprise 10.4 — Network components](https://help.splunk.com/en/splunk-enterprise/administer/inherit-a-splunk-deployment/10.4/inherited-deployment-tasks/components-and-their-relationship-with-the-network)
- [Enterprise Security 8.5 — Production minimums](https://help.splunk.com/en/splunk-enterprise-security-8/install/8.5/planning/minimum-specifications-for-a-production-deployment)
- [ITSI 4.21 — Plan your deployment](https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/4.21/planning/plan-your-itsi-deployment)

## Disclaimers

**Planning estimates only.** Outputs are derived from public Splunk documentation and simplified formulas. They do not replace a formal sizing exercise, license quote, or architecture review.

**Lab and training focus.** The deployment guide is written for lab environments (e.g. Architect exam prep). Commands use placeholders for passwords and secrets — never commit real credentials. Some shortcuts (such as disabling the firewall) are marked as lab-only; production deployments should follow Splunk hardening guidance.

**Not affiliated with Splunk.** This is an independent community tool. Splunk, Splunk Enterprise, SVA, Enterprise Security, and ITSI are trademarks of Splunk LLC.

**Validate before production.** Confirm sizing, licensing, topology, and security with [Splunk Sales](https://www.splunk.com/en_us/about-splunk/contact-us.html) or Splunk Professional Services before any production rollout.

**No warranty.** This software is provided as-is, without warranty of any kind. Use at your own risk.

## License

See repository license file if present; otherwise treat as internal/educational use unless a license is added.
