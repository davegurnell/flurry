// Ink turns geometry in radius units into SVG paths for one layer, batching every
// stroke of the same colour/width/opacity into a single <path> so exports stay small.

import { place, clipHalf } from "./geometry.js";
import { facing, shade } from "./light.js";

export const SIZE = 1000; // viewBox edge
export const C = SIZE / 2; // centre
export const K = 460; // pixels per radius unit, leaving a margin for glow

export const X = (x) => (C + K * x).toFixed(1);
export const Y = (y) => (C - K * y).toFixed(1);
export const pathD = (pts, closed) => "M" + pts.map((p) => X(p[0]) + " " + Y(p[1])).join("L") + (closed ? "Z" : "");

export function circleD(r) {
  const rp = (K * r).toFixed(1);
  return `M${X(-r)} ${Y(0)}A${rp} ${rp} 0 1 0 ${X(r)} ${Y(0)}A${rp} ${rp} 0 1 0 ${X(-r)} ${Y(0)}Z`;
}

// Draw order within a layer: wide glow, narrow glow, line, facet highlights.
const GLOW_WIDE = 0, GLOW_NEAR = 1, LINE = 2, FACET = 3;

export class Ink {
  constructor(style, glowColor, glowAll, light = null, lineScale = 1) {
    this.st = style;
    this.lineScale = lineScale; // design-wide line weight multiplier
    this.light = light?.on ? light : null;
    this.gc = glowColor;
    this.g = glowAll * style.glow;
    this.ws = 1; // extra width scale, used for tiny snowflakes
    this.strokes = new Map();
    this.fills = [];
  }

  stroke(rank, color, w, a, d) {
    if (a <= 0.002 || w <= 0) return;
    const key = `${rank}|${color}|${w.toFixed(2)}|${Math.min(1, a).toFixed(3)}`;
    let arr = this.strokes.get(key);
    if (!arr) this.strokes.set(key, (arr = []));
    arr.push(d);
  }

  strokeD(d, wm = 1, am = 1) {
    const st = this.st, w = st.width * wm * this.ws * this.lineScale, a = st.opacity * am;
    if (this.g > 0) {
      this.stroke(GLOW_WIDE, this.gc, w * 5, 0.09 * this.g * a, d);
      this.stroke(GLOW_NEAR, this.gc, w * 2.4, 0.22 * this.g * a, d);
    }
    this.stroke(LINE, st.color, w, 0.95 * a, d);
  }

  line(pts, wm = 1, am = 1) {
    this.strokeD(pathD(pts, false), wm, am);
  }

  /**
   * Filled, outlined polygon with `ridges` nested facet lines inside it.
   * With a light on, the fill is split into `facets` ({pts, n}: outline and outward
   * direction); without explicit facets it is split like a shallow pyramid.
   */
  shape(pts, { ridges = this.st.ridges, fm = 1, wm = 0.7, facets } = {}) {
    const st = this.st, d = pathD(pts, true);
    if (this.light && st.fill * fm > 0.002) this.litFill(facets || this.pyramid(pts), fm);
    else this.fillD(d, fm, false);
    this.strokeD(d, wm, 0.9);
    if (ridges > 0) {
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p[0]; cy += p[1]; }
      cx /= pts.length; cy /= pts.length;
      for (let j = 1; j <= ridges; j++) {
        const k = 1 - j * (0.8 / (ridges + 1));
        this.facet(pathD(pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]), true), wm * 0.6, 0.75);
      }
    }
  }

  /**
   * A crystal drawn along local +y (outline `local`), placed at `o` pointing along `a`.
   * With a light on it is split down its spine into two halves that each tilt away
   * from the spine, and a faint crease is drawn where they meet.
   */
  crystal(local, o, a, opts = {}) {
    const pts = place(local, o, a);
    if (!this.light) return this.shape(pts, opts);
    const right = [Math.cos(a), -Math.sin(a)]; // local +x in page coordinates
    const facets = [];
    const crease = [];
    for (const side of [1, -1]) {
      const half = clipHalf(local, side);
      if (half.length < 3) continue;
      facets.push({ pts: place(half, o, a), n: [side * right[0], side * right[1]] });
      for (const p of half) if (Math.abs(p[0]) < 1e-9) crease.push(p[1]);
    }
    this.shape(pts, { ...opts, facets });
    if (crease.length >= 2 && (opts.fm ?? 1) > 0) {
      const y0 = Math.min(...crease), y1 = Math.max(...crease);
      if (y1 - y0 > 1e-6) this.facet(pathD(place([[0, y0], [0, y1]], o, a), false), 0.45, 0.55);
    }
  }

  /** Split a polygon into triangles from its centroid, each facing out through its edge. */
  pyramid(pts) {
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= pts.length; cy /= pts.length;
    const facets = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      let n = [q[1] - p[1], p[0] - q[0]];
      if (n[0] * ((p[0] + q[0]) / 2 - cx) + n[1] * ((p[1] + q[1]) / 2 - cy) < 0) n = [-n[0], -n[1]];
      facets.push({ pts: [[cx, cy], p, q], n });
    }
    return facets;
  }

  litFill(facets, fm) {
    const st = this.st, fa = Math.min(1, st.fill * fm * st.opacity).toFixed(3);
    for (const f of facets) {
      const colour = shade(st.tint, facing(f.n, this.light), this.light);
      this.fills.push(`<path fill="${colour}" fill-opacity="${fa}" d="${pathD(f.pts, true)}"/>`);
    }
  }

  facet(d, wm, am) {
    this.stroke(FACET, this.st.facet, this.st.width * wm * this.ws * this.lineScale, am * this.st.opacity, d);
  }

  fillD(d, am = 1, evenodd = true) {
    const fa = this.st.fill * am * this.st.opacity;
    if (fa > 0.002) {
      this.fills.push(`<path fill="${this.st.tint}" fill-opacity="${Math.min(1, fa).toFixed(3)}"${evenodd ? ' fill-rule="evenodd"' : ""} d="${d}"/>`);
    }
  }

  out() {
    const strokes = [...this.strokes.entries()]
      .map(([k, ds]) => { const [rank, color, w, a] = k.split("|"); return { rank: +rank, color, w: +w, a, ds }; })
      .sort((p, q) => p.rank - q.rank || q.w - p.w)
      .map((s) => `<path fill="none" stroke="${s.color}" stroke-width="${s.w}" stroke-opacity="${s.a}" stroke-linecap="round" stroke-linejoin="round" d="${s.ds.join("")}"/>`);
    return this.fills.join("") + strokes.join("");
  }

  count() {
    let n = this.fills.length;
    for (const ds of this.strokes.values()) n += ds.length;
    return n;
  }
}
