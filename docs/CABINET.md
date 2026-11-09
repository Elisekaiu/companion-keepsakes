# 在你自己的页面里放一个收藏柜

不需要服务器，也不需要接任何接口。工坊放在一个 iframe 里；有人按下「放进收藏柜」时，你的页面会收到一份完整的纪念品（JSON），存在哪里由你决定。

1. 用 iframe 打开工坊：`https://elisekaiu.github.io/companion-keepsakes/?host=<你的页面的 origin>`
   （可选：`&you=名字&companion=名字` 预填名字；`#k=…` 直接打开一件已有的纪念品。）
2. 监听消息，**一定要检查来源**：

```js
const WORKSHOP_ORIGIN = 'https://elisekaiu.github.io';
const frame = document.querySelector('#workshop'); // 你页面中的工坊 iframe
addEventListener('message', e => {
  if (e.origin !== WORKSHOP_ORIGIN || e.source !== frame.contentWindow) return;
  if (e.data?.type !== 'companion-keepsake' || e.data.action !== 'keep') return;
  const k = e.data.keepsake;
  if (k?.format !== 'companion-keepsake' || k.v !== 1 || !k.link?.startsWith('#k=')) return;
  save(k);                              // 存到你自己的地方：localStorage、数据库、文件……
});
```

3. 展示：`k.title`、`k.display.thumbnail`（一张小图）、`k.contributions`（每一边放下了什么、为什么、藏起来的话）。
4. 重新打开 3D：iframe 指向 `https://elisekaiu.github.io/companion-keepsakes/?embed=view` + `k.link`（`#k=…` 那一段）。

完整的单文件例子：[examples/cabinet/index.html](../examples/cabinet/index.html)。页面需要通过 http(s) 打开（`file://` 没有 origin）。

注意：纪念品 JSON 和 `#k=…` 链接可能包含双方封存的悄悄话。收藏在自己的浏览器里不会自动上传，但**主动分享链接或 JSON 就等于分享其中的内容**。
