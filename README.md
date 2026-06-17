# TL Nagarut — woodworking website

A small, fast intro site for Tomas Janulionis' woodworking business in Haifa.
Plain HTML/CSS/JS, no framework, hosts on GitHub Pages.

- **Bilingual:** English (default) with an English ⇄ Hebrew toggle; RTL handled automatically.
- **Three pages:** `index.html` (Hero · About · Services · Contact), `workshop.html`, `projects.html`.
- Light, warm woodworking palette.

> ⚠️ Contact details, "about" text, and project photos are placeholders
> (Pexels stock — free for commercial use). Replace before promoting the site.

## Preview

```bash
./preview.sh          # opens index.html in your browser (no server)
```

## How content works

Source content lives in YAML and per-project folders. Several JS data files are
**auto-generated** from it — don't edit them by hand:

| Edit this (source)                           | Generates                     |
|----------------------------------------------|-------------------------------|
| `content/about.en.yml`, `content/about.he.yml` | `assets/js/i18n.js`         |
| `content/contact.yml`                        | (shared by both languages)    |
| `content/workshop.{en,he}.yml`               | `assets/js/workshop.js`       |
| `assets/projects/<slug>/project.md` + photos | `assets/js/projects.js`       |

After editing any source file, **run `./build.sh`** (or the `rebuild-content`
skill) to regenerate. Skip the build for edits to HTML, CSS, or `assets/js/main.js`.

## Add a project

A project is just a folder with photos and a `project.md` — no code:

```
assets/projects/my-new-table/
    project.md
    cover.jpg     # card thumbnail (or any file named cover.*)
    01.jpg        # gallery photos (any names; jpg/png/webp)
```

```markdown
---
title: My New Table
title_he: השולחן החדש שלי     # optional
audience: private             # private | business | both
order: 5                      # optional; lower shows first
cover: cover.jpg              # optional; defaults to cover.* or first photo
---
Short description in English.

%%he%%
תיאור קצר בעברית.
```

All Hebrew is optional — omit `title_he` / `%%he%%` and English is used for both.
Then `./build.sh` and commit.

## Edit text & contact details

- **English / Hebrew strings:** `content/about.en.yml`, `content/about.he.yml` (same keys).
- **Contact (name, phone, email, Instagram, city):** `content/contact.yml`.
- **Workshop:** `content/workshop.{en,he}.yml` for text. Photos are picked up
  automatically from `assets/workshop/` (any image files, in filename order).

Run `./build.sh` after editing. The build warns if a key exists in one language
but is missing from the other.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
One-time: repo **Settings → Pages → Source → GitHub Actions**. Site goes live at
`https://<username>.github.io/<repo>/`.

## File map

```
index.html / workshop.html / projects.html   the three pages
assets/css/styles.css                         all styling (light theme + RTL)
assets/js/main.js                             language switch, rendering, gallery
assets/js/i18n.js · projects.js · workshop.js   AUTO-GENERATED — do not edit
content/*.yml                                  source text (edit here)
assets/projects/<slug>/                        one folder per project
assets/img/                                    hero + social-share images
tools/build-i18n.mjs                           content/*.yml → i18n.js
tools/build-workshop.mjs                        content/workshop*.yml → assets/js/workshop.js
tools/build-projects.mjs                        assets/projects/ → projects.js
tools/generate-placeholders.mjs                regenerates placeholder images
tools/yaml.mjs                                  shared YAML reader
build.sh                                        runs all generators
preview.sh                                      opens the site in a browser
```
