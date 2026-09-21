// Ink turns geometry in radius units into SVG paths for one layer, batching every
// stroke of the same colour/width/opacity into a single <path> so exports stay small.

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
  constructor(style, glowColor, glowAll) {
    this.st = style;
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
    const st = this.st, w = st.width * wm * this.ws, a = st.opacity * am;
    if (this.g > 0) {
      this.stroke(GLOW_WIDE, this.gc, w * 5, 0.09 * this.g * a, d);
      this.stroke(GLOW_NEAR, this.gc, w * 2.4, 0.22 * this.g * a, d);
    }
    this.stroke(LINE, st.color, w, 0.95 * a, d);
  }

  line(pts, wm = 1, am = 1) {
    this.strokeD(pathD(pts, false), wm, am);
  }

  /** Filled, outlined polygon with `ridges` nested facet lines inside it. */
  shape(pts, { ridges = this.st.ridges, fm = 1, wm = 0.7 } = {}) {
    const st = this.st, d = pathD(pts, true);
    this.fillD(d, fm, false);
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

  facet(d, wm, am) {
    this.stroke(FACET, this.st.facet, this.st.width * wm * this.ws, am * this.st.opacity, d);
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
