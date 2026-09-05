/* Site behaviour: intro reveal (once per session), reactive display type,
   sticky chart sinking under the list, staggered entrances, inertia scroll. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- Intro: the chart draws itself, then lands in its slot ---------- */
  var FILLS = ['#2f5fd6', '#c8321f', '#b5457c', '#d9822b', '#2a9d8f', '#6b6f78', '#7b5cd6', '#5f8a1f'];
  function fallbackPath() {
    var s = 20260105 >>> 0, pts = [0], lvl = 0, N = 640;
    function r() { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    for (var i = 0; i < N; i++) { lvl += (r() - 0.5) * 0.02 + Math.sin(i / 90) * 0.002; pts.push(lvl); }
    var segs = []; for (var k = 0; k < 8; k++) segs.push({ idx: k, n: N / 8 });
    return { pts: pts, segs: segs, fills: FILLS, total: N };
  }
  function easeOut(x) { return 1 - Math.pow(2, -10 * x); }
  function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  function playIntro() {
    var data = window.__dvRegimes || fallbackPath();
    var overlay = document.createElement('div');
    overlay.className = 'intro';
    overlay.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas');
    cv.className = 'intro-canvas';
    var name = document.createElement('div');
    name.className = 'intro-name';
    var title = document.body.getAttribute('data-site') || '';
    var h = document.createElement('div');
    h.className = 'intro-title';
    title.split(' ').forEach(function (word, wi, arr) {
      var w = document.createElement('span'); w.className = 'word';
      Array.prototype.forEach.call(word, function (ch, ci) {
        var c = document.createElement('span'); c.className = 'ch'; c.textContent = ch;
        c.style.transitionDelay = (320 + (wi * 6 + ci) * 28) + 'ms';
        w.appendChild(c);
      });
      h.appendChild(w);
      if (wi < arr.length - 1) h.appendChild(document.createTextNode(' '));
    });
    var sub = document.createElement('div');
    sub.className = 'intro-sub mono';
    sub.textContent = 'FX fair value · rule-based strategy evaluation · regime-preserving bootstrap';
    var counter = document.createElement('div');
    counter.className = 'intro-counter mono';
    counter.textContent = 'day 0';
    name.appendChild(h); name.appendChild(sub);
    overlay.appendChild(cv); overlay.appendChild(name); overlay.appendChild(counter);
    document.body.appendChild(overlay);
    root.classList.remove('intro-pending');

    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var pts = data.pts, N = data.total;
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < pts.length; i++) { if (pts[i] < lo) lo = pts[i]; if (pts[i] > hi) hi = pts[i]; }
    var span = Math.max(hi - lo, 0.2); lo -= span * 0.1; hi += span * 0.1;

    function render(p, box) {
      /* p: draw progress 0..1; box: {x,y,w,h} region the chart occupies (full viewport at first) */
      ctx.clearRect(0, 0, W, H);
      var x0 = box.x, y0 = box.y, iw = box.w, ih = box.h;
      var xs = function (i) { return x0 + (i / N) * iw; };
      var ys = function (v) { return y0 + ih - ((v - lo) / (hi - lo)) * ih; };
      var upto = Math.floor(p * N);
      var day = 0;
      data.segs.forEach(function (sg) {
        var a = xs(day), b = xs(Math.min(day + sg.n, upto));
        if (b > a) { ctx.globalAlpha = 0.16; ctx.fillStyle = data.fills[sg.idx]; ctx.fillRect(a, y0, b - a, ih); }
        day += sg.n;
      });
      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (i = 0; i <= upto; i++) { var x = xs(i), y = ys(pts[i]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.strokeStyle = '#0f1419'; ctx.lineWidth = Math.max(1.2, 2.2 * (iw / W)); ctx.lineJoin = 'round'; ctx.stroke();
      if (upto > 0) { ctx.fillStyle = '#1749d6'; var ex = xs(upto), ey = ys(pts[upto]); ctx.fillRect(ex - 4, ey - 4, 8, 8); }
    }

    var full = { x: 0, y: H * 0.12, w: W, h: H * 0.76 };
    var speed = 1; try { speed = Math.max(1, Math.min(8, parseFloat(new URLSearchParams(location.search).get('introspeed')) || 1)); } catch (e) {}
    var t0 = performance.now(), DRAW = 1100 * speed, HOLD = 500 * speed, FLY = 800 * speed;
    requestAnimationFrame(function () { overlay.classList.add('is-on'); });

    function target() {
      var el = document.querySelector('.regimes-canvas');
      if (el) {
        var r = el.getBoundingClientRect();
        if (r.top < H && r.bottom > 0) return { x: r.left, y: r.top, w: r.width, h: r.height, onscreen: true };
        return { x: W * 0.2, y: H + 40, w: W * 0.6, h: H * 0.3, onscreen: false };
      }
      return { x: W * 0.35, y: H * 0.42, w: W * 0.3, h: H * 0.16, onscreen: false };
    }

    function frame(now) {
      var t = now - t0;
      if (t < DRAW) {
        var p = easeOut(t / DRAW);
        render(p, full);
        counter.textContent = 'day ' + Math.floor(p * N);
        requestAnimationFrame(frame);
      } else if (t < DRAW + HOLD) {
        render(1, full);
        counter.textContent = 'day ' + N;
        requestAnimationFrame(frame);
      } else if (t < DRAW + HOLD + FLY) {
        if (!overlay.classList.contains('is-leaving')) { overlay.classList.add('is-leaving'); document.body.classList.add('intro-done'); }
        var q = easeInOut((t - DRAW - HOLD) / FLY);
        var tg = target();
        var box = { x: full.x + (tg.x - full.x) * q, y: full.y + (tg.y - full.y) * q, w: full.w + (tg.w - full.w) * q, h: full.h + (tg.h - full.h) * q };
        cv.style.opacity = tg.onscreen ? String(1 - q * 0.9) : String(1 - q);
        render(1, box);
        requestAnimationFrame(frame);
      } else {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
    }
    requestAnimationFrame(frame);
  }
  var introWanted = root.classList.contains('intro-pending');
  if (introWanted && !reduced) {
    try { sessionStorage.setItem('dv-intro', '1'); } catch (e) {}
    playIntro();
  } else {
    root.classList.remove('intro-pending');
    document.body.classList.add('intro-done');
  }

  /* ---------- Reactive display type ---------- */
  function pressure(el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var chars = [];
    text.split(' ').forEach(function (word, wi, arr) {
      var w = document.createElement('span');
      w.className = 'word';
      w.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(word, function (ch) {
        var c = document.createElement('span');
        c.className = 'ch';
        c.textContent = ch;
        w.appendChild(c);
        chars.push({ el: c, wdth: 96, wght: 700, tw: 96, tg: 700 });
      });
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    if (reduced) return;
    var mx = -1e4, my = -1e4, running = false, radius = 260;
    function tick() {
      var moving = false;
      chars.forEach(function (c) {
        var r = c.el.getBoundingClientRect();
        var dx = r.left + r.width / 2 - mx, dy = r.top + r.height / 2 - my;
        var d = Math.sqrt(dx * dx + dy * dy);
        var t = Math.max(0, 1 - d / radius);
        t = t * t;
        c.tw = 96 + 29 * t; c.tg = 700 + 200 * t;
        c.wdth += (c.tw - c.wdth) * 0.16; c.wght += (c.tg - c.wght) * 0.16;
        if (Math.abs(c.tw - c.wdth) > 0.05 || Math.abs(c.tg - c.wght) > 0.5) moving = true;
        c.el.style.fontVariationSettings = '"wdth" ' + c.wdth.toFixed(2) + ', "wght" ' + c.wght.toFixed(1);
      });
      if (moving) requestAnimationFrame(tick); else running = false;
    }
    function wake() { if (!running) { running = true; requestAnimationFrame(tick); } }
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; wake(); }, { passive: true });
    document.addEventListener('pointerleave', function () { mx = -1e4; my = -1e4; wake(); });
    window.addEventListener('scroll', wake, { passive: true });
  }
  document.querySelectorAll('[data-pressure]').forEach(pressure);

  /* ---------- Sticky chart sinks under the sliding list ---------- */
  var sticky = document.querySelector('.regimes.is-sticky');
  var slab = document.querySelector('.slab');
  if (sticky && slab && !reduced) {
    var panel = sticky.querySelector('.regimes-panel');
    var head = sticky.querySelector('.regimes-head');
    var ticking = false;
    function sink() {
      ticking = false;
      var top = slab.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, 1 - top / window.innerHeight));
      var eased = p * p;
      if (panel) { panel.style.transform = 'translateY(' + (-40 * eased).toFixed(1) + 'px) scale(' + (1 - 0.05 * eased).toFixed(4) + ')'; panel.style.opacity = (1 - 0.6 * eased).toFixed(3); }
      if (head) head.style.opacity = (1 - 0.8 * p).toFixed(3);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(sink); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    sink();
  }

  /* ---------- Staggered entrances ---------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (revealables.length && 'IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealables.forEach(function (el, i) { el.style.setProperty('--i', String(i % 8)); io.observe(el); });
    /* Safety net: whatever the observer missed (print, full-page capture, odd scroll containers) shows after 2.5 s. */
    setTimeout(function () { revealables.forEach(function (el) { el.classList.add('in'); }); }, 2500);
    window.addEventListener('beforeprint', function () { revealables.forEach(function (el) { el.classList.add('in'); }); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Inertia scroll ---------- */
  if (window.Lenis && !reduced && window.matchMedia('(pointer: fine)').matches) {
    var lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1), target = id && document.getElementById(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -64 }); }
      });
    });
  }
})();
