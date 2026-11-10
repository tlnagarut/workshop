/* ============================================================================
 * Site behaviour: the phone menu, the things that move as you scroll, the
 * photo viewer, the "Recent work" filter and the "Start your project" box.
 * Each page is in one language (English pages in the root, Hebrew in he/,
 * Russian in ru/), written by tools/build-pages.mjs. The language buttons are
 * plain links to the same page in the other languages, so no script is
 * involved there. Everything on the pages is readable without this script;
 * it only adds the motion and the shortcuts.
 * ========================================================================== */
(function () {
  "use strict";

  // Hebrew pages read right-to-left, which mirrors the photo viewer's arrows.
  var rtl = document.documentElement.dir === "rtl";

  function byId(id) { return document.getElementById(id); }

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
    var caption = tile.getAttribute("data-caption") || "";
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
      else if (e.key === "ArrowRight") step(!rtl);
      else if (e.key === "ArrowLeft") step(rtl);
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
      step(rtl ? dx > 0 : dx < 0);
    });
  }

  // ---- "Show more" under a long gallery ----
  function setupShowMore() {
    document.querySelectorAll("[data-show-more]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var grid = btn.previousElementSibling;
        var first = grid.querySelector(".photo-extra .photo-tile");
        grid.querySelectorAll(".photo-extra").forEach(function (li) {
          li.classList.remove("photo-extra");
        });
        btn.remove();
        if (first) first.focus();
        revealCheck();
      });
    });
  }

  // ---- Things that appear as you scroll ----
  // Elements marked data-reveal / data-uncover / data-rise (and the thin
  // "tape" lines) start hidden by the stylesheet and get class "is-in" when
  // they come into view. data-count numbers count up from zero.
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealObserver = null, waiting = [];

  function countUp(el) {
    var target = Number(el.getAttribute("data-count"));
    if (reduce || !target) { el.textContent = String(target); return; }
    var start = performance.now();
    (function tick(now) {
      var a = Math.min(1, (now - start) / 1400);
      el.textContent = String(Math.round((1 - Math.pow(1 - a, 4)) * target));
      if (a < 1) requestAnimationFrame(tick);
    })(start);
  }

  function show(el) {
    el.classList.add("is-in");
    if (el.hasAttribute("data-count")) countUp(el);
    if (revealObserver) revealObserver.unobserve(el);
  }

  // Safety net: anything already above the bottom of the screen is shown,
  // even if the observer missed it (fast scrolling, jumping to an anchor).
  function revealCheck() {
    var vh = window.innerHeight;
    waiting = waiting.filter(function (el) {
      if (el.classList.contains("is-in")) return false;
      var r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < vh) { show(el); return false; }
      return true;
    });
  }

  function setupReveal() {
    waiting = [].slice.call(document.querySelectorAll("[data-reveal],[data-uncover],[data-rise],.tape,[data-count]"));
    if (!("IntersectionObserver" in window)) { waiting.forEach(show); waiting = []; return; }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) show(entry.target); });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    waiting.forEach(function (el) { revealObserver.observe(el); });
    var timer = 0;
    window.addEventListener("scroll", function () {
      if (!timer) timer = setTimeout(function () { timer = 0; revealCheck(); }, 180);
    }, { passive: true });
    window.addEventListener("load", revealCheck, { once: true });
    revealCheck();
  }

  // ---- Top bar: dark over the big photo, light after it, tucks away while
  // scrolling down and returns when scrolling up ----
  function setupHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var hero = document.querySelector("[data-hero]");
    var heroEnd = 40, lastY = window.scrollY, queued = false;
    function measure() { heroEnd = hero ? hero.offsetTop + hero.offsetHeight - 80 : -1; }
    function update() {
      var y = window.scrollY;
      var menuOpen = document.documentElement.classList.contains("menu-open");
      header.classList.toggle("is-light", y > heroEnd);
      header.classList.toggle("is-scrolled", y > 8);
      header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove("is-hidden");
      lastY = y;
      queued = false;
    }
    measure();
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", function () {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // ---- Phone menu (full screen) ----
  function setupMenu() {
    var btn = document.querySelector("[data-menu-btn]");
    var menu = document.querySelector("[data-menu]");
    if (!btn || !menu) return;
    var root = document.documentElement;
    function close() {
      root.classList.remove("menu-open");
      btn.setAttribute("aria-expanded", "false");
      menu.inert = true;
    }
    function open() {
      root.classList.add("menu-open");
      btn.setAttribute("aria-expanded", "true");
      menu.inert = false;
      var first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
    menu.inert = true;
    btn.addEventListener("click", function () {
      if (root.classList.contains("menu-open")) close(); else open();
    });
    // Tapping a link (on this page or another) closes the menu.
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("menu-open")) { close(); btn.focus(); }
    });
  }

  // ---- WhatsApp / call bar on phones: slides up once the top button has
  // scrolled away, steps aside at the Contact section ----
  function setupDock() {
    var dock = document.querySelector("[data-fab]");
    if (!dock || !("IntersectionObserver" in window)) return;
    var topButtons = document.querySelector("[data-hero-cta]");
    var contact = document.querySelector("#contact");
    var past = !topButtons, atContact = false;
    function update() { dock.classList.toggle("is-on", past && !atContact); }
    if (topButtons) new IntersectionObserver(function (entries) {
      past = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      update();
    }).observe(topButtons);
    if (contact) new IntersectionObserver(function (entries) {
      atContact = entries[0].isIntersecting;
      update();
    }, { threshold: 0.35 }).observe(contact);
    update();
  }

  // ---- Moving row of workshop photos: runs only while it is on screen ----
  function setupLoop() {
    if (!("IntersectionObserver" in window)) return;
    document.querySelectorAll("[data-loop]").forEach(function (strip) {
      new IntersectionObserver(function (entries) {
        strip.classList.toggle("is-running", entries[0].isIntersecting);
      }).observe(strip);
    });
  }

  // ---- "Recent work" filter buttons on the home page ----
  function setupFilters() {
    document.querySelectorAll("[data-filters]").forEach(function (section) {
      var buttons = section.querySelectorAll("[data-filter]");
      var tiles = section.querySelectorAll("[data-cat]");
      function apply(type) {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === type)); });
        tiles.forEach(function (li) { li.hidden = type !== "all" && li.getAttribute("data-cat") !== type; });
        revealCheck();
      }
      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          var type = b.getAttribute("data-filter");
          if (document.startViewTransition && !reduce) document.startViewTransition(function () { apply(type); });
          else apply(type);
        });
      });
    });
  }

  // ---- "Start your project": three taps write the WhatsApp message ----
  // The wording comes from the page (data-msg-item / data-msg-plain on the
  // form), so it is always in the page's language. If the visitor edits the
  // message by hand, their text is kept until they tap another choice.
  function setupStarter() {
    var form = document.querySelector("[data-starter]");
    if (!form) return;
    var box = form.querySelector("textarea");
    var send = byId("send");
    var chosen = form.querySelector("[data-person][aria-pressed='true']") || form.querySelector("[data-person]");
    var state = { item: "", stage: "", person: chosen };

    function press(attr, value) {
      form.querySelectorAll("[" + attr + "]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute(attr) === value && value !== ""));
      });
    }
    function link() {
      send.href = "https://wa.me/" + state.person.getAttribute("data-person") + "?text=" + encodeURIComponent(box.value);
    }
    function write() {
      var template = form.getAttribute(state.item ? "data-msg-item" : "data-msg-plain");
      box.value = template
        .replace("{name}", state.person.getAttribute("data-name"))
        .replace("{item}", state.item)
        .replace("{stage}", state.stage ? " " + state.stage + "." : "");
      link();
    }
    form.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-item")) {
        state.item = state.item === b.getAttribute("data-item") ? "" : b.getAttribute("data-item");
        press("data-item", state.item);
      } else if (b.hasAttribute("data-stage")) {
        state.stage = state.stage === b.getAttribute("data-stage") ? "" : b.getAttribute("data-stage");
        press("data-stage", state.stage);
      } else if (b.hasAttribute("data-person")) {
        state.person = b;
        form.querySelectorAll("[data-person]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      } else return;
      write();
    });
    box.addEventListener("input", link);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    // The "Also: …" links above jump here with that item already chosen.
    document.querySelectorAll("[data-preset]").forEach(function (a) {
      a.addEventListener("click", function () {
        state.item = a.getAttribute("data-preset");
        press("data-item", state.item);
        write();
      });
    });
  }

  // ---- Boot ----
  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupHeader();
    setupReveal();
    setupDock();
    setupLoop();
    setupFilters();
    setupStarter();
    setupGallery();
    setupShowMore();
  });
})();
