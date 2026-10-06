---
name: rebuild-content
description: Rebuild the TLnagarut website after editing content. Use after modifying text or contact details (content/*.yml), the photo list (content/photos.yml), page templates (templates/*.html), or adding/replacing original photos in ~/dev/tl-nagarut-photos/. Runs ./build.sh, which processes photos and writes the English pages (root) and Hebrew pages (he/) plus sitemap.xml.
---

# Rebuild the site

The four English pages in the repo root (`index.html`, `workshop.html`,
`in-the-workshop.html`, `projects.html`), their Hebrew twins in `he/`, and
`sitemap.xml` are **generated** from `templates/*.html` + `content/*.yml`.
After editing any source listed below, run `./build.sh` so the pages reflect
the change — otherwise the live site won't show the edits.

## When to run

| Edited source | Regenerates |
| --- | --- |
| `content/about.en.yml`, `content/about.he.yml` (site text) | all pages |
| `content/workshop.en.yml`, `content/workshop.he.yml` | `workshop.html`, `he/workshop.html` |
| `content/contact.yml` (phones, email, address, Instagram) | all pages (contact, Google data) |
| `content/photos.yml`, or photos in `~/dev/tl-nagarut-photos/` | `assets/img/photos/` + the pages |
| `templates/*.html` | the matching page, in both languages |

## When NOT to run

Skip the build if the edit only touches `assets/css/styles.css`,
`assets/js/main.js`, or docs (README, AUTHORING, CLAUDE.md).

## How to run

```bash
./build.sh
```

Steps, in order (stops on the first failure):

1. `generate-placeholders.mjs` — plain wood-tone banner + tab icon (local only)
2. `process-photos.mjs` — originals → web photos, following the Photos rules in
   CLAUDE.md (local only; needs `brew install vips`; skips unchanged photos)
3. `build-pages.mjs` — writes the English pages, the Hebrew pages in `he/`,
   and `sitemap.xml`
4. `stamp-versions.mjs` — cache-busting `?v=` hashes on CSS/JS

## Important

- **Never edit** the generated pages (root `*.html`, `he/*.html`),
  `sitemap.xml`, or
  anything in `assets/img/photos/` by hand — they are overwritten.
- Read the `!` warnings: a key missing in one language, a photo listed but not
  processed, or a photo without alt text in both languages.
- After building, look at the result (`./preview.sh`), in English and Hebrew (the `he/` pages).
- The GitHub Action (`.github/workflows/deploy.yml`) re-runs steps 3–4 on push;
  keep it in sync with `build.sh`.
