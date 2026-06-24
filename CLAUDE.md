# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚡ Amit Shrestha website — read before working on `docs/`

This repo also hosts a client website in **`docs/`** (a leadership-coach site for Amit
Shrestha). A self-improving **Learning Loop** lives in **`learning-loop/`** — read
`learning-loop/brain-deep.md` and `learning-loop/user-profile.md` before any site work,
and append a trace to `learning-loop/traces.md` after. Load-bearing facts and lessons:

- **Hosting:** site is in `docs/`; live site deploys from **`main` → Netlify**
  (`amitshresthaleadershipcoach.netlify.app`). Develop on a feature branch;
  **never push to `main` without explicit, per-change permission.**
- **This repo's GitHub Actions token is read-only** — Actions-based Pages deploy fails
  ("Resource not accessible by integration"). Use no-token hosting (Netlify / classic
  Pages from `/docs`); don't retry it.
- **The sandbox can't reach the outside web** (egress proxy 403s `*.github.io`,
  `*.netlify.app`, Calendly, reference URLs, tool CDNs). You cannot load the live site or
  fetch reference URLs — rely on the user to verify in their browser and to paste external
  content. Never retry a 403 policy denial.
- **Probe before you build** (M-1): verify environment/permission/intent with a cheap
  check or one question before committing to a path — most dead-ends were unverified
  assumptions.
- **Preview is the shared truth** (M-2/PROC-1): for every change, render → show the user a
  screenshot → commit to the feature branch → deploy to `main` only on approval.
- **The owner is non-technical and design-led:** jargon-free, one decision at a time,
  preview before acting, do the literal task asked, flag gaps and limits honestly.
- **Brand:** editorial/authoritative; navy `#16294D` + gold `#9A6A3C` (gold `#E3A92E` CTA);
  Playfair Display + Inter. Forms use Netlify Forms. See `learning-loop/open-questions.md`
  for what's still unverified (e.g. form capture, SEO indexing) and pending decisions.

## Project Overview

Antigravity Kit is an AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines. It works as a skill/workflow for AI coding assistants (Claude Code, Windsurf, Cursor, etc.).

## Search Command

```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```

**Domain search:**
- `product` - Product type recommendations (SaaS, e-commerce, portfolio)
- `style` - UI styles (glassmorphism, minimalism, brutalism) + AI prompts and CSS keywords
- `typography` - Font pairings with Google Fonts imports
- `color` - Color palettes by product type
- `landing` - Page structure and CTA strategies
- `chart` - Chart types and library recommendations
- `ux` - Best practices and anti-patterns

**Stack search:**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```
Available stacks: `html-tailwind` (default), `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

## Architecture

```
src/ui-ux-pro-max/                # Source of Truth
├── data/                         # Canonical CSV databases
│   ├── products.csv, styles.csv, colors.csv, typography.csv, ...
│   └── stacks/                   # Stack-specific guidelines
├── scripts/
│   ├── search.py                 # CLI entry point
│   ├── core.py                   # BM25 + regex hybrid search engine
│   └── design_system.py          # Design system generation
└── templates/
    ├── base/                     # Base templates (skill-content.md, quick-reference.md)
    └── platforms/                # Platform configs (claude.json, cursor.json, ...)

cli/                              # CLI installer (uipro-cli on npm)
├── src/
│   ├── commands/init.ts          # Install command with template generation
│   └── utils/template.ts         # Template rendering engine
└── assets/                       # Bundled assets (~564KB)
    ├── data/                     # Copy of src/ui-ux-pro-max/data/
    ├── scripts/                  # Copy of src/ui-ux-pro-max/scripts/
    └── templates/                # Copy of src/ui-ux-pro-max/templates/

.claude/skills/ui-ux-pro-max/     # Claude Code skill (symlinks to src/)
.factory/skills/ui-ux-pro-max/   # Droid (Factory) skill (symlinks to src/)
.shared/ui-ux-pro-max/            # Symlink to src/ui-ux-pro-max/
.claude-plugin/                   # Claude Marketplace publishing
```

The search engine uses BM25 ranking combined with regex matching. Domain auto-detection is available when `--domain` is omitted.

## Sync Rules

**Source of Truth:** `src/ui-ux-pro-max/`

When modifying files:

1. **Data & Scripts** - Edit in `src/ui-ux-pro-max/`:
   - `data/*.csv` and `data/stacks/*.csv`
   - `scripts/*.py`
   - Changes automatically available via symlinks in `.claude/`, `.factory/`, `.shared/`

2. **Templates** - Edit in `src/ui-ux-pro-max/templates/`:
   - `base/skill-content.md` - Common SKILL.md content
   - `base/quick-reference.md` - Quick reference section (Claude only)
   - `platforms/*.json` - Platform-specific configs

3. **CLI Assets** - Run sync before publishing:
   ```bash
   cp -r src/ui-ux-pro-max/data/* cli/assets/data/
   cp -r src/ui-ux-pro-max/scripts/* cli/assets/scripts/
   cp -r src/ui-ux-pro-max/templates/* cli/assets/templates/
   ```

4. **Reference Folders** - No manual sync needed. The CLI generates these from templates during `uipro init`.

## Prerequisites

Python 3.x (no external dependencies required)

## Git Workflow

Never push directly to `main`. Always:

1. Create a new branch: `git checkout -b feat/...` or `fix/...`
2. Commit changes
3. Push branch: `git push -u origin <branch>`
4. Create PR: `gh pr create`
