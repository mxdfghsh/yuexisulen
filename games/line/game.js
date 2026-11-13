/* 汐岸速写 · 原创一笔画
   规则：每条边只能走一次，从任意点开始，拖过整张图即通关。 */
(function () {
  "use strict";
  var cv = document.getElementById("cv");
  YX.fitCanvas(cv);
  var ctx = cv.getContext("2d");

  // 关卡：节点坐标用 0-1 归一化，方便适配屏幕
  var LEVELS = [
    { // 三角形
      nodes: [[0.5, 0.28], [0.24, 0.7], [0.76, 0.7]],
      edges: [[0, 1], [1, 2], [2, 0]],
    },
    { // 房子
      nodes: [[0.32, 0.42], [0.68, 0.42], [0.68, 0.74], [0.32, 0.74], [0.5, 0.24]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4]],
    },
    { // 菱形加中轴
      nodes: [[0.5, 0.22], [0.76, 0.5], [0.5, 0.78], [0.24, 0.5], [0.5, 0.5]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [2, 4]],
    },
    { // 信封
      nodes: [[0.24, 0.34], [0.76, 0.34], [0.76, 0.7], [0.24, 0.7], [0.5, 0.52]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]],
    },
    { // 五角星一笔画（10 个点太密，改成五角外框 + 内五边形）
      nodes: [[0.5, 0.18], [0.82, 0.38], [0.7, 0.76], [0.3, 0.76], [0.18, 0.38], [0.5, 0.34], [0.68, 0.52], [0.57, 0.68], [0.43, 0.68], [0.32, 0.52]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9], [5, 6], [6, 7], [7, 8], [8, 9], [9, 5]],
    },
  ];

  var state = "ready", level = 0, nodes = [], edges = [], used = [], path = [], dragging = null, steps = 0, R = 18;

  function loadLevel(i) {
    level = i % LEVELS.length;
    var L = LEVELS[level];
    var w = cv.__w, h = cv.__h;
    var pad = 46;
    nodes = L.nodes.map(function (p) {
      return { x: pad + p[0] * (w - pad * 2), y: pad + p[1] * (h - pad * 2), r: R };
    });
    edges = L.edges.map(function (e, idx) { return { a: e[0], b: e[1], used: false, idx: idx }; });
    used = [];
    path = [];
    steps = 0;
    dragging = null;
    document.getElementById("lv").textContent = level + 1;
    updateLeft();
  }

  function updateLeft() {
    var left = edges.filter(function (e) { return !e.used; }).length;
    document.getElementById("left").textContent = left;
    return left;
  }

  function nodeAt(x, y) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if ((x - n.x) * (x - n.x) + (y - n.y) * (y - n.y) <= (n.r + 14) * (n.r + 14)) return i;
    }
    return -1;
  }

  function edgeBetween(a, b) {
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      if (!e.used && ((e.a === a && e.b === b) || (e.a === b && e.b === a))) return e;
    }
    return null;
  }

  function tryStart(p) {
    var i = nodeAt(p.x, p.y);
    if (i < 0) return;
    dragging = { from: i, to: i, x: p.x, y: p.y };
    path = [i];
    YX.beep(520, 0.05, "sine", 0.04);
  }

  function tryMove(p) {
    if (!dragging) return;
    dragging.x = p.x; dragging.y = p.y;
    var i = nodeAt(p.x, p.y);
    if (i < 0 || i === dragging.from) return;
    var e = edgeBetween(dragging.from, i);
    if (!e) return;
    e.used = true;
    steps++;
    path.push(i);
    dragging.from = i;
    YX.beep(640 + (steps % 5) * 40, 0.06, "triangle", 0.05);
    if (updateLeft() === 0) win();
  }

  function win() {
    state = "win";
    document.getElementById("steps").textContent = steps;
    document.getElementById("win").hidden = false;
    YX.beep(880, 0.18, "sine", 0.06);
    setTimeout(function () { YX.beep(1180, 0.22, "sine", 0.05); }, 120);
  }

  function draw() {
    var w = cv.__w, h = cv.__h;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#070b16"); g.addColorStop(1, "#0c1426");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // 背景水纹
    ctx.strokeStyle = "rgba(120,160,240,.06)";
    ctx.lineWidth = 1;
    for (var i = 0; i < 7; i++) {
      var y = h * (0.12 + i * 0.13);
      ctx.beginPath();
      for (var x = 0; x <= w; x += 14) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 6);
      }
      ctx.stroke();
    }

    // 边
    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      ctx.strokeStyle = e.used ? "rgba(143,182,255,.9)" : "rgba(150,170,215,.28)";
      ctx.lineWidth = e.used ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });

    // 拖动中的虚线
    if (dragging) {
      var from = nodes[dragging.from];
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = "rgba(201,170,255,.55)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(dragging.x, dragging.y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 节点
    nodes.forEach(function (n, i) {
      var on = path.indexOf(i) >= 0;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = on ? "rgba(143,182,255,.9)" : "rgba(14,22,38,.95)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = on ? "#cfe0ff" : "rgba(150,170,215,.6)";
      ctx.stroke();
    });
  }

  YX.input(cv, {
    down: function (p) { if (state === "ready") state = "play"; if (state === "play") tryStart(p); },
    move: function (p) { if (state === "play") tryMove(p); },
    up: function () { dragging = null; },
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

  window.addEventListener("resize", function () { loadLevel(level); });
  loadLevel(0);
})();
