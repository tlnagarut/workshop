/* ============================================================================
 * Site behaviour: language switch, mobile menu, photo viewer.
 * All page text — English and Hebrew — is already in the HTML (written by
 * tools/build-pages.mjs). Switching language only changes which one is
 * visible (CSS hides .t-en / .t-he) plus the page title, aria-labels and
 * photo alt text, which are stored as data-*-en / data-*-he attributes.
 * ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "tln-lang";
  var html = document.documentElement;
  // The inline script in <head> may already have switched to Hebrew.
  var current = html.lang === "he" ? "he" : "en";

  function byId(id) { return document.getElementById(id); }

  // ---- Language ----
  function setLanguage(lang) {
    current = lang === "he" ? "he" : "en";
    html.lang = current;
    html.dir = current === "he" ? "rtl" : "ltr";
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}

    var title = html.getAttribute("data-title-" + current);
    if (title) document.title = title;
    document.querySelectorAll("[data-aria-" + current + "]").forEach(function (el) {
      el.setAttribute("aria-label", el.getAttribute("data-aria-" + current));
    });
    document.querySelectorAll("[data-alt-" + current + "]").forEach(function (el) {
      el.alt = el.getAttribute("data-alt-" + current);
    });
    if (galleryEl && !galleryEl.hidden) showPhoto(); // caption follows language
  }

  function setupLanguage() {
    setLanguage(current);
    var toggle = byId("lang-toggle");
    if (toggle) toggle.addEventListener("click", function () {
      setLanguage(current === "en" ? "he" : "en");
    });
  }

  // ---- Photo viewer (lightbox) ----
  // Each gallery tile is a <button data-gallery="group"> carrying its image
  // sizes and both captions; tiles with the same group are browsed together.
  var galleryEl, imgEl, sourceEl, captionEl, prevBtn, nextBtn, lastFocus;
  var tiles = [], index = 0;

  function openGallery(list, i) {
    tiles = list;
    index = i;
    lastFocus = document.activeElement;
    showPhoto();
    galleryEl.hidden = false;
    document.body.style.overflow = "hidden";
    byId("gallery-close").focus();
  }

  function closeGallery() {
    galleryEl.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function showPhoto() {
    if (index < 0) index = tiles.length - 1;
    if (index >= tiles.length) index = 0;
    var tile = tiles[index];
    var thumb = tile.querySelector("img");
    sourceEl.srcset = tile.getAttribute("data-webp");
    sourceEl.sizes = "92vw";
    imgEl.srcset = tile.getAttribute("data-jpg");
    imgEl.sizes = "92vw";
    imgEl.src = tile.getAttribute("data-src");
    imgEl.width = Number(tile.getAttribute("data-width"));
    imgEl.height = Number(tile.getAttribute("data-height"));
    imgEl.alt = thumb ? thumb.alt : "";
    var caption = tile.getAttribute("data-caption-" + current) || "";
    if (tiles.length > 1) caption += "  ·  " + (index + 1) + " / " + tiles.length;
    captionEl.textContent = caption;
    prevBtn.hidden = nextBtn.hidden = tiles.length < 2;
  }

  // "Forward" follows reading direction: right in English, left in Hebrew.
  function step(forward) {
    index += forward ? 1 : -1;
    showPhoto();
  }

  function setupGallery() {
    galleryEl = byId("gallery");
    if (!galleryEl) return;
    imgEl = byId("gallery-img");
    sourceEl = byId("gallery-source");
    captionEl = byId("gallery-caption");
    prevBtn = byId("gallery-prev");
    nextBtn = byId("gallery-next");

    var groups = {};
    document.querySelectorAll("[data-gallery]").forEach(function (tile) {
      var name = tile.getAttribute("data-gallery");
      var list = groups[name] || (groups[name] = []);
      var i = list.length;
      list.push(tile);
      tile.addEventListener("click", function () { openGallery(list, i); });
    });

    byId("gallery-close").addEventListener("click", closeGallery);
    prevBtn.addEventListener("click", function () { step(false); });
    nextBtn.addEventListener("click", function () { step(true); });
    galleryEl.addEventListener("click", function (e) {
      if (e.target === galleryEl) closeGallery(); // tap the dark backdrop to close
    });
    document.addEventListener("keydown", function (e) {
      if (galleryEl.hidden) return;
      if (e.key === "Escape") closeGallery();
      else if (e.key === "ArrowRight") step(current !== "he");
      else if (e.key === "ArrowLeft") step(current === "he");
    });

    // Swipe on phones: a mostly-horizontal swipe of 50px+ changes photo.
    var startX = null, startY = null;
    galleryEl.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { startX = null; return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    galleryEl.addEventListener("touchend", function (e) {
      if (startX === null || tiles.length < 2) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      // Swiping left shows the next photo in English; in Hebrew it's mirrored.
      step(current === "he" ? dx > 0 : dx < 0);
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
    setupGallery();
    setupNav();
    setupLanguage();
  });
})();
