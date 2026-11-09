# Add a keepsake cabinet to your own page

No backend or API is required. Embed the public workshop in an iframe. When someone chooses **Place in cabinet**, the workshop sends the completed keepsake JSON to the embedding page; you decide where to store it.

1. Open the workshop from your page:

```js
const WORKSHOP = 'https://elisekaiu.github.io/companion-keepsakes/';
iframe.src = WORKSHOP + '?host=' + encodeURIComponent(location.origin);
```

Optional `&you=Name&companion=Name` prefills the two names. `#k=…` reopens an existing object.

2. Listen for the completed object and verify **both its origin and its source window**:

```js
const WORKSHOP_ORIGIN = 'https://elisekaiu.github.io';
addEventListener('message', event => {
  if (event.origin !== WORKSHOP_ORIGIN || event.source !== iframe.contentWindow) return;
  const message = event.data;
  if (message?.type !== 'companion-keepsake' || message.action !== 'keep') return;
  const k = message.keepsake;
  if (k?.format !== 'companion-keepsake' || k.v !== 1 || !/^#k=/.test(k.link || '')) return;
  save(k); // Your storage: localStorage, database, downloaded file, etc.
});
```

3. Display `k.title`, `k.display.thumbnail` (an optional small data-URL image), `k.contributions` (each side's choices and words) and the engraving in `k.display.plaque`.
4. To reopen its 3D view without editing, set the iframe URL to `WORKSHOP + '?embed=view' + k.link`.

A complete, editable [single-file cabinet example](../examples/cabinet/index.html) is included. Run the example through an HTTP(S) server, not `file://` (which lacks a normal origin). The [keepsake format](KEEPSAKE.md) and [JSON schema](../schema/keepsake.schema.json) describe the full data.

**Privacy:** A keepsake URL or JSON file can contain both people's sealed words and wishes. Keeping it in your browser does not upload it, but **sharing the link or the file shares those words** with the recipient.
