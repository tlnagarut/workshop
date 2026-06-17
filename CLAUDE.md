# CLAUDE.md

TL Nagarut — a small static intro site for Tomas Janulionis' woodworking
business in Haifa. Plain HTML/CSS/JS, **no build framework**, hosts on GitHub Pages.

## Layout

- `index.html`, `workshop.html`, `projects.html` — the three pages (static HTML).
- `assets/css/`, `assets/js/` — styles and scripts, loaded directly.
- `content/*.yml` — source content (i18n strings, workshop, contact).
- `assets/projects/<slug>/` — one folder per project (a `project.md` + photos).
- `tools/*.mjs` — generators that compile YAML/markdown into JS data files.
- `build.sh` — runs all generators. `preview.sh` — opens the site in a browser.

## Generated files — run the build after editing source

Several JS data files (`assets/js/i18n.js`, `assets/js/projects-data.js`,
`assets/workshop/workshop.js`) are **auto-generated** from the YAML content
and project folders. They are not edited by hand.

After editing any `content/*.yml`, any `assets/projects/<slug>/project.md`, or
adding/removing project or workshop photos, **run `./build.sh`** (or use the
**`rebuild-content` skill**) so the generated files reflect your changes.
Skip the build for edits to HTML, CSS, `assets/js/main.js`, or docs.

## Preview

`./preview.sh` opens `index.html` directly in the default browser (no server).
