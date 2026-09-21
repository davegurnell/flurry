# Letters from the Sky

A layered snowflake designer for print. Build a snowflake from stacked layers
(arms, crystal rings, hex plates, rings), optionally cut an icicle-edged photo
opening in the middle, and export a transparent SVG or a PNG up to 6000 px for
use in Canva.

## Running

```sh
npm install
npm run dev      # http://localhost:8000  (https://snowflake.exe.xyz:8000/ via exe.dev)
npm test         # engine and undo tests (node:test, no browser needed)
npm run build    # static bundle in dist/
```

On this VM the dev server runs as a systemd service, so it survives reboots and
picks up edits through hot reload:

```sh
sudo systemctl status snowflake     # unit file: deploy/snowflake.service
journalctl -u snowflake -f
```

## Layout

| Path | What it is |
| --- | --- |
| `src/engine/` | Pure geometry → SVG. No React, no DOM; `buildSVG(doc)` is the entry point. |
| `src/model/` | Layer defaults, presets, palettes, and the control schemas the UI renders from. |
| `src/state/` | Undo history reducer (`history.js`) and the `useDesign` hook that persists to localStorage. |
| `src/components/` | React UI. Controls are generated from `src/model/schema.js`. |
| `prototype/` | The original single-file version, kept for reference. |

A design (`doc`) is plain JSON: `{ name, glowColor, glow, photo, layers[] }`.
Layers are listed top to bottom and drawn bottom-up. All geometry is in radius
units (the design fits a circle of radius 1) and mapped onto a 1000 × 1000 viewBox.

### Adding a layer type

1. Add its defaults and display name in `src/model/defaults.js`.
2. Write a `draw<Type>(ink, layer)` in `src/engine/draw.js` and register it in `DRAW`.
3. Describe its controls in `LAYER_SCHEMA` in `src/model/schema.js`.

### Export rules

Exports must stay Canva-friendly: plain paths only, no filters, no background
rect. Glow is built from stacked translucent strokes. The tests enforce this.
