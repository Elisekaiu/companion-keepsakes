# Design decisions

## The core loop

```
choose half ─▶ hold to seal ─▶ invitation ─▶ companion writes a link ─▶ "something was added"
     ─▶ Open Together (hold) ─▶ reveal, alternating sides ─▶ explore ─▶ Keep this (hold) ─▶ shelf
```

Each step that commits something uses a press-and-hold (seal, open, keep). It is short enough not to be tedious, and deliberate enough that it can't happen by accident.

## Why the planet is the first vertical slice

| | Tiny Planet | Talisman | Snow Globe |
|---|---|---|---|
| Blind merge works | **Always**: the world needn't obey reality, so any combination is valid | Mostly: a palette can clash | Weakly: one moment needs one place and time, and blind halves can contradict |
| 3D cost | Low (sphere + scattered primitives) | Lowest | Highest (glass, refraction, base, particles inside) |
| Wow / replay | High: 8×7×7×8 × 7×7×8×7 × 8² combinations, plus resonances | Medium | High, but only if the beauty bar is met |
| Meaning slots | Many, varied | **Densest** (each bead is a slot) | Medium |

Order: **Planet → Talisman → Snow Globe.** The globe is the most romantic of the three, and also the one most likely to look cheap if rushed. It goes last, once the engine has carried two recipes.

## Merge mechanism

- **Complementary halves.** Each recipe splits its slots into two halves that never collide (Planet: Ground / Sky). The person chooses which half to take, which adds replay variety.
- **One shared slot.** Both sides place a *wonder*. Two different picks both appear. The same pick produces an **echo**, a small moment of "we chose the same thing".
- **Two-word name.** Each side writes one word, ordered by who sealed first.
- **Tint, never repaint.** The sky's light tints the land by a fixed amount. Your meadow under their aurora is still your meadow.
- **Resonances.** A fixed table of named interactions between two sealed picks (lantern flowers × dark sky → they glow). Each adds a render flag and a reveal caption naming both people. Nothing is generated from free text.
- **Determinism.** Merged state + round id → the same world every time, so a keepsake reopens identically.

## Sealed-choice architecture

- The human half is sealed in the browser: picks, word, line, why and wish, plus a random salt, are fingerprinted (cyrb53 → 6 characters).
- The invitation sent to the AI contains the round id, the fingerprint, the AI's half and an optional public theme line. **It never contains the human's choices.**
- The AI writes its half as a tilde code that is safe in a URL fragment. It can write it by hand, with no encoding. It echoes the human fingerprint.
- The first accepted AI half is stored verbatim. An identical resend is a no-op; a different one is refused.
- Missing or unknown AI picks are filled from the round seed and labelled "left to the stars", so a weaker model can still play. The reveal is honest about which picks were not chosen.
- **AI-first rounds:** an AI link with no matching local round starts a round in which the human chooses blind.
- This is mystery, not security. A person can read their own localStorage, and an AI could theoretically decode a link. Nothing here claims otherwise.

## Choice-time meaning

`why` (one sentence) and `wish` (a hidden line) are written on the review/words step **before sealing**, and are part of the fingerprint. The AI writes them in the same message as its picks. Neither can be written after the reveal.

## Talisman: omamori vs beaded charm vs hybrid

| | Omamori | Beaded charm | **Hybrid (chosen)** |
|---|---|---|---|
| Visual beauty | Elegant, flat | Sparkle and colour, risk of plastic | Strand sparkle + one quiet silk form |
| 3D suitability | Medium (fabric, embroidery are hard procedurally) | **High** (spheres, facets, metal) | High |
| Combination freedom | Low (fabric, knot, symbol) | **High** | High |
| Meaning density | One big hidden wish | **One meaning per bead** | Beads + a pouch for the hidden lines |
| Two-person provenance | Weak (one object) | **Strong** (beads alternate H·A·H·A) | Strong |
| Mobile | Fine | Fine | Fine |
| Kitsch risk | Fake kanji, souvenir look | Too many charms, plastic palette | Controlled: ≤ 6 beads, curated palette, one feature charm, no lettering |
| Open-source extensibility | Hard (textures) | Easy (add a bead) | Easy |

**Decision (built, `talisman1`):** a refined bag charm: lobster clasp, a strand of six beads, and at the bottom a small silk pouch (the omamori idea, without lettering) with a charm hanging beside it.

- Halves: **Silk** (pouch silk, stitched motif, cord, beads 1·3·5) and **Metal** (finish, charm, beads 2·4·6). The person chooses which to take, so the beads always alternate between you on the strand.
- 12 beads (pearl, crystal, rose quartz, moonstone, aquamarine, amethyst, citrine, jade, garnet, smoky quartz, frosted glass, lapis), each a meaning slot. A bead you both chose sparkles (echo).
- Lines: the silk side writes what is stitched on the pouch, the metal side what is engraved on the charm. Both hidden lines are folded inside the pouch; "Untie the pouch" is the last reveal beat.
- Resonances name meetings between the halves: the same moon stitched and cast, a moonstone beside a crescent, the red thread holding the other's charm, a key beside the pouch "as if it opens it".
- Rendering is physical rather than toon: metal, faceted glass, iridescent pearl and sheen silk, lit by a procedural studio environment map (no image files). Before the reveal every part waits as a faint ghost outline and fills in as it is revealed.

## 3D technique

Three.js r170 (vendored, one file, MIT), with everything procedural: toon shading (4-step gradient), inverted-hull ink outlines and instanced scatter. A hand-drawn SVG ornament layer behind the canvas adds orbit rings, dotted trails and four-point sparkles, matching the flash-sheet / crayon references. There are no model files, no loaders and no build step. three.js loads only when a 3D view is needed.

## What was cut, and why

- **No LLM in the loop.** Asking a model to "combine both keywords into a world" would undo the provenance. The AI's part is choosing, which it does in the chat it already has.
- **No server or database.** Links and files are the storage. A private app (for example a companion's home UI) can add its own shelf through the embed/postMessage hook.
- **No real cryptographic commitment.** It would add ceremony without any felt benefit. A fingerprint is enough for "your half was fixed first".
- **No free-form 3D editing.** Choosing from a curated menu keeps every world beautiful and keeps the AI path purely textual.

## Memory Snow Globe (built, `globe1`)

- **Coherence first.** Two blind halves can contradict each other about a real moment, so the globe asks the person to name the moment up front ("the night we missed the last train"). It is the only thing shared before the reveal, and it goes in the invitation.
- Halves: **The moment** (where, the hour and its light, what falls inside the glass) and **The keepsake** (the base, the glass shape, a finishing touch). Each side also places one small thing inside; two of the same become a pair.
- The base is physical (walnut, marble, brass, porcelain with a gold rim, oak, night-blue lacquer) with an engraved brass plaque showing the name and the round's date, so a kept globe always reopens the same. The inside is an ink-outlined diorama, the same illustrated language as the planet. The glass is kept thin and clear so the scene stays readable.
- **Motion is the point.** Particles are simulated: snow, petals, leaves and golden dust fall and settle on the ground; rain and falling stars keep falling; bubbles rise; fireflies wander. Dragging turns the globe and shakes it as hard as you drag; any tap gives a small shake. The weather step of the reveal shakes it for you.
- Resonances name the meetings: snow on the cabin roof, the umbrella on a rainy night, a wind-up key beside a record player.

## Roadmap

1. ~~Talisman~~ done. ~~Snow globe~~ done.
2. Device shake (DeviceMotion) for the globe on phones, behind a permission tap.
3. Per-pick "why" (optional) once the single-reason flow has been tested with real companions.