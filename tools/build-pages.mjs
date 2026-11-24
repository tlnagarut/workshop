/* ============================================================================
 * Builds the pages from the templates in templates/ and the text in content/,
 * once per language, plus sitemap.xml and robots.txt (addresses come from
 * siteUrl in content/contact.yml). Run:
 *   node tools/build-pages.mjs        (invoked by build.sh and the deploy)
 *
 *   English: index.html, workshop.html, in-the-workshop.html, projects.html
 *   Hebrew:  he/index.html, he/workshop.html, … (right-to-left)
 *   Russian: ru/index.html, ru/workshop.html, …
 *
 * Each page has its own address, title and description in its language, and
 * hreflang links to its twins in the other languages. All text is written
 * into the HTML itself, so search engines and AI assistants see a complete
 * page without running any script. The language buttons are plain links to
 * the same page in the other languages.
 *
 * Sources:
 *   content/about.en.yml, about.he.yml, about.ru.yml   site text (keys like hero.title)
 *   content/workshop.en.yml, .he.yml, .ru.yml          Workshop page (keys workshop.*)
 *   content/contact.yml                      phones, email, address, links
 *   content/home.yml                         which photos the home page shows
 *   content/photos.yml + assets/img/photos/manifest.json   photos
 *   content/photos.ru.yml                    Russian photo captions
 *   assets/projects/<slug>/project.md + photos   Projects page, one per project
 *
 * Template syntax (templates/*.html):
 *   <h1 data-i18n="hero.title"></h1>     → the text in the page's language
 *   <button data-i18n-aria="nav.menuAria">  → translated aria-label
 *   <!-- @footer -->                     → a generated block (see BLOCKS)
 *   {{htmlAttrs}}                        → a generated value (see INLINE)
 * ========================================================================== */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml, flatten } from "./yaml.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const loadYaml = (rel) => parseYaml(read(rel));

const contact = loadYaml("content/contact.yml");
const text = Object.fromEntries(["en", "he", "ru"].map((lang) => [lang, {
  ...flatten(loadYaml(`content/about.${lang}.yml`), "", {}),
  ...flatten(loadYaml(`content/workshop.${lang}.yml`), "workshop", {}),
}]));
const home = loadYaml("content/home.yml");
const ruCaptions = existsSync(join(root, "content/photos.ru.yml")) ? loadYaml("content/photos.ru.yml") : {};
const photoConfig = existsSync(join(root, "content/photos.yml")) ? loadYaml("content/photos.yml") : {};
const manifestPath = "assets/img/photos/manifest.json";
const manifest = existsSync(join(root, manifestPath)) ? JSON.parse(read(manifestPath)) : {};

const SITE = contact.siteUrl.replace(/\/?$/, "/");
const SOCIAL_IMAGE = "assets/img/tlnagarut-custom-cabinets-solid-wood-doors-haifa.jpg";

// English pages sit in the site's root; Hebrew and Russian pages live one
// folder down, in he/ and ru/. label = what the language button shows.
const LANGS = {
  en: { dir: "ltr", folder: "", locale: "en_US", label: "EN", name: "English" },
  he: { dir: "rtl", folder: "he/", locale: "he_IL", label: "עב", name: "עברית" },
  ru: { dir: "ltr", folder: "ru/", locale: "ru_RU", label: "RU", name: "Русский" },
};
const others = (lang) => Object.keys(LANGS).filter((l) => l !== lang);

const PAGES = [
  { key: "home", template: "templates/index.html", out: "index.html", path: "" },
  { key: "workshop", template: "templates/workshop.html", out: "workshop.html", path: "workshop.html" },
  { key: "inWorkshop", template: "templates/in-the-workshop.html", out: "in-the-workshop.html", path: "in-the-workshop.html" },
  { key: "projects", template: "templates/projects.html", out: "projects.html", path: "projects.html" },
];

// The language of the page being rendered (set by render()).
let LANG = "en";

const warnings = new Set();
const warn = (msg) => warnings.add(msg);

// ---------------------------------------------------------------- text helpers
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function t(lang, key) {
  const v = text[lang][key];
  if (typeof v === "string" && v !== "") return v;
  if (lang !== "en") { warn(`"${key}" is missing in ${LANGS[lang].name} — showing English`); return t("en", key); }
  warn(`"${key}" is missing in English`);
  return "";
}

// Pick the English, Hebrew or Russian version for the page being rendered
// (a missing Russian version falls back to English).
const pick = (en, he, ru) => (LANG === "he" ? he : LANG === "ru" ? (ru || en) : en);
const both = (en, he, ru) => esc(pick(en, he, ru));
const tr = (key) => esc(t(LANG, key));
const attr = (name, en, he, ru) => `${name}="${esc(pick(en, he, ru))}"`;
const aria = (key) => `aria-label="${esc(t(LANG, key))}"`;

// Line up an English list with its Hebrew and Russian twins (workshop cards,
// spray facts, home-page cards).
function pairs(key) {
  const en = [].concat(text.en[key] || []);
  const he = [].concat(text.he[key] || []);
  const ru = [].concat(text.ru[key] || []);
  if (en.length !== he.length) warn(`${key}: ${en.length} English item(s) but ${he.length} Hebrew`);
  if (en.length !== ru.length) warn(`${key}: ${en.length} English item(s) but ${ru.length} Russian`);
  return en.map((item, i) => [item, he[i] ?? item, ru[i] ?? item]);
}
// The same list, already in the page's language.
const list = (key) => pairs(key).map(([en, he, ru]) => pick(en, he, ru));

const pageUrl = (page, lang = LANG) => SITE + LANGS[lang].folder + page.path;
// Link from this page to the same page in another language (explicit
// index.html so it also works when the files are opened straight from disk).
const twinHref = (page, lang) =>
  (LANGS[LANG].folder ? "../" : "") + LANGS[lang].folder + (page.path || "index.html");
const address = (lang, withCountry = true) => {
  const a = contact.address;
  const x = { en: "En", he: "He", ru: "Ru" }[lang];
  const parts = [a["street" + x] || a.streetEn, a["city" + x] || a.cityEn];
  if (withCountry) parts.push(a["country" + x] || a.countryEn);
  return parts.join(", ");
};

// ---------------------------------------------------------------- people
// The two contact people (content/contact.yml), with their names in the
// page's language. answerer() = who the WhatsApp and call buttons go to on
// this language's pages (contact.yml "answers").
function person(i) {
  const p = contact.people[i];
  return { ...p, n: i + 1, wa: p.phoneHref.replace(/\D/g, ""),
    name: t(LANG, `contact.person${i + 1}Name`), langs: t(LANG, `contact.person${i + 1}Langs`) };
}
const answerer = () => person((Number((contact.answers || {})[LANG]) || 1) - 1);
const waHref = (p, message = t(LANG, "whatsapp.message")) =>
  esc(`https://wa.me/${p.wa}?text=${encodeURIComponent(message)}`);

// ---------------------------------------------------------------- logo
// The TLnagarut logo: a large serif "TL", a smaller letter-spaced "nagarut"
// and an open square frame around the end of the word (drawn as a line that
// starts halfway up the left side and stops halfway along the bottom). It
// takes the colour of the text around it, so it works on light and on dark.
const logo = () =>
  `<span class="logo" aria-hidden="true"><span class="logo__tl">TL</span><span class="logo__word"><span>nagarut</span>` +
  `<svg class="logo__frame" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">` +
  `<path d="M0 50V0h100v100H50" fill="none" stroke="currentColor" vector-effect="non-scaling-stroke"/></svg></span></span>`;

// ---------------------------------------------------------------- icons
const icon = (id, cls = "") =>
  `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;

// The "Google reviews" link: opens the business's Google profile, where the
// reviews are (content/contact.yml "googleProfile"). cls = extra classes for
// the link, e.g. to make it a button. Empty when there is no profile link.
const reviewsLink = (cls = "", more = "") => !contact.googleProfile ? "" :
  `<a${cls ? ` class="${cls}"` : ""} href="${esc(contact.googleProfile)}" target="_blank" rel="noopener"${more}>` +
  `${icon("i-star")}<span>${esc(t(LANG, "reviews.cta"))}</span></a>`;
// Arrows point the reading direction: right in English/Russian, left in Hebrew.
const rtl = () => LANGS[LANG].dir === "rtl";
const arrow = () => icon(rtl() ? "i-arrow-l" : "i-arrow-r");

// ---------------------------------------------------------------- photos
// Photos listed in content/photos.yml, joined with what tools/process-photos.mjs
// produced (sizes). A listed photo that hasn't been processed is skipped.
function photos(group) {
  const list = Array.isArray(photoConfig[group]) ? photoConfig[group] : [];
  return list.map((cfg) => {
    const name = String(cfg.name || cfg.file || "").toLowerCase()
      .replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const done = (manifest[group] || []).find((p) => p.name === name);
    if (!done) { warn(`photo ${group}/${cfg.file} is listed but not processed yet — run ./build.sh with the originals folder present`); return null; }
    if (!cfg.alt_en || !cfg.alt_he) warn(`photo ${group}/${name} needs alt_en and alt_he`);
    return {
      ...done, group, section: cfg.section || "",
      alt: { en: cfg.alt_en || "", he: cfg.alt_he || cfg.alt_en || "", ru: cfg.alt_ru || ruCaptions[name] || "" },
      caption: { en: cfg.caption_en || cfg.alt_en || "", he: cfg.caption_he || cfg.alt_he || "",
        ru: cfg.caption_ru || ruCaptions[name] || "" },
    };
  }).filter(Boolean);
}

function srcset(p, ext) {
  return p.widths.map((w) => `assets/img/photos/${p.group}/${p.name}-${w}.${ext} ${w}w`).join(", ");
}

function picture(p, { sizes, eager = false, cls = "" }) {
  const fallback = p.widths.includes(800) ? 800 : p.widths[p.widths.length - 1];
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<picture${cls ? ` class="${cls}"` : ""}>` +
    `<source type="image/webp" srcset="${srcset(p, "webp")}" sizes="${sizes}" />` +
    `<img src="assets/img/photos/${p.group}/${p.name}-${fallback}.jpg" srcset="${srcset(p, "jpg")}" ` +
    `sizes="${sizes}" width="${p.width}" height="${p.height}" ${loading} decoding="async" ` +
    `${attr("alt", p.alt.en, p.alt.he, p.alt.ru)} />` +
    `</picture>`;
}

// Equal 4:3 tiles; tapping one opens the photo viewer (main.js).
function photoGrid(group, list = photos(group)) {
  if (!list.length) return "";
  const sizes = "(max-width: 860px) 50vw, 340px";
  const items = list.map((p) =>
    `  <li data-reveal><button class="photo-tile" type="button" data-gallery="${group}" ` +
    `data-webp="${srcset(p, "webp")}" data-jpg="${srcset(p, "jpg")}" ` +
    `data-src="assets/img/photos/${p.group}/${p.name}-${p.widths[p.widths.length - 1]}.jpg" ` +
    `data-width="${p.width}" data-height="${p.height}" ` +
    `data-caption="${esc(pick(p.caption.en, p.caption.he, p.caption.ru))}">` +
    picture(p, { sizes }) + `</button></li>`);
  return `<ul class="photo-grid">\n${items.join("\n")}\n</ul>`;
}

// Under a project's first photos; the rest are hidden until it is tapped
// (main.js). Without scripts all photos show and the button stays hidden.
const showMoreButton = (label) =>
  `\n<button class="btn btn--line photo-more" type="button" data-show-more>${esc(label)}</button>`;

// ---------------------------------------------------------------- projects
// One folder per project in assets/projects/<slug>/: the photos (already
// web-ready, used as they are) and a project.md whose part between the ---
// lines holds order, title_en/he, description_en/he (no place names) and the photo
// list with alt_en/alt_he. Shown by `order`, then folders without one.
const PROJECTS_DIR = "assets/projects";

// Width and height of a JPEG, read from its header (no image tools needed,
// so this also works in the deploy).
function jpegSize(file) {
  const b = readFileSync(file);
  for (let i = 2; i + 9 < b.length; ) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${file}: could not read the photo size`);
}

function projects() {
  if (!existsSync(join(root, PROJECTS_DIR))) return [];
  return readdirSync(join(root, PROJECTS_DIR), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const slug = d.name;
      const dir = `${PROJECTS_DIR}/${slug}`;
      if (!existsSync(join(root, dir, "project.md"))) { warn(`${dir} has no project.md — skipped`); return null; }
      const front = read(`${dir}/project.md`).match(/^---\n([\s\S]*?)\n---/);
      if (!front) { warn(`${dir}/project.md needs its details between --- lines`); return null; }
      const cfg = parseYaml(front[1]);
      if (!cfg.title_en || !cfg.title_he) warn(`${dir}/project.md needs title_en and title_he`);
      const listed = Array.isArray(cfg.photos) ? cfg.photos : [];
      const files = readdirSync(join(root, dir)).filter((f) => /\.jpe?g$/i.test(f));
      files.filter((f) => !listed.some((p) => p.file === f))
        .forEach((f) => warn(`${dir}/${f} is not listed in project.md — not shown`));
      const photos = listed.map((p) => {
        if (!files.includes(p.file)) { warn(`${dir}/${p.file} is listed but missing`); return null; }
        if (!p.alt_en || !p.alt_he) warn(`${dir}/${p.file} needs alt_en and alt_he`);
        // Small tile copy from tools/make-project-tiles.mjs, if made.
        const tile = `${dir}/tiles/${p.file}`;
        const hasTile = existsSync(join(root, tile));
        if (!hasTile) warn(`${tile} is missing — run ./build.sh (the tile shows the full photo)`);
        return { src: `${dir}/${p.file}`, ...jpegSize(join(root, dir, p.file)),
          tile: hasTile ? { src: tile, ...jpegSize(join(root, tile)) } : null,
          // Russian: the photo's own alt_ru if it has one, else the project's title.
          alt: { en: p.alt_en || "", he: p.alt_he || p.alt_en || "", ru: p.alt_ru || cfg.title_ru || "" } };
      }).filter(Boolean);
      const order = Number(cfg.order);
      return { slug, order: Number.isFinite(order) && cfg.order !== undefined ? order : Infinity, cfg, photos };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

let PROJECTS;
const allProjects = () => PROJECTS || (PROJECTS = projects());

// A project photo named in content/home.yml ({ project, photo }).
function projectPhoto(ref) {
  const project = allProjects().find((p) => p.slug === ref.project);
  const photo = project && project.photos.find((p) => p.src.endsWith("/" + ref.photo));
  if (!photo) throw new Error(`content/home.yml: no photo ${ref.project}/${ref.photo} (is it listed in that project's project.md?)`);
  return { project, photo };
}

// <img> for a project photo: the small tile copy on small slots, the full
// photo where the slot is big enough to need it.
function projectImg(photo, sizes, eager = false) {
  const alt = pick(photo.alt.en, photo.alt.he, photo.alt.ru);
  const small = photo.tile || photo;
  const set = photo.tile ? ` srcset="${photo.tile.src} ${photo.tile.width}w, ${photo.src} ${photo.width}w" sizes="${sizes}"` : "";
  return `<img src="${small.src}"${set} width="${photo.width}" height="${photo.height}" ` +
    `${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="${esc(alt)}" />`;
}

// Equal 4:3 tiles like photoGrid, showing the small tile copy; tapping opens
// the full photo. The first `limit` show; the rest wait behind "Show all
// photos" (hidden, so not downloaded). `eager` tiles (top of the page) load
// straight away.
function projectGrid(project, limit, eager) {
  const extra = project.photos.length > limit;
  const items = project.photos.map((p, i) => {
    const alt = pick(p.alt.en, p.alt.he, p.alt.ru);
    const img = p.tile || p;
    return `  <li${extra && i >= limit ? ' class="photo-extra"' : " data-reveal"}><button class="photo-tile" type="button" ` +
      `data-gallery="project-${project.slug}" data-webp="" data-jpg="" data-src="${p.src}" ` +
      `data-width="${p.width}" data-height="${p.height}" data-caption="${esc(alt)}">` +
      `<img src="${img.src}" width="${img.width}" height="${img.height}"${i < eager ? "" : ' loading="lazy"'} ` +
      `decoding="async" alt="${esc(alt)}" /></button></li>`;
  });
  const grid = `<ul class="photo-grid">\n${items.join("\n")}\n</ul>`;
  return extra ? grid + showMoreButton(t(LANG, "projects.showAll")) : grid;
}

// ---------------------------------------------------------------- blocks
const BLOCKS = {
  // Title, description, canonical address, language twins and social-sharing
  // tags — all in the page's own language.
  head(page) {
    const title = t(LANG, `meta.${page.key}Title`);
    const desc = t(LANG, `meta.${page.key}Description`);
    const url = pageUrl(page);
    const img = SITE + SOCIAL_IMAGE;
    const imgAlt = t(LANG, "meta.socialImageAlt");
    return [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(desc)}" />`,
      `<link rel="canonical" href="${url}" />`,
      ...Object.keys(LANGS).map((l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(page, l)}" />`),
      `<link rel="alternate" hreflang="x-default" href="${pageUrl(page, "en")}" />`,
      ``,
      `<!-- Open Graph / social sharing (WhatsApp, Facebook, …) -->`,
      `<meta property="og:site_name" content="${esc(t(LANG, "nav.brand"))}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:image" content="${img}" />`,
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:image:alt" content="${esc(imgAlt)}" />`,
      `<meta property="og:locale" content="${LANGS[LANG].locale}" />`,
      ...others(LANG).map((l) => `<meta property="og:locale:alternate" content="${LANGS[l].locale}" />`),
      ``,
      `<!-- Twitter / X card -->`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      `<meta name="twitter:image" content="${img}" />`,
      `<meta name="twitter:image:alt" content="${esc(imgAlt)}" />`,
    ].join("\n");
  },

  // Google "local business" data, built from content/contact.yml. The
  // description is in the page's own language; googleMaps ties the website
  // to the business's profile on Google Maps.
  jsonld() {
    const a = contact.address;
    const data = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": SITE + "#business",
      name: t("en", "nav.brand"),
      alternateName: t("he", "nav.brand"),
      description: t(LANG, "meta.homeDescription"),
      url: SITE,
      image: SITE + SOCIAL_IMAGE,
      telephone: contact.people[0].phoneHref,
      email: contact.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: a.streetEn,
        addressLocality: a.cityEn,
        addressCountry: a.countryCode,
      },
      ...(contact.founder ? { founder: { "@type": "Person", name: contact.founder } } : {}),
      ...(contact.googleMaps ? { hasMap: contact.googleMaps } : {}),
      sameAs: [contact.instagram, contact.googleMaps].filter(Boolean),
    };
    const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
    return `<script type="application/ld+json">\n${json}\n</script>`;
  },

  // The small icons used across the pages, defined once per page.
  icons() {
    const sym = (id, body) => `  <symbol id="${id}" viewBox="0 0 24 24">${body}</symbol>`;
    const line = (d) => `<path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
    return [
      `<svg width="0" height="0" class="svg-defs" aria-hidden="true" focusable="false">`,
      sym("i-wa", `<path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.41z"/>`),
      sym("i-phone", line("M5 4.5h3.2l1.6 4-2 1.3a11 11 0 0 0 6.4 6.4l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z")),
      sym("i-arrow-l", line("M19 12H5m6-6-6 6 6 6")),
      sym("i-arrow-r", line("M5 12h14m-6-6 6 6-6 6")),
      sym("i-chip-l", line("M17 17 7 7m0 8V7h8")),
      sym("i-chip-r", line("M7 17 17 7m-8 0h8v8")),
      sym("i-mail", line("M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6")),
      sym("i-pin", line("M12 21s-6.5-5.9-6.5-11a6.5 6.5 0 0 1 13 0c0 5.1-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z")),
      sym("i-ig", line("M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4ZM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17.2 6.8h.01")),
      sym("i-star", line("m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8Z")),
      `</svg>`,
    ].join("\n");
  },

  // The floating top bar: logo, menu, the three language links, and call /
  // WhatsApp buttons that go to whoever answers in this page's language.
  // On phones the links live in the full-screen menu (opened by main.js).
  header(page) {
    const isHome = page.key === "home";
    const me = answerer();
    const links = [
      [isHome ? "#about" : "index.html#about", "nav.about"],
      [isHome ? "#services" : "index.html#services", "nav.services"],
      ["projects.html", "nav.projects", page.key === "projects"],
      [isHome ? "#contact" : "index.html#contact", "nav.contact"],
      ["workshop.html", "nav.workshop", page.key === "workshop"],
      ["in-the-workshop.html", "nav.inWorkshop", page.key === "inWorkshop"],
    ];
    const cur = (on) => (on ? ' aria-current="page"' : "");
    const langs = Object.keys(LANGS).map((l) =>
      `<a href="${twinHref(page, l)}" hreflang="${l}" lang="${l}" aria-label="${LANGS[l].name}"` +
      `${l === LANG ? ' aria-current="true"' : ""}>${LANGS[l].label}</a>`).join("");
    const phones = contact.people.map((_, i) => person(i)).map((p) =>
      `${esc(p.name)} ${esc(p.langs)} <a class="num" href="tel:${esc(p.phoneHref)}">${esc(p.phoneDisplay)}</a>`).join("<br />");
    return [
      `<header class="hdr${isHome ? "" : " is-light"}" data-header>`,
      `  <div class="hdr__bar wrap">`,
      `    <a class="hdr__brand" href="${isHome ? "#top" : "index.html"}">${logo()}<span class="sr-only">${tr("nav.brand")}, ${tr("home.homeAria")}</span></a>`,
      `    <nav class="hdr__nav" aria-label="${tr("home.navAria")}">`,
      ...links.map(([href, key, on]) => `      <a href="${href}"${cur(on)}>${tr(key)}</a>`),
      `    </nav>`,
      `    <div class="hdr__actions">`,
      `      <div class="lang" role="group" aria-label="${tr("home.langAria")}">${langs}</div>`,
      `      <a class="hdr__call" href="tel:${esc(me.phoneHref)}">${icon("i-phone")}<span class="hdr__call-txt">${tr(`home.call${me.n}`)}</span></a>`,
      `      <a class="hdr__wa" href="${waHref(me)}" target="_blank" rel="noopener">${icon("i-wa")}<span>WhatsApp</span></a>`,
      `      <button class="hdr__menu" type="button" data-menu-btn aria-expanded="false" aria-controls="menu" ${aria("nav.menuAria")}><span></span><span></span></button>`,
      `    </div>`,
      `  </div>`,
      `  <div class="menu on-dark" id="menu" data-menu inert>`,
      `    <nav class="menu__nav wrap" aria-label="${tr("nav.menuAria")}">`,
      ...links.map(([href, key, on], i) => `      <a href="${href}"${cur(on)} style="--i:${i}">${tr(key)}${arrow()}</a>`),
      `    </nav>`,
      `    <div class="menu__foot wrap">`,
      `      <a class="btn btn--block" href="${waHref(me)}" target="_blank" rel="noopener">${icon("i-wa")} ${tr("whatsapp.cta")}</a>`,
      `      <p class="muted">${phones}</p>`,
      `    </div>`,
      `  </div>`,
      `</header>`,
    ].join("\n");
  },

  // ------------------------------------------------------------ home page
  // Top of the home page: the big photo (content/home.yml "hero"), the
  // headline, who answers, and the WhatsApp button.
  "home-hero"() {
    const me = answerer();
    const { photo } = projectPhoto(home.hero);
    const lines = list("home.heroLines").map((l, i) =>
      `      <span class="hero__line" style="--i:${i}"><span>${esc(l)}</span></span>`);
    const chips = [1, 2, 3].map((n) => {
      const value = t(LANG, `about.stat${n}Value`), label = t(LANG, `about.stat${n}Label`);
      return `      <li>${esc(/^\d+$/.test(value) ? `${value} ${label}` : `${value} · ${label}`)}</li>`;
    });
    return [
      `<section class="hero on-dark" data-hero aria-labelledby="hero-h">`,
      `  <div class="hero__media"><div class="hero__photo">${projectImg(photo, "(min-width: 1024px) 55vw, 100vw", true)}</div><span class="hero__kerf" aria-hidden="true"></span></div>`,
      `  <div class="hero__copy">`,
      `    <h1 id="hero-h" class="hero__h">`,
      ...lines,
      `    </h1>`,
      `    <p class="hero__sub">${tr("hero.subtitle")}</p>`,
      `    <p class="hero__rating"><span class="hero__dot" aria-hidden="true"></span><span>${tr("home.answeredBy")} <b>${esc(me.name)}</b> <span class="muted">${esc(me.langs)}</span></span> · <a class="num" href="tel:${esc(me.phoneHref)}">${esc(me.phoneDisplay)}</a></p>`,
      `    <div class="hero__ctas" data-hero-cta>`,
      `      <a class="btn btn--block hero__wa" href="${waHref(me)}" target="_blank" rel="noopener">${icon("i-wa")} ${tr("whatsapp.cta")}</a>`,
      `      <a class="link-arrow hero__alt" href="#contact">${tr("hero.ctaContact")} ${arrow()}</a>`,
      `    </div>`,
      `    <ul class="hero__chips">`,
      ...chips,
      `    </ul>`,
      `  </div>`,
      `</section>`,
    ].join("\n");
  },

  // The five small cards under the top photo (home.trust). A title that
  // starts with a number counts up when it scrolls into view.
  "home-trust"() {
    const items = list("home.trust").map((item, i) => {
      const m = String(item.title).match(/^(\d+)(.*)$/);
      const title = m ? `<span class="num" data-count="${m[1]}">${m[1]}</span>${esc(m[2])}` : esc(item.title);
      return `    <li class="trust__item" data-reveal style="--i:${i}"><p class="trust__h">${title}</p><p class="trust__p">${esc(item.text)}</p></li>`;
    });
    return [`<section class="trust" aria-label="${tr("home.trustAria")}">`, `  <ul class="wrap trust__list">`, ...items, `  </ul>`, `</section>`].join("\n");
  },

  // "What we make": eight photo cards (photos: content/home.yml "cards";
  // words: home.cards). Each opens its project on the Projects page.
  "home-services"() {
    const words = list("home.cards");
    if (words.length !== home.cards.length) warn(`home.cards has ${words.length} text(s) but content/home.yml lists ${home.cards.length} photo card(s)`);
    const cards = home.cards.slice(0, words.length).map((card, i) => {
      const { project, photo } = projectPhoto(card);
      const size = ["big", "wide", "tall"].includes(card.size) ? ` svc__card--${card.size}` : "";
      const sizes = card.size === "big" ? "(min-width: 1024px) 600px, 80vw" : "(min-width: 1024px) 300px, 80vw";
      return [
        `    <a class="svc__card frame${size}" href="projects.html#${project.slug}" data-reveal style="--i:${i}">`,
        `      <div class="svc__img" data-drift>${projectImg(photo, sizes)}</div>`,
        `      <span class="svc__chip" aria-hidden="true">${icon(rtl() ? "i-chip-l" : "i-chip-r")}</span>`,
        `      <div class="svc__txt"><h3>${esc(words[i].title)}</h3><p>${esc(words[i].text)}</p></div>`,
        `    </a>`,
      ].join("\n");
    });
    const also = list("home.alsoList").map((x) => `<li><a href="#contact" data-preset="${esc(x)}">${esc(x)}${arrow()}</a></li>`);
    return [
      `<section class="section svc" id="services" aria-labelledby="svc-h">`,
      `  <div class="wrap"><div class="sec-head">`,
      `    <h2 id="svc-h" data-rise><span class="line">${tr("services.eyebrow")}</span></h2>`,
      `    <p data-reveal>${tr("services.title")}</p>`,
      `    <div class="tape"></div>`,
      `  </div></div>`,
      `  <div class="svc__rail" tabindex="0" aria-label="${tr("home.railAria")}">`,
      ...cards,
      `  </div>`,
      `  <div class="wrap svc__more" data-reveal><p>${tr("home.also")}</p><ul>${also.join("")}</ul></div>`,
      `</section>`,
    ].join("\n");
  },

  // "Recent work": a few tiles with filter buttons (content/home.yml
  // "gallery"). A tile opens its project on the Projects page.
  "home-gallery"() {
    const types = ["kitchens", "closets", "furniture", "commercial"];
    const label = (type) => tr("home.filter" + type[0].toUpperCase() + type.slice(1));
    const filters = [`<button type="button" aria-pressed="true" data-filter="all">${tr("home.filterAll")}</button>`,
      ...types.map((type) => `<button type="button" aria-pressed="false" data-filter="${type}">${label(type)}</button>`)];
    const tiles = home.gallery.map((tile, i) => {
      if (!types.includes(tile.type)) warn(`content/home.yml gallery: ${tile.project}/${tile.photo} needs type: ${types.join(" / ")}`);
      const { project, photo } = projectPhoto(tile);
      const c = project.cfg;
      const size = ["wide", "tall"].includes(tile.size) ? ` gal__item--${tile.size}` : "";
      return `      <li class="gal__item${size}" data-cat="${esc(tile.type)}" style="view-transition-name: gal${i}">` +
        `<a class="frame" href="projects.html#${project.slug}" data-uncover>${projectImg(photo, tile.size === "wide" ? "(min-width: 760px) 600px, 100vw" : "(min-width: 760px) 300px, 50vw")}` +
        `<span class="gal__cap">${both(c.title_en, c.title_he, c.title_ru)}</span></a></li>`;
    });
    return [
      `<section class="section gal" id="recent-work" aria-labelledby="recent-h" data-filters>`,
      `  <div class="wrap">`,
      `    <div class="sec-head">`,
      `      <h2 id="recent-h" data-rise><span class="line">${tr("projects.title")}</span></h2>`,
      `      <p data-reveal>${tr("projects.body")}</p>`,
      `      <div class="tape"></div>`,
      `    </div>`,
      `    <div class="gal__filters" role="group" aria-label="${tr("home.filterAria")}">${filters.join("")}</div>`,
      `    <ul class="gal__grid" aria-live="polite">`,
      ...tiles,
      `    </ul>`,
      `    <a class="link-arrow gal__all" href="projects.html">${tr("home.allProjects")} ${arrow()}</a>`,
      `  </div>`,
      `</section>`,
    ].join("\n");
  },

  // CNC cutting: what the machine does (workshop.cnc.points) and the offer
  // to carpenters, designers and contractors, with a WhatsApp quote button.
  // Used on the Workshop page (full) and as a band on the home page.
  cnc(page) {
    const isHome = page.key === "home";
    const me = answerer();
    const cards = list("workshop.cnc.points").map((x, i) =>
      `      <article class="card" data-reveal style="--i:${i}"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`);
    const H = isHome ? "h2" : "h2";
    return [
      `<section class="section on-sand cnc" id="cnc" aria-labelledby="cnc-h">`,
      `  <div class="wrap">`,
      `    <div class="sec-head">`,
      `      <p class="eyebrow">${tr("workshop.cnc.eyebrow")}</p>`,
      `      <${H} id="cnc-h" data-rise><span class="line">${tr("workshop.cnc.title")}</span></${H}>`,
      `      <p data-reveal>${tr("workshop.cnc.lede")}</p>`,
      `      <div class="tape"></div>`,
      `    </div>`,
      `    <div class="cards cnc__cards">`,
      ...cards,
      `    </div>`,
      `    <div class="cnc__trade" data-reveal>`,
      `      <div><h3>${tr("workshop.cnc.tradeTitle")}</h3><p>${tr("workshop.cnc.tradeBody")}</p></div>`,
      `      <div class="cnc__actions">`,
      `        <a class="btn" href="${waHref(me, t(LANG, "workshop.cnc.message"))}" target="_blank" rel="noopener">${icon("i-wa")} ${tr("workshop.cnc.cta")}</a>`,
      ...(isHome ? [`        <a class="link-arrow" href="workshop.html#cnc">${tr("workshop.cnc.more")} ${arrow()}</a>`] : []),
      `      </div>`,
      `    </div>`,
      `  </div>`,
      `</section>`,
    ].join("\n");
  },

  // The dark workshop band: a moving row of workshop photos (content/home.yml
  // "strip", shown twice so the row loops) and the equipment list.
  "home-workshop"() {
    const all = photos("process");
    const strip = [].concat(home.strip || []).map((name) => {
      const p = all.find((x) => x.name === name);
      if (!p) warn(`content/home.yml strip: no "process" photo named ${name}`);
      return p;
    }).filter(Boolean);
    const cell = (p, again) => `      <li class="ws__ph frame"${again ? ' aria-hidden="true"' : ""}>${picture(p, { sizes: "(max-width: 560px) 62vw, 352px" })}</li>`;
    const gear = list("workshop.equipment").map((e, i) =>
      `      <li data-reveal style="--i:${i % 2}"><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p></li>`);
    return [
      `<section class="section ws on-dark" id="workshop" aria-labelledby="ws-h">`,
      `  <div class="wrap"><div class="sec-head">`,
      `    <h2 id="ws-h" data-rise><span class="line">${tr("workshop.title")}</span></h2>`,
      `    <p data-reveal>${tr("workshop.intro")}</p>`,
      `    <div class="tape"></div>`,
      `  </div></div>`,
      `  <div class="ws__strip" data-loop aria-label="${tr("inWorkshop.title")}">`,
      `    <ul class="ws__track">`,
      ...strip.map((p) => cell(p, false)),
      ...strip.map((p) => cell(p, true)),
      `    </ul>`,
      `  </div>`,
      `  <div class="wrap">`,
      `    <p class="ws__note">${tr("inWorkshop.note")}</p>`,
      `    <ul class="ws__eq">`,
      ...gear,
      `    </ul>`,
      `    <a class="link-arrow ws__more" href="workshop.html">${tr("hero.ctaWorkshop")} ${arrow()}</a>`,
      `  </div>`,
      `</section>`,
    ].join("\n");
  },

  // "Hello, I'm Tomas": the two portraits ("people" photos) with names,
  // languages and a WhatsApp link each.
  "home-team"() {
    const portraits = photos("people");
    const cards = contact.people.map((_, i) => {
      const p = person(i), photo = portraits[i];
      return [
        `      <article class="team__p" data-reveal style="--i:${i}">`,
        `        <div class="team__img frame" data-uncover style="--i:${i}">${photo ? picture(photo, { sizes: "(min-width: 900px) 224px, 176px" }) : ""}</div>`,
        `        <div>`,
        `          <h3>${tr(`contact.portrait${i + 1}Name`)}</h3>`,
        `          <p class="team__role">${tr(`home.teamRole${i + 1}`)}</p>`,
        ...(i === 0 ? [`          <p>${tr("about.p3")}</p>`] : []),
        `          <a class="team__link" href="${waHref(p)}" target="_blank" rel="noopener" ${aria("contact.whatsappAria")}>${icon("i-wa")}<span class="num">${esc(p.phoneDisplay)}</span></a>`,
        `        </div>`,
        `      </article>`,
      ].join("\n");
    });
    return [
      `<section class="section team" id="about" aria-labelledby="team-h">`,
      `  <div class="wrap">`,
      `    <div class="sec-head">`,
      `      <h2 id="team-h" data-rise><span class="line">${tr("about.title")}</span></h2>`,
      `      <p data-reveal>${tr("about.p1")}</p>`,
      `      <div class="tape"></div>`,
      `    </div>`,
      `    <p class="team__more" data-reveal>${tr("about.p2")}</p>`,
      `    <div class="team__grid">`,
      ...cards,
      `    </div>`,
      // The "Google reviews" button, under the two portraits.
      ...(contact.googleProfile ? [`    ${reviewsLink("btn btn--line team__reviews", " data-reveal")}`] : []),
      `  </div>`,
      `</section>`,
    ].join("\n");
  },

  // Contact: phones, email, address — and "Start your project", three quick
  // choices that write a WhatsApp message in the page's language (main.js
  // fills it in; without scripts the button still opens WhatsApp).
  "home-contact"() {
    const me = answerer();
    const people = contact.people.map((_, i) => person(i)).sort((a, b) => (b.n === me.n) - (a.n === me.n));
    const chips = (items, name) => items.map((x) =>
      `<button type="button" class="pick" data-${name}="${esc(x)}" aria-pressed="false">${esc(x)}</button>`).join("");
    const items = [...list("services.makeList"), t(LANG, "services.repairTitle"), t(LANG, "home.starterOther")];
    const firstMessage = t(LANG, "home.starterMsgPlain").replace("{name}", me.name).replace("{stage}", "");
    return [
      `<section class="section cta on-dark" id="contact" aria-labelledby="cta-h">`,
      `  <div class="cta__grain" aria-hidden="true"></div>`,
      `  <div class="wrap cta__grid">`,
      `    <div class="cta__copy">`,
      `      <h2 id="cta-h" class="h-lg" data-rise><span class="line">${tr("contact.title")}</span></h2>`,
      `      <p class="lede muted" data-reveal>${tr("contact.body")}</p>`,
      `      <a class="btn cta__wa" href="${waHref(me)}" target="_blank" rel="noopener" data-reveal style="--i:1">${icon("i-wa")} ${tr("whatsapp.cta")}</a>`,
      `      <ul class="cta__alts" data-reveal style="--i:2">`,
      ...people.map((p) => `        <li><a href="tel:${esc(p.phoneHref)}">${icon("i-phone")}<span>${esc(p.name)} ${esc(p.langs)} <span class="num">${esc(p.phoneDisplay)}</span></span></a></li>`),
      `        <li><a href="mailto:${esc(contact.email)}">${icon("i-mail")}<span class="num">${esc(contact.email)}</span></a></li>`,
      `        <li><span class="row">${icon("i-pin")}<address>${esc(address(LANG, false))}</address></span></li>`,
      `        <li><a href="${esc(contact.instagram)}" target="_blank" rel="noopener">${icon("i-ig")}<span class="num">${esc(contact.instagramHandle)}</span></a></li>`,
      ...(contact.googleProfile ? [`        <li>${reviewsLink()}</li>`] : []),
      `      </ul>`,
      `    </div>`,
      `    <div class="cta__card" data-reveal style="--i:1">`,
      `      <h3 class="cta__card-h">${tr("home.starterTitle")}</h3>`,
      `      <p class="cta__card-p">${tr("home.starterNote")}</p>`,
      `      <form class="lf" id="start" data-starter data-msg-item="${tr("home.starterMsgItem")}" data-msg-plain="${tr("home.starterMsgPlain")}" novalidate>`,
      `        <fieldset class="lf__field"><legend>${tr("home.starterQ1")}</legend><div class="picks">${chips(items, "item")}</div></fieldset>`,
      `        <fieldset class="lf__field"><legend>${tr("home.starterQ2")}</legend><div class="picks">${chips(list("home.starterStages"), "stage")}</div></fieldset>`,
      `        <fieldset class="lf__field"><legend>${tr("home.starterQ3")}</legend><div class="who">`,
      ...people.map((p) => `          <button type="button" data-person="${p.wa}" data-name="${esc(p.name)}" aria-pressed="${p.n === me.n}"><b>${esc(p.name)}</b><small>${esc(p.langs)}</small>` +
        `${p.n === me.n ? `<span class="badge">${tr("home.starterSpeaks")}</span>` : ""}</button>`),
      `        </div></fieldset>`,
      `        <div class="lf__field"><label for="msg">${tr("home.starterMsgLabel")}</label><textarea id="msg" rows="3">${esc(firstMessage)}</textarea></div>`,
      `        <a class="btn btn--block lf__submit" id="send" href="${waHref(me, firstMessage)}" target="_blank" rel="noopener">${icon("i-wa")} ${tr("whatsapp.cta")}</a>`,
      `      </form>`,
      `    </div>`,
      `  </div>`,
      `</section>`,
    ].join("\n");
  },

  // The WhatsApp / call bar that slides up on phones once the top of the
  // page has scrolled away (main.js).
  dock() {
    const me = answerer();
    return `<div class="dock" data-fab>` +
      `<a class="dock__wa" href="${waHref(me)}" target="_blank" rel="noopener">${icon("i-wa")}<span>${tr("whatsapp.cta")}</span></a>` +
      `<a class="dock__call" href="tel:${esc(me.phoneHref)}">${icon("i-phone")}<span class="sr-only">${tr(`home.call${me.n}`)}, ${esc(me.phoneDisplay)}</span></a>` +
      `</div>`;
  },

  "workshop-equipment"() {
    const cards = list("workshop.equipment").map((e) => [
      `  <article class="card" data-reveal>`,
      `    <h3>${esc(e.title)}</h3>`,
      `    <p>${esc(e.description)}</p>`,
      `  </article>`,
    ].join("\n"));
    return `<div class="cards">\n${cards.join("\n")}\n</div>`;
  },

  "workshop-photos"() {
    return photoGrid("workshop");
  },

  "spray-points"() {
    const items = list("workshop.spray.points").map((x) => `  <li>${esc(x)}</li>`);
    return `<ul class="fact-list">\n${items.join("\n")}\n</ul>`;
  },

  "spray-photos"() {
    return photoGrid("spray");
  },

  // "In the workshop": one heading + grid per section (section: in
  // photos.yml), in this order. The viewer still browses all of them.
  "process-photos"() {
    const list = photos("process");
    const sections = ["materials", "assembly", "finished"];
    list.filter((p) => !sections.includes(p.section))
      .forEach((p) => warn(`photo process/${p.name} needs section: ${sections.join(" / ")}`));
    return sections.map((key) => {
      const group = list.filter((p) => p.section === key);
      if (!group.length) return "";
      return `<h2 class="section-sub">${tr(`inWorkshop.${key}Title`)}</h2>\n` + photoGrid("process", group);
    }).filter(Boolean).join("\n");
  },

  // One block per project folder (assets/projects/), first 6 photos each.
  "project-list"() {
    return allProjects().map((project, n) => {
      const c = project.cfg;
      const lines = [`<article class="project" id="${project.slug}">`,
        `  <h2 class="project-title">${both(c.title_en, c.title_he, c.title_ru)}</h2>`];
      if (c.description_en) lines.push(`  <p class="project-text">${both(c.description_en, c.description_he || c.description_en, c.description_ru)}</p>`);
      lines.push(projectGrid(project, 6, n === 0 ? 3 : 0).replace(/^/gm, "  "), `</article>`);
      return lines.join("\n");
    }).join("\n");
  },
  "instagram-cta"() {
    return `<a class="btn" href="${esc(contact.instagram)}" target="_blank" rel="noopener">${icon("i-ig")} ${tr("projects.instagramCta")}</a>\n` +
      `<p class="instagram-handle"><a href="${esc(contact.instagram)}" target="_blank" rel="noopener" dir="ltr">${esc(contact.instagramHandle)}</a></p>`;
  },

  // Photo viewer, opened by tapping a gallery tile (see main.js).
  gallery() {
    return [
      `<div class="gallery" id="gallery" hidden role="dialog" aria-modal="true" data-i18n-aria="gallery.label">`,
      `  <button class="gallery-close" id="gallery-close" type="button" data-i18n-aria="gallery.close">×</button>`,
      `  <button class="gallery-nav gallery-prev" id="gallery-prev" type="button" data-i18n-aria="gallery.prev">‹</button>`,
      `  <figure class="gallery-figure">`,
      `    <picture><source id="gallery-source" type="image/webp" /><img id="gallery-img" alt="" /></picture>`,
      `    <figcaption id="gallery-caption"></figcaption>`,
      `  </figure>`,
      `  <button class="gallery-nav gallery-next" id="gallery-next" type="button" data-i18n-aria="gallery.next">›</button>`,
      `</div>`,
    ].join("\n");
  },

  footer(page) {
    const isHome = page.key === "home";
    const me = answerer();
    const people = contact.people.map((_, i) => person(i)).sort((a, b) => (b.n === me.n) - (a.n === me.n));
    const links = [
      [isHome ? "#about" : "index.html#about", "nav.about"],
      [isHome ? "#services" : "index.html#services", "nav.services"],
      ["projects.html", "nav.projects"],
      ["workshop.html", "nav.workshop"],
      ["in-the-workshop.html", "nav.inWorkshop"],
      [isHome ? "#contact" : "index.html#contact", "nav.contact"],
    ];
    return [
      `<footer class="ftr on-dark">`,
      `  <div class="wrap ftr__grid">`,
      `    <div class="ftr__brand"><p class="ftr__name">${logo()}<span class="sr-only">${tr("nav.brand")}</span></p><p class="muted">${tr("about.p2")}</p></div>`,
      `    <div><h2 class="ftr__h">${tr("contact.eyebrow")}</h2><ul class="ftr__list">`,
      ...people.map((p) => `      <li><a href="${waHref(p)}" target="_blank" rel="noopener">${icon("i-wa")}<span>${esc(p.name)} ${esc(p.langs)} <span class="num">${esc(p.phoneDisplay)}</span></span></a></li>`),
      `      <li><a href="mailto:${esc(contact.email)}">${icon("i-mail")}<span class="num">${esc(contact.email)}</span></a></li>`,
      `    </ul></div>`,
      `    <div><h2 class="ftr__h">${tr("workshop.eyebrow")}</h2><ul class="ftr__list">`,
      `      <li class="muted"><address>${esc(address(LANG))}</address></li>`,
      `      <li><a href="${esc(contact.instagram)}" target="_blank" rel="noopener">${icon("i-ig")}<span class="num">${esc(contact.instagramHandle)}</span></a></li>`,
      ...(contact.googleProfile ? [`      <li>${reviewsLink()}</li>`] : []),
      `    </ul></div>`,
      `    <div><h2 class="ftr__h">${tr("home.footerSite")}</h2><ul class="ftr__list">`,
      ...links.map(([href, key]) => `      <li><a href="${href}">${tr(key)}</a></li>`),
      `    </ul></div>`,
      `  </div>`,
      `  <div class="wrap ftr__base muted">`,
      `    <span>© <span class="num">${new Date().getFullYear()}</span> ${tr("nav.brand")} · ${tr("footer.rights")} · ${tr("footer.builtIn")}</span>`,
      `    <span class="footer-build">${tr("footer.updated")} <span class="num">${BUILD_TIME}</span></span>`,
      `  </div>`,
      `</footer>`,
    ].join("\n");
  },
};

const INLINE = {
  htmlAttrs: () => `lang="${LANG}" dir="${LANGS[LANG].dir}"`,
  siteUrl: () => SITE,
};

// "Last updated" stamp in the footer: YYYY.MM.DD HH:MM, build machine time.
const BUILD_TIME = (() => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
})();

// ---------------------------------------------------------------- render
function render(page, lang) {
  LANG = lang;
  let html = read(page.template);

  // Blocks keep the indentation of the comment that marks them.
  html = html.replace(/^([ \t]*)<!-- @([\w-]+) -->[ \t]*$/gm, (m, indent, name) => {
    if (!BLOCKS[name]) throw new Error(`${page.template}: unknown block @${name}`);
    const out = BLOCKS[name](page);
    return out ? out.replace(/^(?=.)/gm, indent) : `${indent}<!-- (${name}: nothing to show yet) -->`;
  });
  html = html.replace(/\{\{(\w+)\}\}/g, (m, name) => {
    if (!INLINE[name]) throw new Error(`${page.template}: unknown value {{${name}}}`);
    return INLINE[name](page);
  });
  // Leaf elements with data-i18n get their text in the page's language.
  html = html.replace(/<([a-z][a-z0-9]*)\b([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>[^<]*<\/\1>/g,
    (m, tag, before, key, after) => `<${tag}${before}${after}>${tr(key)}</${tag}>`);
  html = html.replace(/\sdata-i18n-aria="([^"]+)"/g, (m, key) => " " + aria(key));

  const leftover = html.match(/\{\{\w+\}\}|<!-- @[\w-]+ -->|data-i18n/);
  if (leftover) throw new Error(`${page.template}: could not fill "${leftover[0]}"`);

  // Hebrew and Russian pages sit one folder down: point asset paths up a level.
  if (LANGS[lang].folder) html = html.replace(/(["'(,\s])assets\//g, "$1../assets/");

  const out = LANGS[lang].folder + page.out;
  const banner = `<!-- AUTO-GENERATED by tools/build-pages.mjs from ${page.template} — do not edit.\n` +
    `     Edit the template or the text in content/, then run ./build.sh -->\n`;
  mkdirSync(dirname(join(root, out)), { recursive: true });
  writeFileSync(join(root, out), html.replace(/^(<!DOCTYPE html>\n)/i, `$1${banner}`));
  return out;
}

// robots.txt: allow everything and point to the sitemap.
function writeRobots() {
  writeFileSync(join(root, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
}

// sitemap.xml: every page in every language, each listing its language twins.
function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.flatMap((page) => Object.keys(LANGS).map((lang) => [
    `  <url>`,
    `    <loc>${pageUrl(page, lang)}</loc>`,
    ...Object.keys(LANGS).map((l) =>
      `    <xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(page, l)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(page, "en")}" />`,
    `    <lastmod>${today}</lastmod>`,
    `  </url>`,
  ].join("\n")));
  writeFileSync(join(root, "sitemap.xml"), [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!-- AUTO-GENERATED by tools/build-pages.mjs — do not edit. -->`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n"));
}

// Flag keys that exist in one language only.
for (const a of Object.keys(LANGS)) {
  for (const b of others(a)) {
    for (const key of Object.keys(text[a])) {
      if (key !== "dir" && key !== "langName" && !(key in text[b])) {
        warn(`"${key}" is in ${LANGS[a].name} but missing from ${LANGS[b].name}`);
      }
    }
  }
}

const written = Object.keys(LANGS).flatMap((lang) => PAGES.map((page) => render(page, lang)));
writeSitemap();
writeRobots();
warnings.forEach((w) => console.warn("! " + w));
console.log(`Wrote ${written.join(", ")}, sitemap.xml and robots.txt (built ${BUILD_TIME})`);
