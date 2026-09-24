/* ============================================================
   js/main.js
   Site behaviour: nav, scroll reveal, the game grid (built from
   js/games.js), the arcade picker, the contact form, and the
   animated hero grid.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GAMES = Array.isArray(window.CC_GAMES) ? window.CC_GAMES : [];

  // Pages inside /pages/ need one step back up to reach the root folders.
  var BASE = window.location.pathname.indexOf("/pages/") !== -1 ? "../" : "";
  function url(path) { return BASE + path; }

  /* ---------- storage ---------- */
  var fallback = {};
  function readStore(key, miss) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw === null ? miss : raw;
    } catch (err) {
      return key in fallback ? fallback[key] : miss;
    }
  }

  /* ---------- 1. Nav ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;

    function close() {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    }

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });

    links.addEventListener("click", function (e) { if (e.target.tagName === "A") close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) { close(); toggle.focus(); }
    });
  }

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initActiveLink() {
    var here = window.location.pathname.split("/").pop() || "index.html";
    var links = document.querySelectorAll(".nav-links a");
    for (var i = 0; i < links.length; i++) {
      var target = links[i].getAttribute("href").split("/").pop().split("#")[0];
      if (target === here) links[i].setAttribute("aria-current", "page");
    }
  }

  /* ---------- 2. Reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------- 3. Game grid ---------- */
  function cardMarkup(game) {
    var best = game.bestKey ? readStore(game.bestKey, "0") : "0";
    var bestText = best === "0" ? "not set yet" : best;
    var tags = (game.tags || []).map(function (t) {
      return '<span class="tag">' + t + "</span>";
    }).join("");

    return '' +
      '<article class="game-card" data-genre="' + (game.genre || "arcade") + '">' +
        '<figure><img src="' + url(game.thumb || "images/placeholder.svg") + '" alt="' + game.title + '"></figure>' +
        '<div class="game-card-body">' +
          "<h3>" + game.title + "</h3>" +
          "<p>" + (game.blurb || "") + "</p>" +
          '<div class="tag-row">' + tags + "</div>" +
          '<div class="card-meta">' +
            "<span>Your best: <b>" + bestText + "</b></span>" +
            "<span>" + (game.length || "") + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="card-actions">' +
          '<a class="btn btn--primary" href="' + url(game.path) + '">Play now</a>' +
          '<a class="btn btn--ghost" href="' + url("pages/game.html") + "?game=" + game.id + '">In arcade</a>' +
        "</div>" +
      "</article>";
  }

  function slotMarkup() {
    return '' +
      '<div class="slot-card">' +
        '<div class="slot-plus">+</div>' +
        "<h3>Empty cabinet</h3>" +
        "<p>Drop a folder in <code>games/</code>, then add one entry to <code>js/games.js</code>.</p>" +
      "</div>";
  }

  function initGameGrid() {
    var grid = document.getElementById("gameGrid");
    if (!grid) return;

    grid.innerHTML = GAMES.map(cardMarkup).join("") + slotMarkup() + (GAMES.length ? "" : slotMarkup());

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".game-card"));
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
    var search = document.getElementById("gameSearch");
    var empty = document.getElementById("noResults");
    var filter = "all";

    function apply() {
      var term = search ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (card) {
        var okFilter = filter === "all" || card.getAttribute("data-genre") === filter;
        var okTerm = !term || card.textContent.toLowerCase().indexOf(term) !== -1;
        card.classList.toggle("is-hidden", !(okFilter && okTerm));
        if (okFilter && okTerm) shown++;
      });
      if (empty) empty.hidden = !(cards.length && shown === 0);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        filter = chip.getAttribute("data-filter");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    apply();
  }

  /* ---------- 4. Arcade picker (pages/game.html) ---------- */
  function initArcade() {
    var stage = document.getElementById("stage");
    if (!stage) return;

    var list = document.getElementById("gameList");
    var frame = document.getElementById("gameFrame");
    var title = document.getElementById("stageTitle");
    var open = document.getElementById("openStandalone");
    var reload = document.getElementById("reloadGame");
    var blank = document.getElementById("stageEmpty");

    if (!GAMES.length) {
      if (frame) frame.hidden = true;
      if (blank) blank.hidden = false;
      if (open) open.hidden = true;
      if (reload) reload.hidden = true;
      if (title) title.textContent = "No cabinets yet";
      if (list) {
        list.innerHTML = '<div class="slot-card"><div class="slot-plus">+</div>' +
          "<h3>Nothing plugged in</h3><p>Register a game in <code>js/games.js</code> and it appears here.</p></div>";
      }
      return;
    }

    if (list) {
      list.innerHTML = GAMES.map(function (game) {
        return '' +
          '<button class="game-pick" type="button" data-id="' + game.id + '" ' +
            'data-src="' + url(game.path) + '" data-title="' + game.title + '" aria-pressed="false">' +
            '<img src="' + url(game.thumb || "images/placeholder.svg") + '" alt="">' +
            "<span><strong>" + game.title + "</strong><span>" +
              ((game.tags || []).slice(0, 2).join(" · ") || "Ready to play") +
            "</span></span>" +
          "</button>";
      }).join("");
    }

    var picks = Array.prototype.slice.call(document.querySelectorAll(".game-pick"));

    function load(pick) {
      picks.forEach(function (p) { p.setAttribute("aria-pressed", "false"); });
      pick.setAttribute("aria-pressed", "true");
      if (frame) {
        frame.hidden = false;
        frame.src = pick.getAttribute("data-src");
        frame.title = pick.getAttribute("data-title") + " — playable game";
      }
      if (title) title.textContent = pick.getAttribute("data-title");
      if (open) open.href = pick.getAttribute("data-src");
    }

    picks.forEach(function (pick) {
      pick.addEventListener("click", function () { load(pick); });
    });

    var wanted = new URLSearchParams(window.location.search).get("game");
    var start = picks.filter(function (p) { return p.getAttribute("data-id") === wanted; })[0] || picks[0];
    if (start) load(start);

    if (reload && frame) {
      reload.addEventListener("click", function () { frame.src = frame.src; }); // eslint-disable-line no-self-assign
    }
  }

  /* ---------- 5. Contact form ---------- */
  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var status = document.getElementById("formStatus");

    function fail(field, msg) {
      var wrap = field.closest(".field");
      var note = wrap.querySelector(".error-text");
      wrap.classList.add("has-error");
      field.setAttribute("aria-invalid", "true");
      if (note && msg) note.textContent = msg;
    }
    function clear(field) {
      field.closest(".field").classList.remove("has-error");
      field.removeAttribute("aria-invalid");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var first = null;
      [f.name, f.email, f.topic, f.message].forEach(clear);

      if (f.name.value.trim().length < 2) { fail(f.name, "Enter the name you want us to use."); first = first || f.name; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) { fail(f.email, "Use a full address, like player@example.com."); first = first || f.email; }
      if (!f.topic.value) { fail(f.topic, "Pick the subject that fits best."); first = first || f.topic; }
      if (f.message.value.trim().length < 12) { fail(f.message, "Add a little more detail — 12 characters minimum."); first = first || f.message; }

      if (first) { if (status) status.hidden = true; first.focus(); return; }

      if (status) {
        status.textContent = "Message ready to send. This demo has no server, so nothing left your browser.";
        status.hidden = false;
      }
      form.reset();
    });

    form.addEventListener("input", function (e) {
      if (e.target.closest(".field.has-error")) clear(e.target);
    });
  }

  /* ---------- 6. Footer year ---------- */
  function initYear() {
    var slot = document.getElementById("year");
    if (slot) slot.textContent = new Date().getFullYear();
  }

  /* ---------- 7. Hero: scrolling neon grid ---------- */
  function initHeroGrid() {
    var canvas = document.getElementById("heroGrid");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    var horizon = H * 0.42;
    var offset = 0;

    var stars = [];
    for (var i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * horizon,
        r: Math.random() * 1.6 + 0.4,
        t: Math.random() * Math.PI * 2
      });
    }

    function draw(time) {
      // sky
      var sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, "#0A0416");
      sky.addColorStop(1, "#33124A");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, horizon);

      // sun
      var sun = ctx.createLinearGradient(0, horizon - 120, 0, horizon);
      sun.addColorStop(0, "#FFC542");
      sun.addColorStop(1, "#FF4D8D");
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, horizon - 6, 86, Math.PI, 0);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = sun;
      ctx.fillRect(W / 2 - 90, horizon - 100, 180, 100);
      // slats
      ctx.fillStyle = "#0A0416";
      for (var s = 0; s < 6; s++) {
        var y = horizon - 12 - s * 13 - (s * s) * 0.6;
        ctx.fillRect(W / 2 - 90, y, 180, 3 + s * 0.8);
      }
      ctx.restore();

      // stars
      stars.forEach(function (star) {
        var twinkle = 0.45 + 0.55 * Math.abs(Math.sin(time / 900 + star.t));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = "#F7F2FF";
        ctx.fillRect(star.x, star.y, star.r, star.r);
      });
      ctx.globalAlpha = 1;

      // ground
      ctx.fillStyle = "#0A0416";
      ctx.fillRect(0, horizon, W, H - horizon);

      ctx.lineWidth = 1.3;
      ctx.strokeStyle = "rgba(139, 77, 255, 0.85)";
      ctx.shadowColor = "rgba(139, 77, 255, 0.8)";
      ctx.shadowBlur = 8;

      // vertical lines converge on the vanishing point
      for (var v = -14; v <= 14; v++) {
        ctx.beginPath();
        ctx.moveTo(W / 2, horizon);
        ctx.lineTo(W / 2 + v * (W / 6), H);
        ctx.stroke();
      }

      // horizontal lines scroll toward the viewer
      for (var h = 0; h < 16; h++) {
        var p = ((h + offset) % 16) / 16;
        var y = horizon + Math.pow(p, 2.4) * (H - horizon);
        ctx.globalAlpha = 0.25 + p * 0.75;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // horizon glow
      var glow = ctx.createLinearGradient(0, horizon - 20, 0, horizon + 24);
      glow.addColorStop(0, "rgba(255, 77, 141, 0)");
      glow.addColorStop(0.5, "rgba(255, 77, 141, 0.55)");
      glow.addColorStop(1, "rgba(255, 77, 141, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizon - 20, W, 44);
    }

    var last = 0;
    function loop(now) {
      if (now - last > 32) {
        offset += 0.09;
        draw(now);
        last = now;
      }
      window.requestAnimationFrame(loop);
    }

    draw(0);
    if (!reduceMotion) window.requestAnimationFrame(loop);
  }

  /* ---------- 8. Pointer glow on panels ---------- */
  function initPointerGlow() {
    if (reduceMotion) return;
    var panels = document.querySelectorAll("[data-glow]");
    Array.prototype.forEach.call(panels, function (panel) {
      panel.addEventListener("mousemove", function (e) {
        var rect = panel.getBoundingClientRect();
        panel.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width * 100) + "%");
        panel.style.setProperty("--my", ((e.clientY - rect.top) / rect.height * 100) + "%");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initHeader();
    initActiveLink();
    initReveal();
    initGameGrid();
    initArcade();
    initContactForm();
    initYear();
    initHeroGrid();
    initPointerGlow();
  });
})();
