---
name: rebuild-content
description: Rebuild static content for the TL Nagarut workshop site after editing source files. Use this skill after modifying YAML content files (content/*.yml), project markdown files (assets/projects/*/project.md), adding new project folders, or replacing project/workshop photos. Runs ./build.sh which regenerates placeholder images and compiles all i18n, workshop, and project data files.
---

# Rebuild Static Content

This repo has a no-build-step site, but several JS data files are **auto-generated** from YAML content and project folders. After editing any source file listed below, you MUST run `./build.sh` so the generated files reflect the changes. Failing to do so means the live site won't show the edits.

## When to run

Run `./build.sh` after editing **any** of these:

| Edited source | Regenerates |
| --- | --- |
| `content/en.yml`, `content/he.yml`, `content/contact.yml` | `assets/js/i18n.js` |
| `content/workshop.yml`, `content/workshop.en.yml`, `content/workshop.he.yml` | `assets/workshop/workshop.js` |
| `assets/projects/<slug>/project.md` (any add/edit/remove) | `assets/js/projects-data.js` |
| Added/removed photo files in `assets/projects/<slug>/` | `assets/js/projects-data.js` |
| Added/removed photo files in `assets/workshop/` | `assets/workshop/workshop.js` |
| Created a brand-new empty project folder | placeholder SVGs + `assets/js/projects-data.js` |

## When NOT to run

Skip the build if the edit only touches:

- `index.html`, `workshop.html`, `projects.html` (static HTML, no build needed)
- `assets/css/styles.css` (CSS is loaded directly)
- `assets/js/main.js` (loaded directly, not generated)
- `README.md` or other docs

## How to run

```bash
./build.sh
```

The script runs these steps in order and stops on the first failure:

1. `node tools/generate-placeholders.mjs` — SVG placeholders for empty project folders (safe; skips folders with real photos)
2. `node tools/build-i18n.mjs` — compiles `content/*.yml` → `assets/js/i18n.js`
3. `node tools/build-workshop.mjs` — compiles `content/workshop*.yml` → `assets/workshop/workshop.js`
4. `node tools/build-projects.mjs` — scans `assets/projects/` → `assets/js/projects-data.js`

## Important

- **Never edit** `assets/js/i18n.js`, `assets/js/projects-data.js`, or `assets/workshop/workshop.js` directly. They are auto-generated and will be overwritten.
- The GitHub Action (`.github/workflows/deploy.yml`) runs these same builds on push, so committing un-rebuilt source is recoverable — but local previews will be stale until you rebuild.
- If `./build.sh` fails, read the error: most failures are YAML syntax issues (mismatched indentation, unquoted special chars) or a `project.md` missing required frontmatter.
