/* Regime bootstrap illustration.
   A synthetic log-price path is generated block by block, one block per regime,
   each with its own drift and volatility. Three views:
   - original: blocks in calendar order
   - iid: every single day's return drawn with replacement (structure dissolved)
   - regime: whole regime blocks drawn with replacement (structure kept)
   Deterministic seed so the page looks the same on every load. */
(function () {
  'use strict';
  var canvas = document.getElementById('regimes-canvas');
  if (!canvas || !canvas.getContext) return;

  var REGIMES = [
    { name: 'PRE_GFC',          days: 130, drift:  0.00035, vol: 0.0048 },
    { name: 'GFC',              days:  70, drift: -0.00120, vol: 0.0135 },
    { name: 'EURO_CRISIS_ERA',  days: 120, drift: -0.00045, vol: 0.0090 },
    { name: 'TAPER_TRANSITION', days:  80, drift:  0.00010, vol: 0.0055 },
    { name: 'NIRP_DOVISH',      days: 140, drift: -0.00025, vol: 0.0042 },
    { name: 'COVID',            days:  50, drift: -0.00090, vol: 0.0160 },
    { name: 'INFLATION_SHOCK',  days:  90, drift: -0.00060, vol: 0.0080 },
    { name: 'DISINFLATION',     days: 100, drift:  0.00050, vol: 0.0058 }
  ];
  var FILLS = ['#2f5fd6', '#c8321f', '#b5457c', '#d9822b', '#2a9d8f', '#6b6f78', '#7b5cd6', '#5f8a1f'];

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  var seeded = rng(20260105);
  var blocks = REGIMES.map(function (rg, i) {
    var rets = [];
    for (var d = 0; d < rg.days; d++) rets.push(rg.drift + rg.vol * gauss(seeded));
    return { idx: i, name: rg.name, rets: rets };
  });
  var totalDays = blocks.reduce(function (a, b) { return a + b.rets.length; }, 0);

  function segsOriginal() {
    return blocks.map(function (b) { return { idx: b.idx, rets: b.rets }; });
  }
  function segsRegime(r) {
    var out = [], n = 0;
    while (n < totalDays) {
      var b = blocks[Math.floor(r() * blocks.length)];
      var take = Math.min(b.rets.length, totalDays - n);
      out.push({ idx: b.idx, rets: b.rets.slice(0, take) });
      n += take;
    }
    return out;
  }
  function segsIID(r) {
    var pool = [];
    blocks.forEach(function (b) { b.rets.forEach(function (x) { pool.push({ idx: b.idx, x: x }); }); });
    var out = [];
    for (var n = 0; n < totalDays; n++) {
      var p = pool[Math.floor(r() * pool.length)];
      out.push({ idx: p.idx, rets: [p.x] });
    }
    return out;
  }

  function pathFrom(segs) {
    var pts = [0], lvl = 0, ownerByDay = [];
    segs.forEach(function (s) {
      s.rets.forEach(function (x) { lvl += x; pts.push(lvl); ownerByDay.push(s.idx); });
    });
    return { pts: pts, owner: ownerByDay, segs: segs };
  }

  var views = { original: pathFrom(segsOriginal()) };
  var reseed = { iid: 7, regime: 11 };
  function makeView(method) {
    var r = rng(method === 'iid' ? (reseed.iid++) * 7919 : (reseed.regime++) * 104729);
    return pathFrom(method === 'iid' ? segsIID(r) : segsRegime(r));
  }

  var ctx = canvas.getContext('2d');
  var current = views.original, previous = null, t0 = 0, animating = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = 900;

  function ease(x) { return 1 - Math.pow(2, -10 * x); }

  var pad = { l: 56, r: 24, t: 44, b: 40 };
  var mono = '500 11px "Fragment Mono", ui-monospace, monospace';
  var label = '600 11px "Archivo", system-ui, sans-serif';

  function draw(view, blend) {
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr; canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var narrow = W < 640;
    var pl = narrow ? 40 : pad.l, pr = narrow ? 12 : pad.r;
    var x0 = pl, x1 = W - pr, y0 = pad.t, y1 = H - pad.b;
    var iw = x1 - x0, ih = y1 - y0;

    var pts = view.pts;
    if (blend != null && previous) {
      pts = view.pts.map(function (v, i) { return previous.pts[i] + (v - previous.pts[i]) * blend; });
    }
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < pts.length; i++) { if (pts[i] < lo) lo = pts[i]; if (pts[i] > hi) hi = pts[i]; }
    var span = Math.max(hi - lo, 0.2); lo -= span * 0.08; hi += span * 0.08;
    var xs = function (i) { return x0 + (i / totalDays) * iw; };
    var ys = function (v) { return y1 - ((v - lo) / (hi - lo)) * ih; };

    // regime bands
    var day = 0, alpha = blend == null ? 1 : blend;
    view.segs.forEach(function (s) {
      var a = xs(day), b = xs(day + s.rets.length);
      ctx.globalAlpha = 0.16 * alpha;
      ctx.fillStyle = FILLS[s.idx];
      ctx.fillRect(a, y0, Math.max(b - a, 0.6), ih);
      day += s.rets.length;
    });
    if (previous && blend != null && blend < 1) {
      var d2 = 0;
      previous.segs.forEach(function (s) {
        var a = xs(d2), b = xs(d2 + s.rets.length);
        ctx.globalAlpha = 0.16 * (1 - blend);
        ctx.fillStyle = FILLS[s.idx];
        ctx.fillRect(a, y0, Math.max(b - a, 0.6), ih);
        d2 += s.rets.length;
      });
    }
    ctx.globalAlpha = 1;

    // band labels only where a block is wide enough
    day = 0;
    var lastLabelEnd = -Infinity;
    ctx.font = label; ctx.textBaseline = 'top'; ctx.fillStyle = '#0f1419';
    view.segs.forEach(function (s) {
      var a = xs(day), b = xs(day + s.rets.length);
      var name = REGIMES[s.idx].name, tw = ctx.measureText(name).width;
      if (!narrow && b - a > tw + 16 && a + 8 > lastLabelEnd + 12) {
        ctx.globalAlpha = alpha;
        ctx.fillText(name, a + 8, y0 + 8);
        ctx.globalAlpha = 1;
        lastLabelEnd = a + 8 + tw;
      }
      day += s.rets.length;
    });

    // grid + axis
    ctx.strokeStyle = '#cfd4d0'; ctx.lineWidth = 1;
    ctx.font = mono; ctx.fillStyle = '#3a424b'; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (var g = 0; g <= 4; g++) {
      var v = lo + (hi - lo) * (g / 4), y = Math.round(ys(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      if (!narrow) ctx.fillText((v >= 0 ? '+' : '') + (v * 100).toFixed(0) + '%', x0 - 8, y);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('day 0', x0, y1 + 18);
    ctx.textAlign = 'right';
    ctx.fillText('day ' + totalDays, x1, y1 + 18);
    ctx.textAlign = 'left';

    // drawdown fill (from running max)
    ctx.beginPath();
    var runMax = -Infinity;
    for (i = 0; i < pts.length; i++) {
      if (pts[i] > runMax) runMax = pts[i];
      var x = xs(i);
      if (i === 0) ctx.moveTo(x, ys(runMax)); else ctx.lineTo(x, ys(runMax));
    }
    for (i = pts.length - 1; i >= 0; i--) ctx.lineTo(xs(i), ys(pts[i]));
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,50,31,0.12)';
    ctx.fill();

    // path
    ctx.beginPath();
    for (i = 0; i < pts.length; i++) {
      x = xs(i); var yy = ys(pts[i]);
      if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = '#0f1419'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
    ctx.stroke();

    // end marker
    var lastY = ys(pts[pts.length - 1]);
    ctx.fillStyle = '#1749d6';
    ctx.fillRect(x1 - 3, lastY - 3, 6, 6);
    ctx.font = mono; ctx.fillStyle = '#1749d6'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText((pts[pts.length - 1] * 100).toFixed(1) + '%', x1 - 10, lastY);
    ctx.textAlign = 'left';
  }

  function frame(now) {
    if (!animating) return;
    var p = Math.min(1, (now - t0) / DUR);
    draw(current, ease(p));
    if (p < 1) requestAnimationFrame(frame);
    else { animating = false; previous = null; draw(current, null); }
  }

  function show(method) {
    var next = method === 'original' ? views.original : makeView(method);
    if (reduced) { current = next; previous = null; draw(current, null); return; }
    previous = current; current = next; t0 = performance.now(); animating = true;
    requestAnimationFrame(frame);
  }

  var buttons = document.querySelectorAll('.regimes-controls [data-method]');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      buttons.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      show(b.getAttribute('data-method'));
    });
  });

  var legend = document.getElementById('regimes-legend');
  if (legend) {
    REGIMES.forEach(function (rg, i) {
      var li = document.createElement('li');
      var sw = document.createElement('span');
      sw.className = 'swatch'; sw.style.background = FILLS[i];
      li.appendChild(sw); li.appendChild(document.createTextNode(rg.name));
      legend.appendChild(li);
    });
  }

  var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { if (!animating) draw(current, null); }) : null;
  if (ro) ro.observe(canvas); else window.addEventListener('resize', function () { if (!animating) draw(current, null); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!animating) draw(current, null); });
  draw(current, null);
})();
