/* ============================================================================
 * Site behaviour: language switching, project rendering, photo gallery.
 * Depends on globals from content.js (I18N, CONTACT) and projects.js (PROJECTS).
 * ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "tln-lang";
  var current = "en";

  // The site has two pages (index.html + projects.html) sharing this script,
  // so some elements exist only on one page — these helpers stay null-safe.
  function byId(id) { return document.getElementById(id); }
  function setText(id, text) { var el = byId(id); if (el) el.textContent = text; }

  function t(key) {
    var dict = I18N[current] || I18N.en;
    return key in dict ? dict[key] : I18N.en[key] || "";
  }

  // ---- Apply translations to all [data-i18n*] elements ----
  function applyStaticText() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var attr = el.getAttribute("data-i18n-attr"); // e.g. "content" for <meta>
      var value = t(key);
      if (attr) el.setAttribute(attr, value);
      else el.textContent = value;
    });
    // ARIA labels that should also translate.
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
  }

  // ---- Fill contact details (shared, not per-language) ----
  function applyContact() {
    // Each contact person gets a phone link + a WhatsApp button. Names are
    // translated via data-i18n in the markup; the numbers come from CONTACT.
    (CONTACT.people || []).forEach(function (person, i) {
      var n = i + 1;
      var phone = byId("contact-phone-" + n);
      if (phone) { phone.textContent = person.phoneDisplay; phone.href = "tel:" + person.phoneHref; }

      var whatsapp = byId("contact-whatsapp-" + n);
      if (whatsapp) { whatsapp.href = "https://wa.me/" + person.phoneHref.replace(/\D/g, ""); }
    });

    var email = byId("contact-email");
    if (email) { email.textContent = CONTACT.email; email.href = "mailto:" + CONTACT.email; }

    setText("contact-location", CONTACT.city);

    var ig = byId("contact-instagram");
    if (ig) { ig.textContent = CONTACT.instagramHandle; ig.href = CONTACT.instagram; }

    var igInline = byId("ig-inline");
    if (igInline) { igInline.textContent = CONTACT.instagramHandle; igInline.href = CONTACT.instagram; }
  }

  // ---- Render project cards ----
  function tagText(audience) {
    if (audience === "business") return t("projects.tagBusiness");
    if (audience === "both") return t("projects.tagBoth");
    return t("projects.tagPrivate");
  }

  function renderProjects() {
    var grid = byId("projects-grid");
    if (!grid || typeof PROJECTS === "undefined") return;
    grid.innerHTML = "";
    PROJECTS.forEach(function (p, index) {
      var loc = (p[current] && p[current].title) ? p[current] : p.en;
      var photos = (p.images || []).filter(Boolean);
      var hasPhotos = photos.length > 0;
      var btn = document.createElement("button");
      btn.className = hasPhotos ? "project" : "project project--no-photos";
      btn.type = "button";
      btn.setAttribute("aria-label", loc.title);
      var thumb = p.cover
        ? '<img class="project-thumb" loading="lazy" alt="" src="' + p.cover + '">'
        : '<div class="project-thumb project-thumb--empty"><span>' +
          t("projects.noPhotos") + "</span></div>";
      btn.innerHTML =
        thumb +
        '<div class="project-body">' +
        '<span class="project-tag">' + tagText(p.audience) + "</span>" +
        '<h3 class="project-title"></h3>' +
        '<p class="project-desc"></p>' +
        (hasPhotos
          ? '<span class="project-cta">' + t("projects.viewGallery") + " →</span>"
          : "") +
        "</div>";
      var thumbImg = btn.querySelector("img.project-thumb");
      if (thumbImg) thumbImg.alt = loc.title;
      btn.querySelector(".project-title").textContent = loc.title;
      btn.querySelector(".project-desc").textContent = loc.description;
      if (hasPhotos) {
        btn.addEventListener("click", function () { openGallery(photos, loc.title, 0); });
      } else {
        btn.disabled = true;
      }
      grid.appendChild(btn);
    });
  }

  // ---- Workshop section (content from workshop.js) ----
  function renderWorkshop() {
    if (typeof WORKSHOP === "undefined" || !byId("ws-features")) return;
    var w = WORKSHOP[current] || WORKSHOP.en;
    setText("ws-eyebrow", w.eyebrow || "");
    setText("ws-title", w.title || "");
    setText("ws-intro", w.intro || "");

    var feats = byId("ws-features");
    feats.innerHTML = "";
    (w.features || []).forEach(function (f) {
      var card = document.createElement("article");
      card.className = "card";
      var h = document.createElement("h3");
      h.textContent = f.title;
      var p = document.createElement("p");
      p.textContent = f.description;
      card.appendChild(h);
      card.appendChild(p);
      feats.appendChild(card);
    });

    var photosEl = document.getElementById("ws-photos");
    photosEl.innerHTML = "";
    var photos = WORKSHOP.photos || [];
    photos.forEach(function (src, i) {
      var btn = document.createElement("button");
      btn.className = "workshop-photo";
      btn.type = "button";
      btn.setAttribute("aria-label", w.title);
      btn.innerHTML = '<img loading="lazy" alt="" src="' + src + '">';
      btn.querySelector("img").alt = w.title + " — " + (i + 1);
      btn.addEventListener("click", function () { openGallery(photos, w.title, i); });
      photosEl.appendChild(btn);
    });
  }

  // ---- Gallery / lightbox (works with any list of images) ----
  var galleryEl, imgEl, captionEl;
  var galPhotos = [], galTitle = "", galPhoto = 0;

  function openGallery(photos, title, photoIndex) {
    if (!galleryEl) return;
    galPhotos = photos && photos.length ? photos : [];
    galTitle = title || "";
    galPhoto = photoIndex || 0;
    if (!galPhotos.length) return;
    showPhoto();
    galleryEl.hidden = false;
    document.body.style.overflow = "hidden";
    byId("gallery-close").focus();
  }

  function closeGallery() {
    galleryEl.hidden = true;
    document.body.style.overflow = "";
  }

  function showPhoto() {
    if (galPhoto < 0) galPhoto = galPhotos.length - 1;
    if (galPhoto >= galPhotos.length) galPhoto = 0;
    imgEl.src = galPhotos[galPhoto];
    imgEl.alt = galTitle + " — " + (galPhoto + 1);
    captionEl.textContent =
      galTitle + "  ·  " + (galPhoto + 1) + " / " + galPhotos.length;
  }

  function step(delta) { galPhoto += delta; showPhoto(); }

  function setupGallery() {
    galleryEl = byId("gallery");
    if (!galleryEl) return;
    imgEl = byId("gallery-img");
    captionEl = byId("gallery-caption");
    byId("gallery-close").addEventListener("click", closeGallery);
    byId("gallery-prev").addEventListener("click", function () { step(-1); });
    byId("gallery-next").addEventListener("click", function () { step(1); });
    galleryEl.addEventListener("click", function (e) {
      if (e.target === galleryEl) closeGallery(); // click backdrop to close
    });
    document.addEventListener("keydown", function (e) {
      if (galleryEl.hidden) return;
      if (e.key === "Escape") closeGallery();
      else if (e.key === "ArrowRight") step(current === "he" ? -1 : 1);
      else if (e.key === "ArrowLeft") step(current === "he" ? 1 : -1);
    });
  }

  // ---- Language ----
  function setLanguage(lang) {
    current = I18N[lang] ? lang : "en";
    var meta = I18N[current];
    document.documentElement.lang = current;
    document.documentElement.dir = meta.dir;
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
    applyStaticText();
    renderWorkshop(); // re-render so workshop text follows the language
    renderProjects(); // re-render so card text + tags follow the language
  }

  function initLanguage() {
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    setLanguage(saved || "en");
    var toggle = byId("lang-toggle");
    if (toggle) toggle.addEventListener("click", function () {
      setLanguage(current === "en" ? "he" : "en");
    });
  }

  // ---- Mobile nav (hamburger) ----
  function setupNav() {
    var toggle = byId("nav-toggle");
    var links = byId("nav-links");
    if (!toggle || !links) return;
    function close() {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Tapping a link (on the current page or another) closes the panel.
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
  }

  // ---- Boot ----
  document.addEventListener("DOMContentLoaded", function () {
    setText("year", String(new Date().getFullYear()));
    applyContact();
    setupGallery();
    setupNav();
    initLanguage();
  });
})();
