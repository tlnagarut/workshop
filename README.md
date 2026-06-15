# TL Nagarut — woodworking website

A small, fast intro site for Tomas Janulionis' woodworking business in Haifa.
Plain HTML/CSS/JavaScript — **no build step**, hosts directly on GitHub Pages.

- Bilingual: **English** (default) with an **English ⇄ Hebrew** toggle (Hebrew is a
  first-draft AI translation; RTL layout is handled automatically).
- Light theme, warm woodworking palette.
- Main page (`index.html`): Hero · About · Services · Contact.
- Workshop and Projects each have their **own page** (`workshop.html`, `projects.html`),
  linked from the nav (and the hero links to Projects).

> ⚠️ **Placeholders to replace later:** contact details and "about" text are
> invented, and the project photos are free **stock images from Pexels**
> (free for commercial use, no attribution required) standing in for Tomas'
> own work. Swap them for real photos before promoting the site.

---

## View it locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

---

## Deploy on GitHub Pages

A GitHub Action (`.github/workflows/deploy.yml`) builds and deploys the site on
every push to `main`. One-time setup:

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source** → choose
   **GitHub Actions**.
3. Push (or use the **Actions** tab → *Deploy site* → *Run workflow*).
4. The site goes live at `https://<username>.github.io/<repo>/`.

Custom domain later? Add it under Settings → Pages.

---

## Add a project (the common task)

A project is just a **folder** with **photos** and a **`project.md`** file —
no code to edit.

1. Create a folder named after the project (lowercase, dashes) and drop your
   photos in, plus a `project.md`:

   ```
   assets/projects/my-new-table/
       project.md
       cover.jpg     ← the card thumbnail (or any file named cover.*)
       01.jpg        ← more photos for the gallery (any names)
       02.jpg
   ```
   JPG, PNG, WebP all work.

2. Write `project.md` like this:

   ```markdown
   ---
   title: My New Table
   title_he: השולחן החדש שלי     # optional
   audience: private             # private | business | both
   order: 5                      # optional; lower numbers show first
   cover: cover.jpg              # optional; defaults to cover.* or first photo
   ---
   Short description in English.

   %%he%%
   תיאור קצר בעברית.
   ```

   Everything Hebrew is optional — leave `title_he` and the `%%he%%` section out
   and the English text is shown in both languages.

3. **Commit and push.** The GitHub Action rebuilds and redeploys automatically.

> Want to preview locally first? Run `node tools/build-projects.mjs` to refresh
> the project data, then open the site (see above). The Action does this same
> step for you on push, so it's optional.

---

## Customize the Workshop section

Workshop text lives in plain YAML under `content/`, same as the rest of the site:

- **English:** `content/workshop.en.yml` — heading, intro, and the capability
  cards (add, remove or reorder entries under `features`).
- **Hebrew:** `content/workshop.he.yml` (same keys).
- **Photos:** listed in `content/workshop.yml`. Replace the files in
  `assets/workshop/` (keep the names `01.jpg`–`04.jpg`) or edit the `photos` list.
  Clicking a photo opens the gallery.

After editing, run **`node tools/build-workshop.mjs`** (or just push). Don't edit
`assets/workshop/workshop.js` directly — it's auto-generated.

## Edit text / contact details / Hebrew translations

Text lives in plain, friendly **YAML** files under `content/` — no code, no quotes or
commas to get wrong:

- **English:** `content/en.yml`
- **Hebrew:** `content/he.yml` (same keys as English)
- **Contact details (name, phone, email, Instagram, city):** `content/contact.yml` —
  shared by both languages, change it once and it updates everywhere.

After editing, run **`node tools/build-i18n.mjs`** to regenerate `assets/js/i18n.js`
(or just push — the deploy workflow runs it for you). The build warns if a key exists
in one language but is missing from the other.

> Don't edit `assets/js/i18n.js` directly — it's auto-generated and will be overwritten.

## Replace the placeholder images

Each project's photos live in its own `assets/projects/<slug>/` folder (currently
free Pexels stock photos), plus `hero.svg` and `og-image.svg` in `assets/img/`.
Just swap in real photos — keep the same filenames, or use new ones and update
`cover:` / re-run the build. `generate-placeholders.mjs` will **not** overwrite a
project folder that already contains real photos.

> Note: project images are `.jpg` (good balance of quality and size). The build
> accepts any format — `.png`, `.webp`, `.jpg` — so use whatever your photos are.

## File map

```
index.html                       main page (about, services, contact)
workshop.html                    workshop page (facilities + photo gallery)
projects.html                    projects page (grid + photo gallery)
assets/css/styles.css            all styling (light theme + RTL)
content/en.yml                   ← English text (edit here)
content/he.yml                   ← Hebrew text (edit here)
content/contact.yml              ← shared contact details (edit here)
content/workshop.en.yml          ← Workshop text, English (edit here)
content/workshop.he.yml          ← Workshop text, Hebrew (edit here)
content/workshop.yml             ← Workshop photos list (edit here)
assets/js/i18n.js                AUTO-GENERATED from content/ — do not edit by hand
assets/js/main.js                language switch, rendering, gallery
assets/js/projects-data.js       AUTO-GENERATED — do not edit by hand
assets/workshop/workshop.js      AUTO-GENERATED from content/ — do not edit by hand
assets/workshop/*.jpg            ← Workshop photos
assets/projects/<slug>/          ← one folder per project (photos + project.md)
assets/img/                      hero + social-share placeholder images
tools/build-i18n.mjs             compiles content/*.yml → i18n.js
tools/build-workshop.mjs         compiles content/workshop*.yml → workshop.js
tools/yaml.mjs                   tiny shared YAML reader used by the builds
tools/build-projects.mjs         scans assets/projects/ → projects-data.js
tools/generate-placeholders.mjs  regenerates placeholder images
.github/workflows/deploy.yml     auto-build + deploy on push
```
