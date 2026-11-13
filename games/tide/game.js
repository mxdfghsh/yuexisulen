/* 潮汐跳 · 原创小游戏
   玩法：按住并左右拖动控制落点，落到浮板自动弹起；潮水持续上涨。 */
(function () {
  "use strict";
  var cv = document.getElementById("cv");
  YX.fitCanvas(cv);
  var ctx = cv.getContext("2d");

  var W, H;
  function syncSize() { W = cv.__w; H = cv.__h; }

  var G = 2100;          // 重力 px/s²
  var JUMP = 760;        // 起跳速度
  var MOVE = 1400;       // 水平加速度
  var MAXVX = 520;

  var state = "ready";   // ready | play | over
  var player, plats, tide, camY, score, best, particles, holding, targetX, sway;

  best = YX.store("tide.best", 0);

  function reset() {
    syncSize();
    player = { x: W / 2, y: H * 0.72, vx: 0, vy: 0, r: 13, onGround: false };
    camY = 0;
    tide = H * 0.9;
    score = 0;
    particles = [];
    holding = false;
    targetX = W / 2;
    sway = 0;
    plats = [];
    // 起始板
    plats.push({ x: W / 2 - 55, y: H * 0.86, w: 110, baseX: W / 2 - 55, move: 0, phase: 0 });
    var y = H * 0.86;
    while (y > -H * 3) {
      y -= 92 + Math.random() * 70;
      makePlat(y);
    }
  }

  function makePlat(y) {
    var w = 74 + Math.random() * 54;
    var x = 16 + Math.random() * (W - 32 - w);
    var move = Math.random() < 0.22 ? 40 + Math.random() * 60 : 0;
    plats.push({ x: x, y: y, w: w, baseX: x, move: move, phase: Math.random() * Math.PI * 2 });
  }

  function ensurePlats() {
    var top = plats.reduce(function (a, p) { return Math.min(a, p.y); }, Infinity);
    while (top > camY - H * 2.4) {
      top -= 88 + Math.random() * 66;
      makePlat(top);
    }
    plats = plats.filter(function (p) { return p.y < camY + H * 2.2; });
  }

  function jump(power) {
    player.vy = -JUMP;
    player.onGround = false;
    YX.beep(430 + Math.random() * 40, 0.09, "triangle", 0.05);
    for (var i = 0; i < 6; i++) {
      particles.push({
        x: player.x, y: player.y + player.r,
        vx: (Math.random() - 0.5) * 220, vy: Math.random() * 120,
        life: 0.5, max: 0.5,
      });
    }
  }

  function die() {
    state = "over";
    YX.beep(160, 0.5, "sawtooth", 0.08);
    if (score > best) { best = Math.floor(score); YX.save("tide.best", best); }
    document.getElementById("final").textContent = Math.floor(score);
    document.getElementById("best").textContent = best;
    document.getElementById("over").hidden = false;
  }

  function update(dt) {
    if (state !== "play") return;
    sway += dt;
    // 水平控制：朝按下的位置加速
    var ax = 0;
    if (holding) ax = (targetX > player.x ? 1 : -1) * MOVE;
    player.vx += ax * dt;
    player.vx *= Math.pow(0.86, dt * 60 / 60 * 3);
    player.vx = Math.max(-MAXVX, Math.min(MAXVX, player.vx));
    if (!holding) player.vx *= Math.pow(0.8, dt * 4);
    player.x += player.vx * dt;
    if (player.x < player.r) { player.x = player.r; player.vx = Math.abs(player.vx) * 0.4; }
    if (player.x > W - player.r) { player.x = W - player.r; player.vx = -Math.abs(player.vx) * 0.4; }

    player.vy += G * dt;
    player.y += player.vy * dt;

    // 平台
    for (var i = 0; i < plats.length; i++) {
      var p = plats[i];
      if (p.move) {
        p.x = p.baseX + Math.sin(sway * 1.3 + p.phase) * p.move;
        p.x = Math.max(8, Math.min(W - p.w - 8, p.x));
      }
      if (player.vy > 0 &&
          player.y + player.r >= p.y && player.y + player.r <= p.y + 22 &&
          player.x + player.r * 0.7 >= p.x && player.x - player.r * 0.7 <= p.x + p.w) {
        player.y = p.y - player.r;
        jump();
        score = Math.max(score, (camY + H * 0.72 - player.y) / 10);
      }
    }

    // 相机跟随
    var target = player.y - H * 0.62;
    if (target < camY) camY += (target - camY) * Math.min(1, dt * 6);

    // 潮水上涨
    tide -= (26 + score * 0.5) * dt;

    // 掉出屏幕 / 被淹
    if (player.y > camY + H + 60 || player.y > tide - player.r) die();

    // 粒子
    for (var k = particles.length - 1; k >= 0; k--) {
      var q = particles[k];
      q.life -= dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 900 * dt;
      if (q.life <= 0) particles.splice(k, 1);
    }

    ensurePlats();
  }

  function draw() {
    syncSize();
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#060a14"); g.addColorStop(0.6, "#0a1120"); g.addColorStop(1, "#0d1730");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // 月亮
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#dfe9ff";
    ctx.beginPath(); ctx.arc(W * 0.78, H * 0.14, 26, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.14;
    ctx.beginPath(); ctx.arc(W * 0.78, H * 0.14, 60, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 平台
    for (var i = 0; i < plats.length; i++) {
      var p = plats[i];
      var y = p.y - camY;
      if (y < -40 || y > H + 40) continue;
      ctx.fillStyle = "rgba(143,182,255,.9)";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(p.x, y, p.w, 9, 5) : ctx.rect(p.x, y, p.w, 9);
      ctx.fill();
      ctx.fillStyle = "rgba(143,182,255,.18)";
      ctx.fillRect(p.x + 4, y + 9, p.w - 8, 3);
    }

    // 粒子
    for (var k = 0; k < particles.length; k++) {
      var q = particles[k];
      ctx.globalAlpha = Math.max(0, q.life / q.max) * 0.8;
      ctx.fillStyle = "#9fc0ff";
      ctx.fillRect(q.x, q.y - camY, 3, 3);
    }
    ctx.globalAlpha = 1;

    // 玩家
    var py = player.y - camY;
    ctx.fillStyle = "#eaf0ff";
    ctx.beginPath(); ctx.arc(player.x, py, player.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(143,182,255,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, py, player.r + 5, 0, Math.PI * 2); ctx.stroke();

    // 潮水
    var ty = tide - camY;
    if (ty < H) {
      var tg = ctx.createLinearGradient(0, ty, 0, H);
      tg.addColorStop(0, "rgba(60,110,200,.55)");
      tg.addColorStop(1, "rgba(20,40,90,.95)");
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(0, ty);
      for (var x = 0; x <= W; x += 12) {
        ctx.lineTo(x, ty + Math.sin(x * 0.02 + sway * 2) * 4);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    }
  }

  YX.input(cv, {
    down: function (p) { holding = true; targetX = p.x; },
    move: function (p) { targetX = p.x; },
    up: function () { holding = false; },
    key: function (k, d) {
      if (k === "ArrowLeft" || k === "a") { holding = d; targetX = -999; }
      if (k === "ArrowRight" || k === "d") { holding = d; targetX = 9999; }
      if (k === " ") { holding = d; targetX = player.x; }
    },
  });

  YX.loop(update, draw);

  function start() {
    reset();
    state = "play";
    document.getElementById("start").hidden = true;
    document.getElementById("over").hidden = true;
  }
  document.getElementById("go").addEventListener("click", start);
  document.getElementById("again").addEventListener("click", start);
  reset();
})();
