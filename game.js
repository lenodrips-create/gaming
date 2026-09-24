/* ============================================================
   js/game.js
   Shared toolkit for every game in games/.
   Exposes window.GameKit with: sound, saved scores, a frame loop,
   keyboard helpers and pointer helpers.
   Loaded by: games/game1/index.html, games/game2/index.html
   ============================================================ */

(function (global) {
  "use strict";

  /* ---------- Saved scores ---------- */
  var memoryStore = {};

  var storage = {
    read: function (key, fallback) {
      try {
        var raw = global.localStorage.getItem(key);
        return raw === null ? fallback : raw;
      } catch (err) {
        return key in memoryStore ? memoryStore[key] : fallback;
      }
    },
    write: function (key, value) {
      try {
        global.localStorage.setItem(key, String(value));
      } catch (err) {
        memoryStore[key] = String(value);
      }
    }
  };

  function bestScore(key) {
    return parseInt(storage.read(key, "0"), 10) || 0;
  }

  function saveBest(key, score) {
    var current = bestScore(key);
    if (score > current) {
      storage.write(key, score);
      return true;
    }
    return false;
  }

  /* ---------- Sound (synthesised, so there are no missing files) ---------- */
  var audioCtx = null;
  var muted = storage.read("cc.muted", "off") === "on";

  function context() {
    if (!audioCtx) {
      var Ctor = global.AudioContext || global.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  var tones = {
    pickup:  { freq: 660, to: 990, dur: 0.12, type: "square" },
    bounce:  { freq: 340, to: 420, dur: 0.07, type: "triangle" },
    brick:   { freq: 520, to: 640, dur: 0.09, type: "square" },
    level:   { freq: 440, to: 880, dur: 0.35, type: "sawtooth" },
    over:    { freq: 320, to: 90,  dur: 0.45, type: "sawtooth" },
    click:   { freq: 240, to: 300, dur: 0.05, type: "sine" }
  };

  function play(name) {
    if (muted) return;
    var preset = tones[name];
    if (!preset) return;
    var ctx = context();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var now = ctx.currentTime;

    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, preset.to), now + preset.dur);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + preset.dur + 0.02);
  }

  function toggleMute() {
    muted = !muted;
    storage.write("cc.muted", muted ? "on" : "off");
    return muted;
  }

  /* ---------- Frame loop ---------- */
  function createLoop(onFrame) {
    var rafId = null;
    var last = 0;
    var running = false;

    function frame(now) {
      if (!running) return;
      var delta = last ? Math.min(now - last, 60) : 16;
      last = now;
      onFrame(delta, now);
      rafId = global.requestAnimationFrame(frame);
    }

    return {
      start: function () {
        if (running) return;
        running = true;
        last = 0;
        rafId = global.requestAnimationFrame(frame);
      },
      stop: function () {
        running = false;
        if (rafId) global.cancelAnimationFrame(rafId);
        rafId = null;
      },
      isRunning: function () { return running; }
    };
  }

  /* ---------- Input helpers ---------- */
  var ARROWS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    W: "up", S: "down", A: "left", D: "right"
  };

  function onDirection(handler) {
    global.addEventListener("keydown", function (event) {
      var dir = ARROWS[event.key];
      if (!dir) return;
      event.preventDefault();
      handler(dir);
    });
  }

  function onSwipe(element, handler) {
    var startX = 0;
    var startY = 0;
    var tracking = false;

    element.addEventListener("touchstart", function (event) {
      var touch = event.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    }, { passive: true });

    element.addEventListener("touchend", function (event) {
      if (!tracking) return;
      tracking = false;
      var touch = event.changedTouches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) handler(dx > 0 ? "right" : "left");
      else handler(dy > 0 ? "down" : "up");
    }, { passive: true });
  }

  /* ---------- Overlay + HUD helpers ---------- */
  function overlay(id) {
    var node = document.getElementById(id);
    return {
      show: function (title, text, buttonLabel) {
        if (!node) return;
        var h = node.querySelector("h2");
        var p = node.querySelector("p");
        var b = node.querySelector("button");
        if (h) h.textContent = title;
        if (p) p.textContent = text;
        if (b && buttonLabel) b.textContent = buttonLabel;
        node.hidden = false;
      },
      hide: function () { if (node) node.hidden = true; },
      node: node
    };
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  global.GameKit = {
    storage: storage,
    bestScore: bestScore,
    saveBest: saveBest,
    play: play,
    toggleMute: toggleMute,
    isMuted: function () { return muted; },
    createLoop: createLoop,
    onDirection: onDirection,
    onSwipe: onSwipe,
    overlay: overlay,
    setText: setText
  };
})(window);
