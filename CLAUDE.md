# CLAUDE.md

TL Nagarut — a small static intro site for Tomas Janulionis' woodworking business in Haifa.
Plain HTML/CSS/JS, **no build framework**, hosts on GitHub Pages.

## Audience — the person editing this is non-technical

The site owner uses Claude Code to make changes and **is not a programmer**.
Keep this in mind:

- Explain what you're doing in plain language — avoid jargon, or define it when
  you must use it. Skip the deep technical detail unless asked.
- Default to making the change yourself rather than handing back instructions or
  code snippets for them to run.
- Most requests will be about **content** (text, photos, project entries, contact
  details) — these live in `content/*.yml` and `assets/projects/`. Make the edit,
  then run the build for them (see below); don't ask them to run commands.
- After a change, tell them how to see the result (e.g. "run `./preview.sh`" or
  describe what changed) and confirm it looks right.
- Before anything irreversible (deleting files, removing a project, force-pushing),
  pause and explain in plain terms what will happen, and ask first.

## Layout

- `index.html`, `workshop.html`, `projects.html` — the three pages (static HTML).
- `assets/css/`, `assets/js/` — styles and scripts, loaded directly.
- `content/*.yml` — source content (i18n strings, workshop, contact).
- `assets/projects/<slug>/` — one folder per project (a `project.md` + photos).
- `tools/*.mjs` — generators that compile YAML/markdown into JS data files.
- `build.sh` — runs all generators. `preview.sh` — opens the site in a browser.

## Generated files — run the build after editing source

Several JS data files (`assets/js/content.js`, `assets/js/projects.js`,
`assets/js/workshop.js`) are **auto-generated** from the YAML content
and project folders. They are not edited by hand.

After editing any `content/*.yml`, any `assets/projects/<slug>/project.md`, or
adding/removing project or workshop photos, **run `./build.sh`** (or use the
**`rebuild-content` skill**) so the generated files reflect your changes.
Skip the build for edits to HTML, CSS, `assets/js/main.js`, or docs.

## Deploy — keep `.github/workflows/deploy.yml` in sync with `build.sh`

The deploy workflow does **not** call `build.sh`. It re-runs the generators
itself, step by step, so its list of `node tools/*.mjs` steps is a hand-kept
copy of what `build.sh` runs. **Whenever you add, remove, or reorder a generator
in `build.sh`, mirror that change in `deploy.yml`** — otherwise the deployed
site is built differently from local. (Exception: `generate-placeholders.mjs`
is intentionally local-only.) Keep `stamp-versions.mjs` last so it hashes the
freshly generated files.

## Preview
- in VS Code: right click on `index.html` -> `Open in Integrated Browser`
- in Terminal: `./preview.sh` (opens index.html directly in the default browser)
