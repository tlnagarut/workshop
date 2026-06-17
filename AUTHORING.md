# Editing the TL Nagarut website — a plain-English guide

This guide is for **non-technical people**. You do **not** need to know how to
code. If you can edit a text file and drag photos into a folder, you can update
this site.

The website has three pages:

- **Home** — the welcome page (intro, "about", services, contact).
- **Workshop** — about the workshop and what it can do.
- **Projects** — a gallery of finished work.

Everything you'll edit lives in two places:

- **`content/`** — text files for the words on the site.
- **`assets/projects/`** — one folder per project, with that project's photos.

> 💡 **The golden rule:** after you change any text or photos, you run **one
> command** to rebuild the site (the *build*), look at it in your browser to
> check it, then *commit → push* to publish it. Each of these steps is explained
> below. Don't worry — it's the same few clicks every time.

---

## A few words about the files

The text files end in **`.yml`** (for English/Hebrew text) or **`.md`** (for
project descriptions). You open them like any text file and type into them.

Two things to know before you start:

1. **English and Hebrew are separate.** Files ending in `.en.yml` are English;
   `.he.yml` are Hebrew. They have the **same labels** on the left — you just
   change the words on the right. If you only speak one language, edit that one;
   the site will fall back to it.
2. **Don't touch the labels, only the words after them.** In a line like:

   ```
   title: Furniture made by hand, built to last.
   ```

   `title:` is the label (leave it alone). Everything after the colon is what
   shows on the site (change this freely).

3. **Lines starting with `#` are notes to yourself** and never appear on the
   site. You can ignore them or add your own.

4. **Never edit files in `assets/js/`** (like `content.js`, `projects.js`,
   `workshop.js`). Those are built **automatically** from your text — your
   changes there would be wiped out.

---

## 1. General content (home page text & contact details)

The home page words live in:

- **`content/about.en.yml`** — English text
- **`content/about.he.yml`** — Hebrew text
- **`content/contact.yml`** — phone, email, Instagram, city (shared by both
  languages — edit once)

### Editing the home page text

Open `content/about.en.yml`. You'll see groups like `hero`, `about`,
`services`, `contact`. For example, to change the big headline on the home page,
find:

```
hero:
  title: Furniture made by hand, built to last.
```

…and type your new headline after `title:`. Then make the matching change in
`content/about.he.yml` (find the same `hero:` → `title:` and put the Hebrew
text).

Longer paragraphs look like this — just type your new text underneath, keeping
the indentation:

```
about:
  p1: >
    I'm a woodworker based in Haifa. I make furniture the slow way —
    solid timber and finishes that age well.
```

### Editing contact details

Open `content/contact.yml`. Change the phone numbers, email, city, or Instagram
link. For phone numbers there are two lines per person:

```
people:
  - phoneDisplay: "053-382-2875"      # what visitors see
    phoneHref: "+972533822875"        # the dialable number (keep the +972)
```

Update **both**: `phoneDisplay` is what's shown, `phoneHref` is what happens when
someone taps it (must start with `+972` for Israel).

> The names that go with these numbers (Tomas, Lina) are in `about.en.yml` /
> `about.he.yml` under `contact:` — so they can be translated.

➡️ When you're done editing, jump to **[Build & preview](#build--preview)**.

---

## 2. Workshop section

The Workshop page text lives in:

- **`content/workshop.en.yml`** — English
- **`content/workshop.he.yml`** — Hebrew

At the top you can change the heading (`title:`) and intro (`intro:`). Below that
is a list of **capability cards** under `features:`. Each card has a title and a
description:

```
features:
  - title: Machine room
    description: >
      Panel saw, thicknesser, planer and router table for accurate
      milling of solid timber.
  - title: Joinery bench
    description: >
      Traditional hand-cut joinery — dovetails and fitted detail work.
```

- **To edit a card:** change the words after `title:` and `description:`.
- **To add a card:** copy an existing block (from the `- title:` line down to the
  end of its description) and paste it below, then change the words. Keep the
  `- ` in front of `title:` and keep the indentation lined up with the others.
- **To remove a card:** delete its whole block (the `- title:` line and its
  `description:`).

Make the matching change in the Hebrew file too.

### Workshop photos

Workshop photos live in the folder **`assets/workshop/`**. They show up
automatically, in filename order (`01.jpg`, `02.jpg`, …). To add a photo, drop
an image into that folder and name it so it sorts where you want (e.g. `05.jpg`).
To remove one, delete the file.

➡️ Then **[Build & preview](#build--preview)**.

---

## 3. Projects section

Each project is just a **folder** inside `assets/projects/`, containing:

- a **`project.md`** file (the title and description), and
- **photos** — a `cover.jpg` (the thumbnail) plus any gallery images.

Here's what one looks like:

```
assets/projects/oak-dining-table/
    project.md      ← title + description
    cover.jpg       ← the thumbnail shown on the Projects page
    01.jpg          ← gallery photo
    02.jpg          ← gallery photo
```

A `project.md` file looks like this:

```markdown
---
title: Solid Oak Dining Table
title_he: שולחן אוכל מעץ אלון מלא
audience: private
order: 10
cover: cover.jpg
---
A seats-eight dining table in solid European oak, finished with hardwearing
natural oil.

%%he%%
שולחן אוכל לשמונה סועדים מעץ אלון אירופי מלא, בגימור שמן טבעי עמיד.
```

The part between the two `---` lines is the **settings**:

| Setting     | What it does                                                        |
|-------------|---------------------------------------------------------------------|
| `title`     | Project name (English).                                             |
| `title_he`  | Project name in Hebrew. *Optional* — leave out to reuse English.    |
| `audience`  | Who it's for: `private`, `business`, or `both`.                     |
| `order`     | Sort order — **lower numbers show first**. *Optional.*              |
| `cover`     | Which photo is the thumbnail. *Optional* — defaults to `cover.*`.   |

Below the settings: the English description. After `%%he%%`: the Hebrew
description. **Both Hebrew parts are optional** — leave them out and English is
used for both.

### Edit an existing project

1. Open the project's folder in `assets/projects/` (e.g.
   `assets/projects/oak-dining-table/`).
2. **To change words:** open `project.md` and edit the title or description.
3. **To add photos:** drag image files into the folder (`jpg`, `png`, or
   `webp`). Any names work; they appear in filename order.
4. **To change the thumbnail:** replace `cover.jpg`, or set `cover:` in
   `project.md` to a different filename.
5. **To remove a photo:** delete that image file from the folder.

### Add a brand-new project

1. In `assets/projects/`, **create a new folder**. Name it in lowercase with
   dashes, no spaces — e.g. `walnut-coffee-table`. (This name only appears in the
   web address, not on the page.)
2. Put your photos in it. Name one **`cover.jpg`** (the thumbnail); name the rest
   `01.jpg`, `02.jpg`, etc.
3. Create a **`project.md`** file inside. Easiest way: copy `project.md` from an
   existing project into your new folder and edit it.
4. Fill in the `title`, `audience`, an `order` number, and the description.

That's it — no code. The new project appears on the Projects page after you
build and publish.

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

> You only need to build after editing **content** (`.yml` files, `project.md`,
> or photos). Pure design changes (HTML/CSS) don't need it — but building anyway
> does no harm.

### Step 2 — Preview in your browser

To see the site on your own computer before publishing:

- **Right-click on `index.html`** in the file list on the left, and choose
  **"Open in Integrated Browser"**.
- In Terminal, type `./preview.sh` and press Enter — it opens the site in
  your default browser.

Click around — check the Home, Workshop, and Projects pages, and try the
**English ⇄ Hebrew** toggle. If something looks wrong, fix the text, run
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
   *"Add walnut coffee table project"*.
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

1. ✏️  Edit the text (`content/…`) or project (`assets/projects/…`).
2. 🔨  Run `./build.sh` in the Terminal.
3. 👀  Preview in your browser (`./preview.sh` or right-click `index.html`).
4. 💾  **Commit** with a short message.
5. ⬆️  **Push** / **Sync Changes**.
6. ⏳  Wait 1–3 minutes, then check **https://tlnagarut.github.io/workshop/**.
