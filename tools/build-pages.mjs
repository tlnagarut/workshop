/* ============================================================================
 * Builds the pages from the templates in templates/ and the text in content/,
 * once per language, plus sitemap.xml and robots.txt (addresses come from
 * siteUrl in content/contact.yml). Run:
 *   node tools/build-pages.mjs        (invoked by build.sh and the deploy)
 *
 *   English: index.html, workshop.html, in-the-workshop.html, projects.html
 *   Hebrew:  he/index.html, he/workshop.html, … (right-to-left)
 *
 * Each page has its own address, title and description in its language, and
 * hreflang links to its twin in the other language. All text is written into
 * the HTML itself, so search engines and AI assistants see a complete page
 * without running any script. The language button is a plain link to the
 * same page in the other language.
 *
 * Sources:
 *   content/about.en.yml, about.he.yml      site text (keys like hero.title)
 *   content/workshop.en.yml, workshop.he.yml Workshop page (keys workshop.*)
 *   content/contact.yml                      phones, email, address, links
 *   content/photos.yml + assets/img/photos/manifest.json   photos
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
const workshop = { en: loadYaml("content/workshop.en.yml"), he: loadYaml("content/workshop.he.yml") };
const text = {
  en: { ...flatten(loadYaml("content/about.en.yml"), "", {}), ...flatten(workshop.en, "workshop", {}) },
  he: { ...flatten(loadYaml("content/about.he.yml"), "", {}), ...flatten(workshop.he, "workshop", {}) },
};
const photoConfig = existsSync(join(root, "content/photos.yml")) ? loadYaml("content/photos.yml") : {};
const manifestPath = "assets/img/photos/manifest.json";
const manifest = existsSync(join(root, manifestPath)) ? JSON.parse(read(manifestPath)) : {};

const SITE = contact.siteUrl.replace(/\/?$/, "/");
const SOCIAL_IMAGE = "assets/img/tlnagarut-custom-cabinets-solid-wood-doors-haifa.jpg";

// Hebrew pages live one folder down, in he/.
const LANGS = { en: { dir: "ltr", folder: "", locale: "en_US" }, he: { dir: "rtl", folder: "he/", locale: "he_IL" } };
const other = (lang) => (lang === "he" ? "en" : "he");

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
  if (lang === "he") { warn(`"${key}" is missing in Hebrew — showing English`); return t("en", key); }
  warn(`"${key}" is missing in English`);
  return "";
}

// Pick the English or Hebrew version for the page being rendered.
const pick = (en, he) => (LANG === "he" ? he : en);
const both = (en, he) => esc(pick(en, he));
const tr = (key) => esc(t(LANG, key));
const attr = (name, en, he) => `${name}="${esc(pick(en, he))}"`;
const aria = (key) => attr("aria-label", t("en", key), t("he", key));

// Pair up an English list with its Hebrew twin (workshop cards, spray facts).
function pairs(key) {
  const en = [].concat(text.en[key] || []);
  const he = [].concat(text.he[key] || []);
  if (en.length !== he.length) warn(`${key}: ${en.length} English item(s) but ${he.length} Hebrew`);
  return en.map((item, i) => [item, he[i] ?? item]);
}

const pageUrl = (page, lang = LANG) => SITE + LANGS[lang].folder + page.path;
// Link from one language's page to the other's (explicit index.html so it
// also works when the files are opened straight from disk).
const twinHref = (page) =>
  (LANG === "he" ? "../" : "he/") + (page.path || "index.html");
const address = (lang) => {
  const a = contact.address;
  return lang === "he"
    ? `${a.streetHe}, ${a.cityHe}, ${a.countryHe}`
    : `${a.streetEn}, ${a.cityEn}, ${a.countryEn}`;
};

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
      alt: { en: cfg.alt_en || "", he: cfg.alt_he || cfg.alt_en || "" },
      caption: { en: cfg.caption_en || cfg.alt_en || "", he: cfg.caption_he || cfg.alt_he || "" },
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
    `${attr("alt", p.alt.en, p.alt.he)} />` +
    `</picture>`;
}

// Equal 4:3 tiles; tapping one opens the photo viewer (main.js).
function photoGrid(group, list = photos(group)) {
  if (!list.length) return "";
  const sizes = "(max-width: 860px) 50vw, 340px";
  const items = list.map((p) =>
    `  <li><button class="photo-tile" type="button" data-gallery="${group}" ` +
    `data-webp="${srcset(p, "webp")}" data-jpg="${srcset(p, "jpg")}" ` +
    `data-src="assets/img/photos/${p.group}/${p.name}-${p.widths[p.widths.length - 1]}.jpg" ` +
    `data-width="${p.width}" data-height="${p.height}" ` +
    `data-caption="${esc(pick(p.caption.en, p.caption.he))}">` +
    picture(p, { sizes }) + `</button></li>`);
  return `<ul class="photo-grid">\n${items.join("\n")}\n</ul>`;
}

// Under a project's first photos; the rest are hidden until it is tapped
// (main.js). Without scripts all photos show and the button stays hidden.
const showMoreButton = (label) =>
  `\n<button class="btn btn-outline photo-more" type="button" data-show-more>${esc(label)}</button>`;

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
          alt: { en: p.alt_en || "", he: p.alt_he || p.alt_en || "" } };
      }).filter(Boolean);
      const order = Number(cfg.order);
      return { slug, order: Number.isFinite(order) && cfg.order !== undefined ? order : Infinity, cfg, photos };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

// Equal 4:3 tiles like photoGrid, showing the small tile copy; tapping opens
// the full photo. The first `limit` show; the rest wait behind "Show all
// photos" (hidden, so not downloaded). `eager` tiles (top of the page) load
// straight away.
function projectGrid(project, limit, eager) {
  const extra = project.photos.length > limit;
  const items = project.photos.map((p, i) => {
    const alt = pick(p.alt.en, p.alt.he);
    const img = p.tile || p;
    return `  <li${extra && i >= limit ? ' class="photo-extra"' : ""}><button class="photo-tile" type="button" ` +
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
      `<link rel="alternate" hreflang="en" href="${pageUrl(page, "en")}" />`,
      `<link rel="alternate" hreflang="he" href="${pageUrl(page, "he")}" />`,
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
      `<meta property="og:locale:alternate" content="${LANGS[other(LANG)].locale}" />`,
      ``,
      `<!-- Twitter / X card -->`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      `<meta name="twitter:image" content="${img}" />`,
      `<meta name="twitter:image:alt" content="${esc(imgAlt)}" />`,
    ].join("\n");
  },

  // Google "local business" data, built from content/contact.yml.
  jsonld() {
    const a = contact.address;
    const data = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": SITE + "#business",
      name: t("en", "nav.brand"),
      alternateName: t("he", "nav.brand"),
      description: t("en", "meta.homeDescription"),
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
      sameAs: [contact.instagram],
    };
    const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
    return `<script type="application/ld+json">\n${json}\n</script>`;
  },

  header(page) {
    const home = page.key === "home";
    const link = (href, key, current) =>
      `      <a href="${href}"${current ? ' aria-current="page"' : ""} data-i18n="${key}"></a>`;
    return [
      `<header class="site-header" id="top">`,
      `  <div class="container nav">`,
      `    <a class="brand" href="${home ? "#top" : "index.html"}" data-i18n="nav.brand"></a>`,
      ``,
      `    <nav class="nav-links" id="nav-links" aria-label="Primary">`,
      link(home ? "#about" : "index.html#about", "nav.about"),
      link(home ? "#services" : "index.html#services", "nav.services"),
      link("projects.html", "nav.projects", page.key === "projects"),
      link(home ? "#contact" : "index.html#contact", "nav.contact"),
      link("workshop.html", "nav.workshop", page.key === "workshop"),
      link("in-the-workshop.html", "nav.inWorkshop", page.key === "inWorkshop"),
      `    </nav>`,
      ``,
      `    <button id="nav-toggle" class="nav-toggle" type="button" aria-expanded="false"`,
      `      aria-controls="nav-links" data-i18n-aria="nav.menuAria">`,
      `      <span></span><span></span><span></span>`,
      `    </button>`,
      ``,
      `    <a class="lang-toggle" href="${twinHref(page)}" hreflang="${other(LANG)}" lang="${other(LANG)}"`,
      `      data-i18n-aria="nav.langToggleAria" data-i18n="nav.langToggle"></a>`,
      `  </div>`,
      `</header>`,
    ].join("\n");
  },

  // The big home-page banner photo (first "hero" photo), if there is one.
  // Otherwise the plain wood background from the template shows.
  "hero-media"() {
    const [p] = photos("hero");
    return p ? picture(p, { sizes: "100vw", eager: true, cls: "hero-media" }) : "";
  },

  // The owners' portraits with their full names (photos: "people" group in
  // content/photos.yml; names: contact.portrait1Name / portrait2Name).
  "contact-portraits"() {
    const people = photos("people");
    if (!people.length) return "";
    const figures = people.map((p, i) => {
      const w = p.widths[p.widths.length - 1];
      const base = `assets/img/photos/people/${p.name}-${w}`;
      return [
        `  <figure class="portrait">`,
        `    <picture><source type="image/webp" srcset="${base}.webp" />` +
          `<img src="${base}.jpg" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" ` +
          `${attr("alt", p.alt.en, p.alt.he)} /></picture>`,
        `    <figcaption>${tr(`contact.portrait${i + 1}Name`)}</figcaption>`,
        `  </figure>`,
      ].join("\n");
    });
    return `<div class="portraits">\n${figures.join("\n")}\n</div>`;
  },

  // "Send a photo on WhatsApp" (next to the phone numbers in Contact): wa.me
  // link to the first (main) number in content/contact.yml, with a
  // pre-filled message in the page's language.
  "whatsapp-cta"() {
    const number = contact.people[0].phoneHref.replace(/\D/g, "");
    const href = `https://wa.me/${number}?text=${encodeURIComponent(t(LANG, "whatsapp.message"))}`;
    return `<a class="btn btn-whatsapp" href="${esc(href)}" target="_blank" rel="noopener">` +
      `<svg class="whatsapp-icon" width="22" height="22" aria-hidden="true" focusable="false"><use href="#ico-whatsapp"/></svg>` +
      `<span>${tr("whatsapp.cta")}</span></a>`;
  },

  // "What we make": the short list under the Services heading.
  "make-list"() {
    const items = pairs("services.makeList").map(([en, he]) => `  <li>${both(en, he)}</li>`);
    return items.length ? `<ul class="make-list">\n${items.join("\n")}\n</ul>` : "";
  },

  "contact-list"() {
    const people = contact.people.map((p, i) => [
      `    <div class="contact-person">`,
      `      <span class="contact-person-head">`,
      `        <span class="contact-person-name">${tr(`contact.person${i + 1}Name`)}</span>`,
      `        <span class="contact-person-langs">${tr(`contact.person${i + 1}Langs`)}</span>`,
      `      </span>`,
      `      <span class="contact-phone-row">`,
      `        <a class="contact-phone" href="tel:${esc(p.phoneHref)}" dir="ltr">${esc(p.phoneDisplay)}</a>`,
      `        <a class="whatsapp-link" href="https://wa.me/${p.phoneHref.replace(/\D/g, "")}" target="_blank" rel="noopener" ${aria("contact.whatsappAria")}>`,
      `          <svg class="whatsapp-icon" width="22" height="22" aria-hidden="true" focusable="false"><use href="#ico-whatsapp"/></svg>`,
      `        </a>`,
      `      </span>`,
      `    </div>`,
    ].join("\n"));
    return [
      `<ul class="contact-list">`,
      `  <li>`,
      `    <span class="contact-label">${tr("contact.phoneLabel")}</span>`,
      `    <div class="contact-phones">`,
      `      <div class="contact-people">`,
      people.join("\n").replace(/^/gm, "    "),
      `      </div>`,
      `      ${BLOCKS["whatsapp-cta"]()}`,
      `    </div>`,
      `  </li>`,
      `  <li>`,
      `    <span class="contact-label">${tr("contact.emailLabel")}</span>`,
      `    <a class="contact-value" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`,
      `  </li>`,
      `  <li>`,
      `    <span class="contact-label">${tr("contact.addressLabel")}</span>`,
      `    <address class="contact-value">${both(address("en"), address("he"))}</address>`,
      `  </li>`,
      `  <li>`,
      `    <span class="contact-label">${tr("contact.instagramLabel")}</span>`,
      `    <a class="contact-value" href="${esc(contact.instagram)}" target="_blank" rel="noopener" dir="ltr">${esc(contact.instagramHandle)}</a>`,
      `  </li>`,
      `</ul>`,
    ].join("\n");
  },

  "workshop-equipment"() {
    const cards = pairs("workshop.equipment").map(([en, he]) => [
      `  <article class="card">`,
      `    <h3>${both(en.title, he.title)}</h3>`,
      `    <p>${both(en.description, he.description)}</p>`,
      `  </article>`,
    ].join("\n"));
    return `<div class="cards">\n${cards.join("\n")}\n</div>`;
  },

  "workshop-photos"() {
    return photoGrid("workshop");
  },

  "spray-points"() {
    const items = pairs("workshop.spray.points").map(([en, he]) => `  <li>${both(en, he)}</li>`);
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
    return projects().map((project, n) => {
      const c = project.cfg;
      const lines = [`<article class="project" id="${project.slug}">`,
        `  <h2 class="project-title">${both(c.title_en, c.title_he)}</h2>`];
      if (c.description_en) lines.push(`  <p class="project-text">${both(c.description_en, c.description_he || c.description_en)}</p>`);
      lines.push(projectGrid(project, 6, n === 0 ? 3 : 0).replace(/^/gm, "  "), `</article>`);
      return lines.join("\n");
    }).join("\n");
  },
  "instagram-cta"() {
    return `<a class="btn btn-primary" href="${esc(contact.instagram)}" target="_blank" rel="noopener">${tr("projects.instagramCta")}</a>\n` +
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

  footer() {
    return [
      `<footer class="site-footer">`,
      `  <div class="container footer-inner">`,
      `    <span>${tr("nav.brand")} · ${tr("footer.builtIn")}</span>`,
      `    <span class="footer-build">${tr("footer.updated")} ${BUILD_TIME}</span>`,
      `    <span>© ${new Date().getFullYear()} · ${tr("footer.rights")}</span>`,
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

  // Hebrew pages sit one folder down: point asset paths up a level.
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

// sitemap.xml: every page in both languages, each listing its language twin.
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
for (const [a, b] of [["en", "he"], ["he", "en"]]) {
  for (const key of Object.keys(text[a])) {
    if (key !== "dir" && key !== "langName" && !(key in text[b])) {
      warn(`"${key}" is in ${a === "en" ? "English" : "Hebrew"} but missing from ${b === "en" ? "English" : "Hebrew"}`);
    }
  }
}

const written = Object.keys(LANGS).flatMap((lang) => PAGES.map((page) => render(page, lang)));
writeSitemap();
writeRobots();
warnings.forEach((w) => console.warn("! " + w));
console.log(`Wrote ${written.join(", ")}, sitemap.xml and robots.txt (built ${BUILD_TIME})`);
