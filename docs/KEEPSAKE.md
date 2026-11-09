# The keepsake artifact

A finished round can be carried in two forms. Both reopen exactly the same object.

## 1. Link (`#k=…`)

`index.html#k=<base64url(JSON)>`. The JSON holds both sealed halves in compact form:

```json
{ "f": 1, "c": "planet1", "R": "88DX", "o": "h",
  "H": { "h": "ground", "p": { "land": 6, "water": 3, "growth": 5, "dwelling": 2, "wonder": 4 },
         "w": "Lantern", "l": "…", "y": "…", "x": "…", "n": "Mira", "t": "2026-11-09T…", "f": "R3HH5X", "s": "<salt>" },
  "A": { "h": "sky", "p": { … }, "w": "Hollow", …, "f": "WXD3HM", "e": "R3HH5X", "k": "ai~planet1~…" },
  "m": "theme line", "ct": "…", "ot": "…", "kt": "…" }
```

The render state is **recomputed** from the halves with the recipe version named in `c`. Recipes are versioned and never change behaviour within a version.

## 2. Document (`*.keepsake.json`, format `companion-keepsake` v1)

This is the archival form. "Download keepsake file" saves it, and embedders receive it through `postMessage`. Its schema is in [`schema/keepsake.schema.json`](../schema/keepsake.schema.json).

| Field | Meaning |
|---|---|
| `format`, `v` | `"companion-keepsake"`, `1` |
| `id` | `<recipe>-<round>-<human seal>`, stable for the object |
| `recipe` | `{id, version, code, title}` |
| `title`, `round`, `seed`, `theme` | Name, round id (also the render seed), optional public theme |
| `createdAt`, `openedAt`, `keptAt` | ISO times |
| `participants` | `{human:{name, half}, ai:{name, half}}`. Names are whatever the people chose; there are no fixed roles |
| `mode` | `companion` (half each), `solo` (one person; a lucky draw records the parts kept as drawn in `leftToChance`) or `gift` (the AI made both halves; both contributions come from its one code) |
| `contributions.human` / `.ai` | Every pick (`n`, `id`, `name`, `meaning`), `leftToChance`, `word`, `line`, `why`, `wish`, `sealedAt`, `seal`; for the AI also its verbatim `code` and `echoedSeal` |
| `provenance` | `protocol`, `order` (`human-first` / `ai-first` / `solo` / `gift`), `humanSeal`, `aiEchoedSeal`, `sealMatches`, note |
| `display` | `accent`, `background`, `dark`, and optionally `thumbnail` (data URL) set by whoever stores it |
| `render` | `{renderer: "planet@1", spec}`: the full merged state, for archives and non-JS readers |
| `link` | The `#k=` fragment that reopens it |

## Reopening

- In the browser: `fromKeepsake(doc)` or `fromLink(link)` in `js/engine/keepsake.js`, then `mergeRound`.
- Anywhere else: open `<site>/index.html#k=…`, or `?embed=view#k=…` inside an iframe for a read-only view with its story.

## Integrating a private shelf

Open `<site>/index.html?host=<your-origin>` in an iframe (optionally `&you=<name>&companion=<name>` to prefill the two names, and `#new` to start a round or `#k=…` to show a finished one). When the person keeps the object, you receive:

```js
window.addEventListener('message', e => {
  if (e.origin !== SITE_ORIGIN || e.data?.type !== 'companion-keepsake' || e.data.action !== 'keep') return;
  saveSomewhere(e.data.keepsake); // validate first: format, v, recipe.code
});
```

Your shelf owns its storage. The public project never sees it.
