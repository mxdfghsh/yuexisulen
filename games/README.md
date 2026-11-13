# 怎么往月汐加游戏

每个游戏一个目录，结构固定：

```
games/
  你的游戏名/
    index.html    ← 游戏页面（照抄 _template/index.html 改名即可）
    game.js       ← 全部逻辑写这里
    （其他素材随意放这里）
```

## 三条规则

1. **不要引用任何外部地址**：脚本、字体、图片、音频都不许外链。
2. **素材放自己目录里**：图片用相对路径 `./xxx.png`。
3. **必须有 `<a class="back" href="../../index.html">← 退出</a>`**，否则进去了出不来。

## 加完之后

首页 `index.html` 的 `<section class="games">` 里加一张卡：

```html
<a class="card" href="games/你的游戏名/index.html">
  <span class="ico">🎮</span>
  <h2>游戏名</h2>
  <p>一句话说明玩法。</p>
  <span class="go">开始 →</span>
</a>
```

再把 `sw.js` 的 `CACHE` 版本 +1，把新文件加进 `ASSETS` 列表，就能离线玩了。
