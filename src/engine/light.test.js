import { test } from "node:test";
import assert from "node:assert/strict";
import { facing, mix, shade } from "./light.js";
import { clipHalf, shapePts } from "./geometry.js";
import { Ink } from "./ink.js";
import { buildSVG } from "./svg.js";
import { PRESETS } from "../model/presets.js";
import { LIGHT_DEFAULTS, STYLE_DEFAULTS } from "../model/defaults.js";

const light = { ...LIGHT_DEFAULTS, on: true, strength: 1 };

test("facing: light from the top lights upward-facing facets", () => {
  assert.equal(facing([0, 1], light), 1);
  assert.equal(facing([0, -1], light), -1);
  assert.ok(Math.abs(facing([1, 0], light)) < 1e-12);
  assert.ok(facing([1, 0], { ...light, angle: 90 }) > 0.999, "light from the right");
});

test("shade blends from the fill colour toward highlight and shadow", () => {
  assert.equal(mix("#000000", "#FFFFFF", 0.5), "#808080");
  assert.equal(shade("#123456", 0, light), "#123456");
  assert.equal(shade("#123456", 1, light), light.highlight.toUpperCase());
  assert.equal(shade("#123456", -1, light), light.shadow.toUpperCase());
});

test("clipHalf splits a kite into two triangles meeting on the spine", () => {
  const kite = shapePts("kite", 1, 0.2, 0.4);
  const right = clipHalf(kite, 1), left = clipHalf(kite, -1);
  assert.ok(right.every(([x]) => x >= 0) && left.every(([x]) => x <= 0));
  const area = (p) => Math.abs(p.reduce((s, [x, y], i) => { const [u, v] = p[(i + 1) % p.length]; return s + x * v - u * y; }, 0)) / 2;
  assert.ok(Math.abs(area(right) + area(left) - area(kite)) < 1e-9);
});

test("a horizontal crystal gets a lit top half and a shaded bottom half", () => {
  const ink = new Ink({ ...STYLE_DEFAULTS, tint: "#808080" }, "#FFFFFF", 0, light);
  ink.crystal(shapePts("kite", 1, 0.2), [0, 0], Math.PI / 2); // pointing right
  const fills = ink.fills.map((f) => f.match(/fill="(#[0-9A-F]{6})"/)[1]);
  assert.deepEqual(fills.sort(), [light.highlight.toUpperCase(), light.shadow.toUpperCase()].sort());
});

test("lit designs render cleanly with a range of shaded fills", () => {
  const fillColours = (svg) => new Set([...svg.matchAll(/<path fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase()));
  for (const [key, preset] of Object.entries(PRESETS)) {
    const doc = preset.make();
    const flat = fillColours(buildSVG(doc).svg);
    doc.light = { ...doc.light, on: true };
    const { svg } = buildSVG(doc);
    assert.doesNotMatch(svg, /NaN|undefined/, key);
    const lit = fillColours(svg);
    assert.ok(lit.size >= flat.size + 2, `${key}: ${flat.size} flat colours vs ${lit.size} lit`);
    assert.ok(lit.size <= 40, `${key}: shading should stay quantised, got ${lit.size} colours`);
  }
});
