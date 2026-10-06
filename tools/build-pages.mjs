/* ============================================================================
 * Builds the pages (index.html, workshop.html, in-the-workshop.html,
 * projects.html) from the
 * templates in templates/ and the text in content/. Run:
 *   node tools/build-pages.mjs        (invoked by build.sh and the deploy)
 *
 * All text — English AND Hebrew — is written into the HTML itself, so search
 * engines and AI assistants see a complete page without running any script.
 * The language button only switches which language is visible (see .t-en /
 * .t-he in styles.css and setLanguage() in main.js).
 *
 * Sources:
 *   content/about.en.yml, about.he.yml      site text (keys like hero.title)
 *   content/workshop.en.yml, workshop.he.yml Workshop page (keys workshop.*)
 *   content/contact.yml                      phones, email, address, links
 *   content/photos.yml + assets/img/photos/manifest.json   photos
 *
 * Template syntax (templates/*.html):
 *   <h1 data-i18n="hero.title"></h1>     → the text in both languages
 *   <button data-i18n-aria="nav.menuAria">  → translated aria-label
 *   <!-- @footer -->                     → a generated block (see BLOCKS)
 *   {{htmlAttrs}}                        → a generated value (see INLINE)
 * ========================================================================== */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

const PAGES = [
  { key: "home", template: "templates/index.html", out: "index.html", path: "" },
  { key: "workshop", template: "templates/workshop.html", out: "workshop.html", path: "workshop.html" },
  { key: "inWorkshop", template: "templates/in-the-workshop.html", out: "in-the-workshop.html", path: "in-the-workshop.html" },
  { key: "projects", template: "templates/projects.html", out: "projects.html", path: "projects.html" },
];

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

// Both languages side by side; CSS shows the active one. Identical text
// (numbers, names) is written once.
function both(en, he) {
  if (en === he) return esc(en);
  return `<span class="t-en" lang="en">${esc(en)}</span><span class="t-he" lang="he">${esc(he)}</span>`;
}
const tr = (key) => both(t("en", key), t("he", key));

// A translated attribute: English by default, Hebrew swapped in by main.js.
function attr(name, en, he) {
  return `${name}="${esc(en)}" data-${name.replace("aria-label", "aria")}-en="${esc(en)}" ` +
    `data-${name.replace("aria-label", "aria")}-he="${esc(he)}"`;
}
const aria = (key) => attr("aria-label", t("en", key), t("he", key));

// Pair up an English list with its Hebrew twin (workshop cards, spray facts).
function pairs(key) {
  const en = [].concat(text.en[key] || []);
  const he = [].concat(text.he[key] || []);
  if (en.length !== he.length) warn(`${key}: ${en.length} English item(s) but ${he.length} Hebrew`);
  return en.map((item, i) => [item, he[i] ?? item]);
}

const pageUrl = (page) => SITE + page.path;
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
      ...done, group,
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
function photoGrid(group) {
  const list = photos(group);
  if (!list.length) return "";
  const sizes = "(max-width: 860px) 50vw, 340px";
  const items = list.map((p) =>
    `  <li><button class="photo-tile" type="button" data-gallery="${group}" ` +
    `data-webp="${srcset(p, "webp")}" data-jpg="${srcset(p, "jpg")}" ` +
    `data-src="assets/img/photos/${p.group}/${p.name}-${p.widths[p.widths.length - 1]}.jpg" ` +
    `data-width="${p.width}" data-height="${p.height}" ` +
    `data-caption-en="${esc(p.caption.en)}" data-caption-he="${esc(p.caption.he)}">` +
    picture(p, { sizes }) + `</button></li>`);
  return `<ul class="photo-grid">\n${items.join("\n")}\n</ul>`;
}

// ---------------------------------------------------------------- blocks
const BLOCKS = {
  // Title, description, canonical address and social-sharing tags.
  head(page) {
    const title = t("en", `meta.${page.key}Title`);
    const desc = t("en", `meta.${page.key}Description`);
    const url = pageUrl(page);
    const img = SITE + SOCIAL_IMAGE;
    const imgAlt = t("en", "meta.socialImageAlt");
    return [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(desc)}" />`,
      `<link rel="canonical" href="${url}" />`,
      ``,
      `<!-- Open Graph / social sharing (WhatsApp, Facebook, …) -->`,
      `<meta property="og:site_name" content="${esc(t("en", "nav.brand"))}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:image" content="${img}" />`,
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:image:alt" content="${esc(imgAlt)}" />`,
      `<meta property="og:locale" content="en_US" />`,
      `<meta property="og:locale:alternate" content="he_IL" />`,
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

  // Sets the saved language before the page paints, so there is no flash.
  "lang-script"() {
    return `<script>try{if(localStorage.getItem("tln-lang")==="he"){document.documentElement.lang="he";document.documentElement.dir="rtl";}}catch(e){}</script>`;
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
      link(home ? "#contact" : "index.html#contact", "nav.contact"),
      link("workshop.html", "nav.workshop", page.key === "workshop"),
      link("in-the-workshop.html", "nav.inWorkshop", page.key === "inWorkshop"),
      link("projects.html", "nav.projects", page.key === "projects"),
      `    </nav>`,
      ``,
      `    <button id="nav-toggle" class="nav-toggle" type="button" aria-expanded="false"`,
      `      aria-controls="nav-links" data-i18n-aria="nav.menuAria">`,
      `      <span></span><span></span><span></span>`,
      `    </button>`,
      ``,
      `    <button id="lang-toggle" class="lang-toggle" type="button"`,
      `      data-i18n-aria="nav.langToggleAria" data-i18n="nav.langToggle"></button>`,
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
      `    <div class="contact-people">`,
      people.join("\n").replace(/^/gm, "  "),
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

  "process-photos"() {
    return photoGrid("process");
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
  htmlAttrs: (page) => `lang="en" dir="ltr" ` +
    `data-title-en="${esc(t("en", `meta.${page.key}Title`))}" ` +
    `data-title-he="${esc(t("he", `meta.${page.key}Title`))}"`,
  siteUrl: () => SITE,
};

// "Last updated" stamp in the footer: YYYY.MM.DD HH:MM, build machine time.
const BUILD_TIME = (() => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
})();

// ---------------------------------------------------------------- render
function render(page) {
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
  // Leaf elements with data-i18n get their text in both languages.
  html = html.replace(/<([a-z][a-z0-9]*)\b([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>[^<]*<\/\1>/g,
    (m, tag, before, key, after) => `<${tag}${before}${after}>${tr(key)}</${tag}>`);
  html = html.replace(/\sdata-i18n-aria="([^"]+)"/g, (m, key) => " " + aria(key));

  const leftover = html.match(/\{\{\w+\}\}|<!-- @[\w-]+ -->|data-i18n/);
  if (leftover) throw new Error(`${page.template}: could not fill "${leftover[0]}"`);

  const banner = `<!-- AUTO-GENERATED by tools/build-pages.mjs from ${page.template} — do not edit.\n` +
    `     Edit the template or the text in content/, then run ./build.sh -->\n`;
  writeFileSync(join(root, page.out), html.replace(/^(<!DOCTYPE html>\n)/i, `$1${banner}`));
}

// Flag keys that exist in one language only.
for (const [a, b] of [["en", "he"], ["he", "en"]]) {
  for (const key of Object.keys(text[a])) {
    if (key !== "dir" && key !== "langName" && !(key in text[b])) {
      warn(`"${key}" is in ${a === "en" ? "English" : "Hebrew"} but missing from ${b === "en" ? "English" : "Hebrew"}`);
    }
  }
}

PAGES.forEach(render);
warnings.forEach((w) => console.warn("! " + w));
console.log(`Wrote ${PAGES.map((p) => p.out).join(", ")} (built ${BUILD_TIME})`);
