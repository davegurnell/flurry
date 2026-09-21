// A single light over the page. Each facet of a crystal is imagined tilted
// slightly out of the page, away from its crease; its in-plane "outward"
// direction decides how much it faces the light (first-order Lambert).
// Flat-on facets keep the layer's fill colour; facets turned toward the light
// blend to the highlight colour, facets turned away blend to the shadow colour.

import { D2R } from "./geometry.js";

const hex2rgb = (h) => {
  let s = String(h).replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16);
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb2hex = (c) => "#" + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("").toUpperCase();

export function mix(a, b, t) {
  const p = hex2rgb(a), q = hex2rgb(b);
  return rgb2hex(p.map((v, i) => v + (q[i] - v) * t));
}

/** Direction pointing toward the light, in page coordinates (+y up). 0° = light at the top. */
export const lightDir = (light) => [Math.sin(light.angle * D2R), Math.cos(light.angle * D2R)];

/** How strongly a facet whose outward direction is `n` faces the light, from -1 to 1. */
export function facing(n, light) {
  const len = Math.hypot(n[0], n[1]);
  if (!len) return 0;
  const [lx, ly] = lightDir(light);
  return ((n[0] * lx + n[1] * ly) / len) * light.strength;
}

export function shade(tint, s, light) {
  // Quantise so a design uses a handful of colours rather than hundreds.
  const q = Math.round(s * 16) / 16;
  return q >= 0 ? mix(tint, light.highlight, q) : mix(tint, light.shadow, -q);
}
