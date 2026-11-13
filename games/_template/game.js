/* 游戏名 · 模板
   YX 提供了：fitCanvas / loop / input / beep / store / save
   复制这个目录改名就能开新游戏。 */
(function () {
  "use strict";
  var cv = document.getElementById("cv");
  YX.fitCanvas(cv);
  var ctx = cv.getContext("2d");

  var playing = false;

  YX.input(cv, {
    down: function (p) { if (playing) { /* 触摸 */ } },
    move: function (p) { if (playing) { /* 拖动 */ } },
    up: function () { },
    key: function (k, d) { if (playing && d) { /* 键盘 */ } },
  });

  YX.loop(function (dt) {
    if (!playing) return;
    // 每帧更新
  }, function () {
    var w = cv.__w, h = cv.__h;
    ctx.fillStyle = "#080d18";
    ctx.fillRect(0, 0, w, h);
    // 每帧绘制
  });

  document.getElementById("go").addEventListener("click", function () {
    playing = true;
    document.getElementById("start").hidden = true;
  });
})();
