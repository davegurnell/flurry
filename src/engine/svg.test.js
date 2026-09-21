import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSVG, photoWidthShare } from "./svg.js";
import { PRESETS, randomDesign } from "../model/presets.js";
import { makeLayer, normalizeDoc, TYPE_DEFAULTS } from "../model/defaults.js";

const NUMBER_ATTRS = /\b(?:d|stroke-width|stroke-opacity|fill-opacity|r|cx|cy)="([^"]*)"/g;

function assertClean(svg) {
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(svg.trimEnd().endsWith("</svg>"));
  assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
  assert.doesNotMatch(svg, /<rect|<image|filter=/, "exports must stay transparent and filter-free");
  for (const [, v] of svg.matchAll(NUMBER_ATTRS)) assert.ok(v.length > 0);
}

for (const [key, preset] of Object.entries(PRESETS)) {
  test(`preset ${key} renders a clean SVG`, () => {
    const { svg, count } = buildSVG(preset.make());
    assertClean(svg);
    assert.ok(count > 20, `expected real detail, got ${count} shapes`);
  });
}

test("every crystal shape and arm branch/tip renders", () => {
  const shapes = ["kite", "leaf", "shard", "spike", "arrow", "chevron", "hex", "flake"];
  const branches = ["line", "fern", "needle", "plate", "kite", "leaf", "shard", "spike", "arrow", "chevron", "hex"];
  const tips = ["none", "diamond", "spear", "arrow", "hex", "trident", "star"];
  const layers = [
    ...shapes.flatMap((shape) => ["out", "in", "both"].map((dir) => makeLayer("crystals", shape, { shape, dir }))),
    ...branches.map((bShape, i) => makeLayer("arms", bShape, { bShape, tip: tips[i % tips.length], fronds: 2, rails: i % 2 === 0 })),
    makeLayer("plate", "star plate", { star: 0.5 }),
    makeLayer("ring", "hex ring", { sides: 6, double: true }),
    makeLayer("ring", "dotted", { dash: true }),
  ];
  const { svg } = buildSVG({ name: "all", glowColor: "#fff", glow: 1, photo: { on: false }, layers });
  assertClean(svg);
});

test("hidden layers are left out", () => {
  const doc = PRESETS.arendelle.make();
  const all = buildSVG(doc).count;
  doc.layers[0].visible = false;
  assert.ok(buildSVG(doc).count < all);
});

test("photo opening clips the layers and adds a rim, without the preview guide", () => {
  const doc = PRESETS.frame.make();
  const { svg } = buildSVG(doc);
  assert.match(svg, /<clipPath id="photo-cut">/);
  assert.match(svg, /<g id="photo-rim">/);
  assert.doesNotMatch(svg, /stroke-dasharray/);
  assert.match(buildSVG(doc, { preview: true }).svg, /stroke-dasharray/);
  assert.ok(photoWidthShare(doc.photo) > 0.3 && photoWidthShare(doc.photo) < 1);
});

test("layer names are escaped", () => {
  const doc = PRESETS.sparkle.make();
  doc.name = `<script>"x"</script>`;
  doc.layers[0].name = `a"b<c`;
  const { svg } = buildSVG(doc);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
});

test("export size is set by px while the viewBox stays fixed", () => {
  const { svg } = buildSVG(PRESETS.sparkle.make(), { px: 4000 });
  assert.match(svg, /width="4000" height="4000" viewBox="0 0 1000 1000"/);
});

test("random designs render cleanly", () => {
  let seed = 1;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const prev = PRESETS.arendelle.make();
  for (let i = 0; i < 40; i++) assertClean(buildSVG(randomDesign(prev, prev.layers[0], r)).svg);
});

test("normalizeDoc fills missing fields and drops unknown layer types", () => {
  const d = normalizeDoc({ layers: [{ type: "arms", count: 8 }, { type: "bogus" }] });
  assert.equal(d.layers.length, 1);
  assert.equal(d.layers[0].count, 8);
  assert.equal(d.layers[0].tip, TYPE_DEFAULTS.arms.tip);
  assert.equal(d.photo.on, false);
  assertClean(buildSVG(d).svg);
});

test("photo designs split into a back part and a front part that together make the whole", () => {
  const doc = PRESETS.frameShort.make();
  const count = (part) => buildSVG(doc, { part }).count;
  const back = buildSVG(doc, { part: "back" }).svg, front = buildSVG(doc, { part: "front" }).svg;
  assert.equal(count("back") + count("front"), count("all"));
  assert.match(back, /id="behind-photo"/);
  assert.doesNotMatch(back, /photo-rim|frost-teeth/);
  assert.match(front, /id="photo-rim"/);
  assert.match(front, /id="frost-teeth-\d+"/);
  assert.doesNotMatch(front, /crystal-spokes|clipPath/);
  assertClean(back);
  assertClean(front);
});

test("parts are ignored without a photo opening", () => {
  const doc = PRESETS.frozen.make();
  doc.layers[0].front = true;
  assert.equal(buildSVG(doc, { part: "front" }).svg, buildSVG(doc).svg);
});

test("every photo-frame preset puts something in front and something behind", () => {
  for (const [key, p] of Object.entries(PRESETS)) {
    const doc = p.make();
    if (!doc.photo.on) continue;
    assert.ok(doc.layers.some((l) => l.front), `${key} has front layers`);
    assert.ok(doc.layers.some((l) => !l.front), `${key} has back layers`);
  }
});

test("line weight scales every stroke", () => {
  const widths = (doc) => [...buildSVG(doc).svg.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => +m[1]).sort((a, b) => a - b);
  const doc = PRESETS.sparkle.make();
  assert.equal(doc.lineWeight, 1.5);
  const thick = widths(doc), thin = widths({ ...doc, lineWeight: 1 });
  assert.equal(thick.length, thin.length);
  thick.forEach((w, i) => assert.ok(Math.abs(w - thin[i] * 1.5) < 0.02, `${w} vs ${thin[i]}`));
});
