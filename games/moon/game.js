/* 月轮 · 原创圆环对齐解谜
   规则：点一个环，它 +1 格，和它相连的环 -1 格；缺口全部朝下即通关。
   关卡由「已解状态」随机打乱生成，保证有解。 */
(function () {
  "use strict";
  var cv = document.getElementById("cv");
  YX.fitCanvas(cv);
  var ctx = cv.getContext("2d");

  var STEPS = 12;            // 每个环分成 12 格
  var LEVELS = [
    { rings: 3, links: [[0, 1], [1, 2]] },
    { rings: 4, links: [[0, 1], [1, 2], [2, 3]] },
    { rings: 5, links: [[0, 1], [2, 3], [1, 2], [3, 4]] },
    { rings: 6, links: [[0, 1], [0, 2], [3, 4], [4, 5], [2, 3]] },
  ];

  var state = "ready", level = 0, rings = [], links = [], moves = 0, flash = 0;

  function scramble(n) {
    rings = [];
    for (var i = 0; i < n; i++) rings.push({ gap: 0, base: 0, anim: 0 });
    var times = 6 + n * 2;
    for (var k = 0; k < times; k++) {
      var i2 = Math.floor(Math.random() * n);
      rotate(i2);
    }
    // 别一开局就是解好的
    if (solved()) rotate(0);
    rings.forEach(function (r) { r.anim = r.gap; });
  }

  function rotate(i) {
    rings[i].gap = (rings[i].gap + 1) % STEPS;
    links.forEach(function (pair) {
      if (pair[0] === i) rings[pair[1]].gap = (rings[pair[1]].gap + STEPS - 1) % STEPS;
      if (pair[1] === i) rings[pair[0]].gap = (rings[pair[0]].gap + STEPS - 1) % STEPS;
    });
  }

  function solved() {
    return rings.every(function (r) { return r.gap === 0; });
  }

  function loadLevel(i) {
    level = i % LEVELS.length;
    var L = LEVELS[level];
    links = L.links;
    moves = 0;
    flash = 0;
    scramble(L.rings);
    document.getElementById("lv").textContent = level + 1;
  }

  function geometry() {
    var w = cv.__w, h = cv.__h;
    var cx = w / 2, cy = h * 0.46;
    var maxR = Math.min(w, h) * 0.44;
    var steps = rings.length;
    var out = [];
    for (var i = 0; i < steps; i++) {
      var r = maxR * (1 - i * (0.72 / Math.max(1, steps)));
      out.push({ cx: cx, cy: cy, r: r, index: i });
    }
    return out;
  }

  function hitRing(p) {
    var gs = geometry();
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i];
      var d = Math.hypot(p.x - g.cx, p.y - g.cy);
      var thickness = Math.max(14, g.r * 0.16);
      if (Math.abs(d - g.r) < thickness) return i;
    }
    return -1;
  }

  function tap(p) {
    var i = hitRing(p);
    if (i < 0) return;
    rotate(i);
    moves++;
    rings.forEach(function (r, k) { r.anim += (r.gap - r.anim); });
    YX.beep(360 + i * 70, 0.07, "triangle", 0.05);
    if (solved()) {
      flash = 1;
      setTimeout(win, 260);
    }
  }

  function win() {
    state = "win";
    document.getElementById("wlv").textContent = level + 1;
    document.getElementById("win").hidden = false;
    YX.beep(880, 0.16, "sine", 0.06);
    setTimeout(function () { YX.beep(1170, 0.2, "sine", 0.05); }, 110);
  }

  function draw() {
    var w = cv.__w, h = cv.__h;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#060a14"); g.addColorStop(1, "#0b1324");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    var gs = geometry();
    var cx = gs[0].cx, cy = gs[0].cy;

    // 月光：从圆心向下的参考线
    var pulse = 0.5 + Math.sin(performance.now() / 700) * 0.12;
    var lg = ctx.createLinearGradient(cx, cy, cx, h);
    lg.addColorStop(0, "rgba(180,210,255," + (0.22 + flash * 0.5) + ")");
    lg.addColorStop(1, "rgba(180,210,255,0)");
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx, h * 0.96); ctx.stroke();

    // 环
    rings.forEach(function (r, i) {
      var geo = gs[i];
      var gapAngle = (Math.PI / 2) + (r.anim / STEPS) * Math.PI * 2; // 0 格 = 朝下
      var span = (Math.PI * 2) / STEPS * 1.25;                        // 缺口宽度
      var thick = Math.max(10, geo.r * 0.11);
      var aligned = r.gap === 0;
      ctx.lineWidth = thick;
      ctx.lineCap = "round";
      ctx.strokeStyle = aligned ? "rgba(143,182,255,.95)" : "rgba(150,170,215,.55)";
      ctx.beginPath();
      ctx.arc(geo.cx, geo.cy, geo.r, gapAngle + span / 2, gapAngle - span / 2 + Math.PI * 2);
      ctx.stroke();
      if (aligned) {
        ctx.strokeStyle = "rgba(143,182,255,.22)";
        ctx.lineWidth = thick + 10;
        ctx.beginPath();
        ctx.arc(geo.cx, geo.cy, geo.r, gapAngle + span / 2, gapAngle - span / 2 + Math.PI * 2);
        ctx.stroke();
      }
    });

    // 圆心
    ctx.fillStyle = "rgba(223,233,255,.9)";
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

    if (flash > 0) {
      flash = Math.max(0, flash - 0.02);
      ctx.fillStyle = "rgba(143,182,255," + flash * 0.18 + ")";
      ctx.fillRect(0, 0, w, h);
    }
  }

  YX.input(cv, {
    down: function (p) { if (state === "ready") return; if (state === "play") tap(p); },
  });

  YX.loop(function () {}, draw);

  document.getElementById("go").addEventListener("click", function () {
    state = "play";
    document.getElementById("start").hidden = true;
    loadLevel(0);
  });
  document.getElementById("next").addEventListener("click", function () {
    document.getElementById("win").hidden = true;
    state = "play";
    loadLevel(level + 1);
  });
  window.addEventListener("resize", function () {});
  loadLevel(0);
})();
