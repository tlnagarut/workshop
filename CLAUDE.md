# CLAUDE.md

TLnagarut (TL נגרות) — a small, fast, bilingual (English / Hebrew) showcase site for
Tomas Janulionis' custom woodworking and cabinetry workshop in Haifa, Israel.
Plain HTML/CSS/JS, **no build framework**, hosted on GitHub Pages.

## What this site is for

It is a shop window, not a web shop. It has three jobs:

1. Be **found** — on Google and by AI assistants — when someone looks for custom
   cabinets or solid wood doors in Haifa.
2. Build **trust** — clients and interior designers check the site before they call.
3. Make it **easy to get in touch**.

Keep it lean: a short intro, the best project photos, the workshop's equipment,
and contact details. Do not add pages, sections, blogs or features unless the
owner asks.

## About the business — use only these facts

- Names: "TLnagarut" in English, "TL נגרות" in Hebrew. Use exactly these
  spellings everywhere (pages, titles, metadata, structured data).
- Custom cabinetry and furniture, solid wood doors, cabinet panel production,
  hardware installation.
- Workshop address: Arye Shenkar Street 35, Haifa, Israel.
- Everything is done in-house: design, cutting, assembly, spray finishing,
  installation.
- Equipment worth showing: SCM Minimax edgebander, Blum hardware systems,
  Fuji HVLP spray finishing.
- Busellato Jet Optima RT CNC nesting machine: purchased, not yet installed.
  Show as 'arriving soon' until the owner says it is installed.
- Phone, email, Instagram and any other contact details live in
  `content/contact.yml`. That file is the **single source of truth**.

**Never invent** a phone number, email, price, client name, years in business,
award, certificate or business registration number. If something is missing,
leave it out and tell the owner what's missing.

## Audience — the person editing this is non-technical

The site owner uses Claude Code to make changes and **is not a programmer**.
Keep this in mind:

- Explain what you're doing in plain language — avoid jargon, or define it when
  you must use it. Skip the deep technical detail unless asked.
- Default to making the change yourself rather than handing back instructions or
  code snippets for them to run.
- Most requests will be about **content** (text, photos, project entries, contact
  details) — these live in `content/*.yml` and the photos folder (see Photos). Make the edit,
  then run the build for them (see below); don't ask them to run commands.
- After a change, tell them how to see the result (e.g. "run `./preview.sh`" or
  describe what changed) and confirm it looks right.
- Before anything irreversible (deleting files, removing a project, force-pushing),
  pause and explain in plain terms what will happen, and ask first.

## Which files you may open

Only open files inside the site folder, the photo folders
(`~/dev/tl-nagarut-photos/`), or files the owner names. Never browse
Downloads, Desktop or other personal folders.

## Start of session — sync with git first

The owner won't think to do this, so **do it for them**. At the start of a
session, before making changes, run `git pull` (after a `git fetch`) to make
sure you're working on the latest version of the site. The site may have been
updated from another computer or by the deploy process, and editing a stale
copy causes conflicts later.

- If the working copy has uncommitted changes or the pull would conflict, **stop
  and explain in plain terms** before doing anything — don't force it.
- Mention briefly that you synced (e.g. "I pulled the latest version first"),
  so they know it happened.

## Layout

- `templates/index.html`, `workshop.html`, `in-the-workshop.html`,
  `projects.html` — the four pages' structure. **Edit these, not the generated
  HTML files.**
- `index.html`, `workshop.html`, `in-the-workshop.html`, `projects.html` (repo
  root, English), the same four in `he/` (Hebrew) and `sitemap.xml` —
  **generated** by `tools/build-pages.mjs` from the templates + `content/`.
  Never edit by hand.
- `content/*.yml` — all text (EN/HE), contact details, and the photo list.
- `assets/css/styles.css`, `assets/js/main.js` — styles and the small script
  (mobile menu, photo viewer), loaded directly.
- `assets/img/photos/` — **generated** web-ready photos + `manifest.json`.
- `tools/*.mjs` — the build steps. `build.sh` runs them all. `preview.sh` opens
  the site in a browser.

## How pages are built

Each template is built twice: an English page in the repo root and a Hebrew
page (right-to-left) at the same name in `he/` — e.g. `workshop.html` and
`he/workshop.html`. Each has its own address, title and description in its
language, `hreflang` links to its twin, and is listed in `sitemap.xml`. The
language button is a plain link to the twin page. All text is written into the
HTML at build time, so search engines see full pages without running scripts.
In a template, `<h1 data-i18n="hero.title"></h1>` becomes that text in the
page's language; `data-i18n-aria="key"` gives a translated `aria-label`. `<!-- @name -->`
marks a generated block (head tags, Google business data, contact list,
equipment cards, photo grids, footer …) — see `BLOCKS` in `tools/build-pages.mjs`.

After editing any `content/*.yml`, a template, or the photo list, **run
`./build.sh`** (or use the **`rebuild-content` skill**). Skip the build for
edits to CSS or `assets/js/main.js`.

## Photos

The owner's **original photos live outside the site folder**, in
`~/dev/tl-nagarut-photos/<group>/` (groups: `hero`, `workshop`, `spray`,
`process` = the "In the workshop" page, `projects` = finished work on the
Projects page), and
are never modified. `content/photos.yml` lists which photos are used, with a
descriptive file `name`, `alt_en`/`alt_he` and `caption_en`/`caption_he`.
`./build.sh` runs `tools/process-photos.mjs` (needs libvips: `brew install
vips`), which applies these rules to **every** photo — follow them for any photo
the owner adds later:

- **Upright:** rotate using the phone's rotation (EXIF orientation) tag.
- **Fixed shape per place:** gallery tiles **4:3**, big banner photos (`hero`)
  **16:9**. Crop so the important part of the piece stays in frame
  (libvips "attention" crop by default; set `focus:` — top / bottom / left /
  right / centre — when it picks wrong). Look at the result and check.
- **Sizes:** 480, 800, 1200 and 1600 px wide (never upscaled), **WebP + JPEG
  fallback**, each file **under ~300 KB**. Colours converted to sRGB; camera and
  GPS metadata stripped.
- **No filters or editing** — only rotate, crop, resize, compress, so the work
  looks the way it really looks.
- **Descriptive file names and alt text in both languages** — never `IMG_1234`.
- The build writes `width`/`height` on every image (no layout jumps), loads
  photos lazily except the top banner, and shows galleries as a grid of equal
  tiles; tapping opens a larger view (swipe on phones) with a bilingual caption.
- Processed files are **committed**, so the deploy needs no extra steps.
- Only use photos of the owner's real shop and work — no stock photos, no
  manufacturer screenshots.

The link-preview image (`assets/img/tlnagarut-custom-cabinets-solid-wood-doors-haifa.jpg`,
1200×630 JPG) is made by `tools/make-social-card.mjs`; replace it with a real
workshop photo when there is one.

## Deploy — keep `.github/workflows/deploy.yml` in sync with `build.sh`

The deploy workflow does **not** call `build.sh`. It re-runs the build steps
itself, so its list of `node tools/*.mjs` steps is a hand-kept copy of what
`build.sh` runs. **Whenever you add, remove, or reorder a step in `build.sh`,
mirror that change in `deploy.yml`** — otherwise the deployed site is built
differently from local. (Exceptions: `generate-placeholders.mjs` and
`process-photos.mjs` are local-only — their output is committed.) Keep
`stamp-versions.mjs` last so it hashes the freshly generated files.

## Preview
- in VS Code: right click on `index.html` -> `Open in Integrated Browser`
- in Terminal: `./preview.sh` (opens index.html directly in the default browser)
