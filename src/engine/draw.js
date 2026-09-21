import { TAU, D2R, mulberry32, polar, along, place, hexPts, shapePts } from "./geometry.js";
import { pathD, circleD } from "./ink.js";

// Arm settings used for the "Tiny snowflake" crystal shape.
export const MINI = {
  star: { count: 6, rot: 0, r0: 0, len: 1, rails: false, branches: 2, bStart: 0.35, bEnd: 0.65, angle: 55, bLen: 0.35, taper: 0.4, bShape: "line", bWidth: 0.2, fronds: 0, tip: "diamond", tipSize: 0.16, lozenges: 0, lozSize: 0.05 },
  fern: { count: 6, rot: 0, r0: 0, len: 1, rails: false, branches: 4, bStart: 0.2, bEnd: 0.8, angle: 60, bLen: 0.4, taper: 0.8, bShape: "line", bWidth: 0.2, fronds: 0, tip: "none", tipSize: 0.1, lozenges: 0, lozSize: 0.05 },
  plate: { count: 6, rot: 0, r0: 0, len: 1, rails: false, branches: 1, bStart: 0.4, bEnd: 0.4, angle: 50, bLen: 0.45, taper: 0, bShape: "kite", bWidth: 0.32, fronds: 0, tip: "hex", tipSize: 0.13, lozenges: 0, lozSize: 0.05 },
};

function drawBranch(ink, kind, base, ang, len, wr, fronds) {
  const tip = along(base, ang, len);
  if (kind === "line" || kind === "fern") ink.line([base, tip], 0.8);
  else if (kind === "needle") {
    ink.line([base, tip], 0.8);
    ink.crystal(shapePts("kite", len * 0.38, len * 0.08, 0.5), along(base, ang, len * 0.62), ang, { ridges: Math.min(1, ink.st.ridges) });
  } else if (kind === "plate") {
    const r = Math.max(0.004, len * wr * 0.55);
    ink.line([base, along(base, ang, len - r)], 0.8);
    ink.crystal(hexPts(0, len - r, r), base, ang, { ridges: Math.min(1, ink.st.ridges) });
  } else {
    ink.crystal(shapePts(kind, len, len * wr, 0.4), base, ang);
    ink.line([base, along(base, ang, len * 0.92)], 0.55, 0.8);
  }
  const nf = kind === "fern" ? Math.max(3, fronds) : fronds;
  for (let j = 0; j < nf; j++) {
    const v = (j + 1) / (nf + 1), p = along(base, ang, len * v), fl = len * 0.38 * (1 - v) + 0.004;
    for (const s of [1, -1]) ink.line([p, along(p, ang + s * 60 * D2R, fl)], 0.55, 0.85);
  }
}

function drawTip(ink, kind, end, a, ts) {
  if (kind === "none" || ts <= 0) return;
  const back = (d) => along(end, a, -d);
  if (kind === "diamond") ink.crystal(shapePts("kite", ts * 2.4, ts * 0.6, 0.45), back(ts * 1.2), a);
  else if (kind === "spear") ink.crystal(shapePts("kite", ts * 3.2, ts * 0.34, 0.62), back(ts * 2.2), a);
  else if (kind === "arrow") ink.crystal(shapePts("arrow", ts * 2.2, ts * 0.9), back(ts * 1.4), a);
  else if (kind === "hex") ink.crystal(hexPts(0, 0, ts * 0.9), end, a);
  else if (kind === "trident") {
    for (const [da, k] of [[0, 2.4], [28, 1.5], [-28, 1.5]]) {
      ink.crystal(shapePts("kite", ts * k, ts * 0.3, 0.3), back(ts * 0.4), a + da * D2R, { ridges: Math.min(1, ink.st.ridges) });
    }
  } else if (kind === "star") {
    for (let i = 0; i < 6; i++) ink.line([end, along(end, a + i * 60 * D2R, ts)], 0.7);
    ink.shape(hexPts(end[0], end[1], ts * 0.35, a), { ridges: 0 });
  }
}

export function drawArms(ink, p, cx = 0, cy = 0, sc = 1, rot0 = 0) {
  const n = Math.round(p.count);
  for (let k = 0; k < n; k++) {
    const a = rot0 + (p.rot + (k * 360) / n) * D2R;
    const ax = (t) => [cx + sc * t * Math.sin(a), cy + sc * t * Math.cos(a)];
    if (p.rails) {
      const g = 0.008 * sc;
      ink.line(place([[-g, p.r0 * sc], [-g, p.len * sc]], [cx, cy], a), 0.7);
      ink.line(place([[g, p.r0 * sc], [g, p.len * sc]], [cx, cy], a), 0.7);
    } else ink.line([ax(p.r0), ax(p.len)], 1);

    const nb = Math.round(p.branches), span = p.len - p.r0;
    for (let i = 0; i < nb; i++) {
      const u = nb === 1 ? 0 : i / (nb - 1);
      const t = p.r0 + span * (p.bStart + (p.bEnd - p.bStart) * u);
      const bl = Math.max(0.005, p.bLen * (1 - p.taper * u)) * sc;
      for (const s of [1, -1]) drawBranch(ink, p.bShape, ax(t), a + s * p.angle * D2R, bl, p.bWidth, Math.round(p.fronds));
    }

    const nl = Math.round(p.lozenges);
    for (let j = 0; j < nl; j++) {
      const t = p.r0 + span * (nl === 1 ? 0.52 : 0.3 + (0.45 * j) / (nl - 1));
      ink.crystal(shapePts("kite", p.lozSize * 2 * sc, p.lozSize * 0.42 * sc, 0.5), ax(t - p.lozSize), a);
    }
    drawTip(ink, p.tip, ax(p.len), a, p.tipSize * sc);
  }
}

export function drawCrystals(ink, p) {
  const rnd = mulberry32(Math.round(p.seed) * 7919), n = Math.round(p.count);
  for (let i = 0; i < n; i++) {
    let a = (p.rot + (i * 360) / n) * D2R;
    const sc = i % 2 === 1 ? p.alt : 1, j = 1 - p.jitter * rnd() * 0.6;
    a += (rnd() - 0.5) * p.jitter * (TAU / n) * 0.4;
    const span = (p.r1 - p.r0) * sc * j, w = p.cw * sc;
    if (Math.abs(span) < 0.002) continue;

    if (p.shape === "flake") {
      const c = polar((p.r0 + p.r1) / 2, a), s = (Math.abs(p.r1 - p.r0) / 2) * sc * j;
      ink.ws = Math.max(0.35, Math.min(1, s * 5));
      drawArms(ink, MINI[p.flakeStyle] || MINI.star, c[0], c[1], s, a);
      ink.ws = 1;
      continue;
    }

    const parts =
      p.dir === "in" ? [[p.r0 + span, a + Math.PI, span]]
      : p.dir === "both" ? [[p.r0 + span / 2, a, span / 2], [p.r0 + span / 2, a + Math.PI, span / 2]]
      : [[p.r0, a, span]];
    for (const [r, ang, len] of parts) {
      const base = polar(r, a);
      ink.crystal(shapePts(p.shape, len, w, p.widest), base, ang);
      if (p.spine) ink.line([base, along(base, ang, len * 0.94)], 0.55, 0.8);
    }
  }
}

export function drawPlate(ink, p) {
  const n = Math.round(p.sides), rings = Math.round(p.rings), rot = p.rot * D2R;
  for (let j = 1; j <= rings; j++) {
    const r = (p.radius * j) / rings, pts = [], m = p.star > 0 ? n * 2 : n;
    for (let v = 0; v < m; v++) pts.push(polar(p.star > 0 && v % 2 ? r * p.star : r, rot + (v * TAU) / m));
    ink.shape(pts, { fm: j === rings ? 1 : 0.5, ridges: j === rings ? p.ridges : 0 });
  }
  if (p.spokes) for (let v = 0; v < n; v++) ink.line([[0, 0], polar(p.radius, rot + (v * TAU) / n)], 0.6, 0.8);
}

export function drawRing(ink, p) {
  const draw = (r, wm) => {
    const n = +p.sides;
    if (p.dash) {
      const m = Math.max(12, Math.round((TAU * r) / 0.028));
      for (let i = 0; i < m; i++) { const a = p.rot * D2R + (i * TAU) / m; ink.line([polar(r, a), polar(r, a + 0.0001)], wm * 1.6); }
    } else if (n >= 3) ink.shape(hexPts(0, 0, r, p.rot * D2R, n), { ridges: 0, fm: 0, wm });
    else ink.strokeD(circleD(r), wm);
  };
  draw(p.radius, 1);
  if (p.double) draw(p.radius + p.gap, 0.5);
}

export const DRAW = { arms: drawArms, crystals: drawCrystals, plate: drawPlate, ring: drawRing };

/** Radius of the transparent photo opening. */
export const photoCut = (ph) => ph.radius + ph.rim * 0.35;

/** Frosty rim around the photo opening, with icicles hanging over its edge. */
export function drawPhoto(ink, ph) {
  const rnd = mulberry32(Math.round(ph.seed) * 104729), rp = ph.radius, rw = ph.rim, n = Math.round(ph.icicles);
  const outer = [], inner = [], tips = [];
  for (let i = 0; i < n * 2; i++) outer.push(polar(rp + rw * (0.8 + 0.4 * rnd()), (i * TAU) / (n * 2)));
  for (let i = 0; i < n; i++) {
    const a0 = (i * TAU) / n, a1 = ((i + 1) * TAU) / n, ta = a0 + (a1 - a0) * (0.3 + 0.4 * rnd());
    const len = ph.overhang * (0.2 + 0.8 * Math.pow(rnd(), 1.4));
    inner.push(polar(rp + rw * 0.15 * rnd(), a0));
    if (rnd() < 0.35) { // a shoulder crystal on the way down
      const sa = a0 + (ta - a0) * 0.5;
      inner.push(polar(rp - len * 0.35, sa));
      inner.push(polar(rp - len * 0.15, sa + (ta - a0) * 0.2));
    }
    inner.push(polar(rp - len, ta));
    tips.push([ta, len]);
  }
  ink.fillD(pathD(outer, true) + pathD(inner.slice().reverse(), true));
  ink.strokeD(pathD(outer, true), 0.7, 0.8);
  ink.strokeD(pathD(inner, true), 1, 1);
  if (ph.ridges > 0) {
    for (const [ta, len] of tips) ink.facet(pathD([polar(rp + rw * 0.5, ta), polar(rp - len * 0.75, ta)], false), 0.5, 0.8);
    if (ph.ridges > 1) ink.facet(pathD(inner.map(([x, y]) => [x * 1.035, y * 1.035]), true), 0.45, 0.6);
    if (ph.ridges > 2) ink.facet(pathD(outer.map(([x, y]) => [x * 0.985, y * 0.985]), true), 0.4, 0.5);
  }
  // glints scattered on the rim
  for (let i = 0; i < n / 2; i++) {
    const a = rnd() * TAU, base = polar(rp + rw * (0.2 + 0.5 * rnd()), a);
    ink.crystal(shapePts("kite", rw * 1.4, rw * 0.28, 0.4), base, a + (rnd() - 0.5) * 1.2, { ridges: 0, fm: 1.2, wm: 0.45 });
  }
}
