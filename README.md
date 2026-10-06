# TLnagarut — custom cabinetry website

A small, fast showcase site for Tomas Janulionis' custom cabinetry and solid
wood door workshop in Haifa (TL נגרות). Plain HTML/CSS/JS, no framework, hosted
on GitHub Pages at https://tlnagarut.github.io/workshop/.

- **Bilingual:** English pages at the site root, Hebrew (right-to-left) pages
  under `he/`, linked with `hreflang`; the language button links to the same
  page in the other language. All text is in the HTML, so search engines see
  full pages.
- **Four pages:** `index.html` (Hero · About · Services · Contact),
  `workshop.html` (equipment, spray finishing), `in-the-workshop.html` (work in
  progress photos), `projects.html` (links to Instagram until real project
  photos are added).

## First-time setup (new Mac)

Open **Terminal** (⌘+Space, type "Terminal", Enter) and paste:

```bash
curl -fsSL https://raw.githubusercontent.com/tlnagarut/workshop/main/setup.sh | bash
```

That installs git, Node.js, VS Code and libvips (for photos) via Homebrew, and
downloads the project to `~/dev/tl-nagarut-site`. If you already have the
folder, run `./setup.sh` inside it. Safe to re-run.

## Preview
- in VS Code: right click on `index.html` -> `Open in Integrated Browser`
- in Terminal: `./preview.sh` (opens index.html directly in the default browser)

## How content works

| Edit this (source)                               | What it controls                          |
|--------------------------------------------------|-------------------------------------------|
| `content/about.en.yml`, `content/about.he.yml`   | site text, page titles & descriptions     |
| `content/workshop.en.yml`, `content/workshop.he.yml` | Workshop page: equipment, spray finishing |
| `content/contact.yml`                            | phones, email, address, Instagram (both languages) |
| `content/photos.yml`                             | which photos appear, names, alt text, captions |
| `templates/*.html`                               | page structure                            |

After editing, **run `./build.sh`** (or the `rebuild-content` skill). It writes
the generated pages (root `*.html` and `he/*.html`) — never edit those by
hand. See `AUTHORING.md` for a plain-English guide and `CLAUDE.md` for the
photo rules.

## Photos

Originals stay outside the site, in `~/dev/tl-nagarut-photos/<group>/`
(`hero`, `workshop`, `spray`, `process`). `./build.sh` rotates, crops (4:3 tiles, 16:9
banner), resizes (480–1600 px, WebP + JPEG, < 300 KB) and strips metadata into
`assets/img/photos/`, which is committed — the deploy needs no extra steps.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` rebuilds the pages and deploys on every push to
`main`. One-time: repo **Settings → Pages → Source → GitHub Actions**.

## File map

```
templates/*.html                 page structure (edit these)
*.html (root) · he/*.html · sitemap.xml   GENERATED — do not edit
content/*.yml                    text, contact details, photo list (edit here)
assets/css/styles.css            all styling (light theme + RTL)
assets/js/main.js                mobile menu, photo viewer
assets/img/photos/               GENERATED web photos + manifest.json
assets/img/                      banner background, social preview image, tab icon
tools/build-pages.mjs            templates + content → EN + HE pages, sitemap
tools/process-photos.mjs         original photos → web photos (local, libvips)
tools/make-social-card.mjs       makes the 1200×630 link-preview image (local)
tools/generate-placeholders.mjs  plain wood-tone banner + tab icon
tools/stamp-versions.mjs         cache-busting ?v= hashes
tools/yaml.mjs                   shared YAML reader
setup.sh · build.sh · preview.sh one-time setup · rebuild · open in browser
```
