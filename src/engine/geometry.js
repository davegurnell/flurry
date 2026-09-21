// Coordinates are in "radius units": the design fits inside a circle of radius 1
// centred on the origin, +y up. Angles are measured clockwise from +y (12 o'clock).

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;

export function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const polar = (r, a) => [r * Math.sin(a), r * Math.cos(a)];

export const along = (o, a, d) => [o[0] + d * Math.sin(a), o[1] + d * Math.cos(a)];

/** Move points drawn along local +y so that +y runs in direction `a` from origin `o`. */
export function place(pts, o, a) {
  const s = Math.sin(a), c = Math.cos(a);
  return pts.map(([x, y]) => [o[0] + x * c + y * s, o[1] - x * s + y * c]);
}

export function hexPts(cx, cy, r, rot = 0, n = 6) {
  const p = [];
  for (let i = 0; i < n; i++) p.push([cx + r * Math.sin(rot + (i * TAU) / n), cy + r * Math.cos(rot + (i * TAU) / n)]);
  return p;
}

/**
 * Clip a polygon to one side of the local y-axis (side = 1 keeps x >= 0, -1 keeps x <= 0).
 * Sutherland–Hodgman against a half-plane, so concave outlines are fine too.
 */
export function clipHalf(pts, side) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const pin = side * p[0] >= 0, qin = side * q[0] >= 0;
    if (pin) out.push(p);
    if (pin !== qin) {
      const t = p[0] / (p[0] - q[0]);
      out.push([0, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/** A crystal outline of length `len` along +y from the origin, half-width `w`, widest at fraction `wp`. */
export function shapePts(kind, len, w, wp = 0.4) {
  switch (kind) {
    case "leaf": {
      const n = 12, k = Math.log(0.5) / Math.log(Math.min(0.95, Math.max(0.05, wp))), side = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        side.push([w * Math.pow(Math.sin(Math.PI * Math.pow(u, k)), 0.85), len * u]);
      }
      return side.concat(side.slice(1, -1).reverse().map(([x, y]) => [-x, y]));
    }
    case "shard": return [[0, 0], [w, len * wp], [w * 0.35, len * 0.88], [0, len], [-w * 0.55, len * wp * 0.75]];
    case "spike": return [[-w * 0.5, 0], [0, len], [w * 0.5, 0]];
    case "arrow": return [[0, len], [w, len * 0.6], [w * 0.28, len * 0.7], [w * 0.28, 0], [-w * 0.28, 0], [-w * 0.28, len * 0.7], [-w, len * 0.6]];
    case "chevron": return [[0, len], [w, len * 0.35], [w * 0.72, len * 0.22], [0, len * 0.72], [-w * 0.72, len * 0.22], [-w, len * 0.35]];
    case "hex": { const r = Math.min(w * 1.15, len / 2); return hexPts(0, len / 2, r); }
    default: return [[0, 0], [w, len * wp], [0, len], [-w, len * wp]]; // kite
  }
}
