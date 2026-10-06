# Editing the TLnagarut website — a plain-English guide

This guide is for **non-technical people**. You do **not** need to know how to
code. If you can edit a text file and put photos in a folder, you can update
this site. (Or just ask Claude Code to do it for you.)

The website has four pages, each in English and in Hebrew:

- **Home** — the welcome page (intro, "about", services, contact).
- **Workshop** — our equipment and spray finishing.
- **In the workshop** — photos of work in progress.
- **Projects** — photos of finished work, and a link to our Instagram.

The Hebrew pages are in the `he/` folder and have their own web addresses.

Everything you'll edit lives in two places:

- **`content/`** — text files for the words on the site (and the photo list).
- **`~/dev/tl-nagarut-photos/`** — your original photos, *outside* the site
  folder. They are never changed; the build makes web copies.

> 💡 **The golden rule:** after you change any text or photos, you run **one
> command** to rebuild the site (the *build*), look at it in your browser to
> check it, then *commit → push* to publish it. Each step is explained below.

---

## A few words about the files

The text files end in **`.yml`**. You open them like any text file.

1. **English and Hebrew are separate.** Files ending in `.en.yml` are English;
   `.he.yml` are Hebrew. They have the **same labels** on the left — you just
   change the words on the right. If one language is missing a text, the site
   shows the English one and the build warns you.
2. **Don't touch the labels, only the words after them.** In a line like:

   ```
   title: Custom cabinets and solid wood doors, made in Haifa.
   ```

   `title:` is the label (leave it alone). Everything after the colon is what
   shows on the site.
3. **Lines starting with `#` are notes to yourself** and never appear on the site.
4. **Never edit the `.html` pages** in the main folder or in `he/`,
   `sitemap.xml`, or anything in `assets/img/photos/`. Those are built
   **automatically** — your changes there would be wiped out.

---

## 1. Home page text & contact details

- **`content/about.en.yml`** — English text
- **`content/about.he.yml`** — Hebrew text
- **`content/contact.yml`** — phones, email, workshop address, Instagram
  (shared by both languages — edit once; the contact section and Google's
  business information are built from it)

Groups like `hero`, `about`, `services`, `contact` match the sections of the
page. `meta` holds what Google shows for each page (a title and a short
description). Longer paragraphs look like this — type underneath, keeping the
indentation:

```
about:
  p1: >
    TLnagarut is a custom cabinetry and solid wood door workshop in Haifa.
```

For phone numbers there are two lines per person — update **both**:

```
people:
  - phoneDisplay: "053-382-2875"      # what visitors see
    phoneHref: "+972533822875"        # the dialable number (keep the +972)
```

➡️ When you're done editing, jump to **[Build & preview](#build--preview)**.

---

## 2. Workshop page

- **`content/workshop.en.yml`** — English
- **`content/workshop.he.yml`** — Hebrew

At the top: the heading (`title:`) and intro (`intro:`). Then the **equipment
cards** under `equipment:`, and the **Spray finishing** section under `spray:`.

```
equipment:
  - title: SCM Minimax edgebander
    description: >
      Applies edge banding to cabinet panels, here in the workshop.
```

- **To edit a card:** change the words after `title:` and `description:`.
- **To add a card:** copy a whole block (from `- title:` to the end of its
  description), paste it below, and change the words. Keep the `- ` and the
  indentation lined up.
- **To remove a card:** delete its whole block.

Make the matching change in the Hebrew file too — the build warns if the
number of cards differs.

---

## 3. Photos

1. Put your **original** photo (straight from the phone is fine) in the right
   folder inside `~/dev/tl-nagarut-photos/`:
   - `hero/` — the big banner at the top of the home page
   - `workshop/` — the Workshop page gallery
   - `spray/` — the Spray finishing gallery
   - `process/` — the "In the workshop" page (raw process photos: no faces
     without your OK, nothing unsafe, nothing from a client's home)
2. Add it to **`content/photos.yml`** under the same group, with a descriptive
   name, a short description in both languages (`alt_en` / `alt_he`) and a
   caption (`caption_en` / `caption_he`). There is an example at the top of
   that file.
3. Run the build. It turns the photo upright, crops it to the right shape,
   makes small and large versions and compresses them — no filters, so your
   work looks the way it really looks. If the crop cuts off something
   important, add `focus: top` (or `bottom`, `left`, `right`, `centre`) and
   build again.

To remove a photo, delete its entry from `content/photos.yml` and build.

Only use photos of **your own** shop and work — not stock photos or pictures
from a manufacturer's website.

➡️ Then **[Build & preview](#build--preview)**.

---

## Build & preview

After **any** change to text, photos, or projects, do these two things.

### Step 1 — Build (rebuild the site)

This turns your edits into the actual web pages. Open the **Terminal** (in your
editor: menu **Terminal → New Terminal**) and type:

```bash
./build.sh
```

…then press Enter. You'll see a few green check-marks and `✓ All builds
complete!`. If you see a red error instead, it usually means a typo in a `.yml`
file (a missing colon or wrong indentation) — undo your last change and try
again.

> You need to build after editing any `.yml` file, a page template, or photos.
> Pure design changes (CSS) don't need it — but building anyway does no harm.

### Step 2 — Preview in your browser

To see the site on your own computer before publishing:

- **Right-click on `index.html`** in the file list on the left, and choose
  **"Open in Integrated Browser"**.
- In Terminal, type `./preview.sh` and press Enter — it opens the site in
  your default browser.

Click around — check every page, and use the **עברית / English** button to
see each page in the other language. If something looks wrong, fix the text, run
`./build.sh` again, and refresh the browser.

> The preview is **only on your computer**. Nobody else can see it yet. To make
> it public, continue below.

---

## Publish (commit, push, then check the live site)

When the preview looks right, you publish in three steps.

### Step 1 — Commit (save a snapshot of your changes)

In the editor's **Source Control** panel (the branch icon on the left sidebar):

1. You'll see your changed files listed.
2. Type a short message describing what you changed, e.g.
   *"Add spray booth photos"*.
3. Click **Commit** (the ✓ button).

### Step 2 — Push (send it to the web)

Click **Sync Changes** (or the **Push** button / the up-arrow ↑). This uploads
your changes to GitHub.

### Step 3 — Wait, then check the live version

Pushing automatically starts a publish job (it rebuilds and deploys the site for
you). This takes about **1–3 minutes**.

Then open the live site:

**https://tlnagarut.github.io/workshop/**

Refresh the page to see your changes. (If you don't see them right away, wait a
minute and refresh again — your browser sometimes shows an old copy. A "hard
refresh" — **Ctrl+Shift+R**, or **Cmd+Shift+R** on Mac — forces it to reload.)

> 🛟 **If the live site didn't update:** the publish job may have failed (usually
> a typo in a `.yml` file). On GitHub, open the repository's **Actions** tab — a
> red ✗ means it failed; click it to see the error. Fix the file, build, commit,
> and push again.

---

## Quick checklist

Every time you change something:

1. ✏️  Edit the text (`content/…`) or add photos (`~/dev/tl-nagarut-photos/` + `content/photos.yml`).
2. 🔨  Run `./build.sh` in the Terminal.
3. 👀  Preview in your browser (`./preview.sh` or right-click `index.html`).
4. 💾  **Commit** with a short message.
5. ⬆️  **Push** / **Sync Changes**.
6. ⏳  Wait 1–3 minutes, then check **https://tlnagarut.github.io/workshop/**.
