/* ============================================================================
 * Site behaviour: language switching, project rendering, photo gallery.
 * Depends on globals from i18n.js (I18N, CONTACT) and projects.js (PROJECTS).
 * ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "tln-lang";
  var current = "en";

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
    var phone = document.getElementById("contact-phone");
    phone.textContent = CONTACT.phoneDisplay;
    phone.href = "tel:" + CONTACT.phoneHref;

    var email = document.getElementById("contact-email");
    email.textContent = CONTACT.email;
    email.href = "mailto:" + CONTACT.email;

    document.getElementById("contact-location").textContent = CONTACT.city;

    var ig = document.getElementById("contact-instagram");
    ig.textContent = CONTACT.instagramHandle;
    ig.href = CONTACT.instagram;

    var igInline = document.getElementById("ig-inline");
    igInline.textContent = CONTACT.instagramHandle;
    igInline.href = CONTACT.instagram;

    document.getElementById("contact-email-btn").href = "mailto:" + CONTACT.email;
    document.getElementById("footer-name").textContent = CONTACT.name;
  }

  // ---- Render project cards ----
  function tagText(audience) {
    if (audience === "business") return t("projects.tagBusiness");
    if (audience === "both") return t("projects.tagBoth");
    return t("projects.tagPrivate");
  }

  function renderProjects() {
    var grid = document.getElementById("projects-grid");
    grid.innerHTML = "";
    PROJECTS.forEach(function (p, index) {
      var loc = (p[current] && p[current].title) ? p[current] : p.en;
      var btn = document.createElement("button");
      btn.className = "project";
      btn.type = "button";
      btn.setAttribute("aria-label", loc.title);
      btn.innerHTML =
        '<img class="project-thumb" loading="lazy" alt="" src="' + p.cover + '">' +
        '<div class="project-body">' +
        '<span class="project-tag">' + tagText(p.audience) + "</span>" +
        '<h3 class="project-title"></h3>' +
        '<p class="project-desc"></p>' +
        '<span class="project-cta">' + t("projects.viewGallery") + " →</span>" +
        "</div>";
      btn.querySelector(".project-thumb").alt = loc.title;
      btn.querySelector(".project-title").textContent = loc.title;
      btn.querySelector(".project-desc").textContent = loc.description;
      var photos = (p.images && p.images.length) ? p.images : [p.cover];
      btn.addEventListener("click", function () { openGallery(photos, loc.title, 0); });
      grid.appendChild(btn);
    });
  }

  // ---- Workshop section (content from workshop.js) ----
  function renderWorkshop() {
    if (typeof WORKSHOP === "undefined") return;
    var w = WORKSHOP[current] || WORKSHOP.en;
    document.getElementById("ws-eyebrow").textContent = w.eyebrow || "";
    document.getElementById("ws-title").textContent = w.title || "";
    document.getElementById("ws-intro").textContent = w.intro || "";

    var feats = document.getElementById("ws-features");
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
    galPhotos = photos && photos.length ? photos : [];
    galTitle = title || "";
    galPhoto = photoIndex || 0;
    if (!galPhotos.length) return;
    showPhoto();
    galleryEl.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("gallery-close").focus();
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
    galleryEl = document.getElementById("gallery");
    imgEl = document.getElementById("gallery-img");
    captionEl = document.getElementById("gallery-caption");
    document.getElementById("gallery-close").addEventListener("click", closeGallery);
    document.getElementById("gallery-prev").addEventListener("click", function () { step(-1); });
    document.getElementById("gallery-next").addEventListener("click", function () { step(1); });
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
    document.getElementById("lang-toggle").addEventListener("click", function () {
      setLanguage(current === "en" ? "he" : "en");
    });
  }

  // ---- Boot ----
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("year").textContent = String(new Date().getFullYear());
    applyContact();
    setupGallery();
    initLanguage();
  });
})();
