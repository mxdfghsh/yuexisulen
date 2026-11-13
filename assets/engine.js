/* 月汐 SULEN · 共用小引擎（无依赖）
   - fitCanvas: 处理高分屏与尺寸
   - loop: 固定步长的主循环
   - input: 指针 / 触摸 / 键盘统一成 pointer 事件
   - beep: WebAudio 极简音效（无外部文件）
   - store: localStorage 读写（失败不炸）
*/
(function (global) {
  "use strict";

  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.__w = w;
      canvas.__h = h;
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", function () { setTimeout(resize, 120); });
    return canvas;
  }

  function loop(step, render) {
    var last = performance.now(), acc = 0, STEP = 1000 / 60, running = true;
    function frame(now) {
      if (!running) return;
      var dt = Math.min(now - last, 250);
      last = now; acc += dt;
      var guard = 0;
      while (acc >= STEP && guard++ < 5) { step(STEP / 1000); acc -= STEP; }
      render();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { stop: function () { running = false; } };
  }

  function input(el, handlers) {
    var active = {};
    var map = {
      pointerdown: "down", pointermove: "move", pointerup: "up", pointercancel: "up",
    };
    function pos(e) {
      var r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    Object.keys(map).forEach(function (type) {
      el.addEventListener(type, function (e) {
        e.preventDefault();
        var cb = handlers[map[type]];
        if (!cb) return;
        active[e.pointerId] = map[type] !== "up";
        cb(pos(e), e);
      }, { passive: false });
    });
    if (handlers.key) {
      window.addEventListener("keydown", function (e) { handlers.key(e.key, true, e); });
      window.addEventListener("keyup", function (e) { handlers.key(e.key, false, e); });
    }
  }

  var audioCtx = null;
  function beep(freq, dur, type, gain) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.value = gain == null ? 0.06 : gain;
      o.connect(g); g.connect(audioCtx.destination);
      var t = audioCtx.currentTime;
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12));
      o.start(t); o.stop(t + (dur || 0.12) + 0.02);
    } catch (e) {}
  }

  function store(key, def) {
    try {
      var v = localStorage.getItem("yuexi:" + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }
  function save(key, val) {
    try { localStorage.setItem("yuexi:" + key, JSON.stringify(val)); } catch (e) {}
  }

  global.YX = { fitCanvas: fitCanvas, loop: loop, input: input, beep: beep, store: store, save: save };
})(window);
