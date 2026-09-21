import { makeLayer as L, PHOTO_DEFAULTS, LIGHT_DEFAULTS, STYLE_DEFAULTS } from "./defaults.js";

const base = (name, layers, extra = {}) => ({ name, glowColor: "#FFFFFF", glow: 1, photo: { ...PHOTO_DEFAULTS }, light: { ...LIGHT_DEFAULTS }, layers, ...extra });

export const PRESETS = {
  arendelle: {
    label: "Arendelle star",
    make: () => base("arendelle-star", [
      L("plate", "Core plate", { radius: 0.15, rings: 3, ridges: 1 }),
      L("arms", "Main arms", { len: 0.97, branches: 3, bStart: 0.28, bEnd: 0.7, angle: 52, bLen: 0.3, taper: 0.55, bShape: "kite", bWidth: 0.22, tip: "diamond", tipSize: 0.085, lozenges: 1, lozSize: 0.055, width: 3.4 }),
      L("arms", "Short arms", { rot: 30, r0: 0.06, len: 0.64, branches: 1, bStart: 0.55, bEnd: 0.55, angle: 42, bLen: 0.12, bShape: "kite", bWidth: 0.25, tip: "spear", tipSize: 0.07, lozenges: 1, lozSize: 0.05, width: 2.6 }),
      L("crystals", "Sector plates", { count: 6, rot: 30, r0: 0.1, r1: 0.5, shape: "kite", cw: 0.14, widest: 0.32, ridges: 4, fill: 0.22, spine: false }),
    ]),
  },
  frame: {
    label: "Photo frame",
    make: () => base("photo-frame", [
      L("crystals", "Frost teeth", { count: 48, r0: 0.49, r1: 0.56, shape: "spike", cw: 0.022, alt: 0.55, ridges: 0, spine: false, jitter: 0.4, seed: 3 }),
      L("arms", "Crystal spokes", { count: 8, r0: 0.47, len: 0.97, branches: 2, bStart: 0.25, bEnd: 0.6, angle: 42, bLen: 0.16, taper: 0.3, bShape: "kite", bWidth: 0.3, tip: "diamond", tipSize: 0.07, lozenges: 1, lozSize: 0.05, width: 3 }),
      L("crystals", "Leaf clusters", { count: 8, rot: 22.5, r0: 0.5, r1: 0.8, shape: "kite", cw: 0.07, widest: 0.45, ridges: 3, spine: true }),
      L("crystals", "Side shards", { count: 16, rot: 11.25, r0: 0.52, r1: 0.68, shape: "shard", cw: 0.035, widest: 0.5, ridges: 1, spine: false, seed: 9 }),
    ], { photo: { ...PHOTO_DEFAULTS, on: true, radius: 0.46, overhang: 0.09, icicles: 44 } }),
  },
  fern: {
    label: "Fernlike dendrite",
    make: () => base("fern-dendrite", [
      L("plate", "Core", { radius: 0.09, rings: 2, spokes: true }),
      L("arms", "Fern arms", { len: 0.97, branches: 7, bStart: 0.15, bEnd: 0.85, angle: 60, bLen: 0.34, taper: 0.8, bShape: "fern", fronds: 5, tip: "hex", tipSize: 0.05, lozenges: 0, width: 2 }),
      L("arms", "Between arms", { rot: 30, r0: 0.08, len: 0.5, branches: 3, bStart: 0.3, bEnd: 0.8, angle: 60, bLen: 0.14, taper: 0.6, bShape: "line", fronds: 2, tip: "diamond", tipSize: 0.04, lozenges: 0, width: 1.4 }),
    ]),
  },
  plate: {
    label: "Sectored plate",
    make: () => base("sectored-plate", [
      L("plate", "Inner hexagon", { radius: 0.3, rings: 4, ridges: 0, spokes: true }),
      L("crystals", "Sectors", { count: 6, r0: 0.05, r1: 0.62, shape: "kite", cw: 0.2, widest: 0.62, ridges: 5, fill: 0.2 }),
      L("arms", "Ribs", { len: 0.82, branches: 4, bStart: 0.45, bEnd: 0.9, angle: 60, bLen: 0.1, taper: 0.2, bShape: "plate", bWidth: 0.4, tip: "hex", tipSize: 0.06, lozenges: 0 }),
      L("plate", "Outer hexagon", { radius: 0.62, rings: 1, ridges: 0, fill: 0.06, spokes: false }),
    ]),
  },
  sparkle: {
    label: "Small sparkle",
    make: () => base("sparkle", [
      L("plate", "Heart", { radius: 0.1, rings: 2, star: 0.45, sides: 6 }),
      L("arms", "Arms", { len: 0.95, branches: 2, bStart: 0.4, bEnd: 0.7, angle: 45, bLen: 0.2, taper: 0.3, bShape: "line", tip: "diamond", tipSize: 0.12, lozenges: 0, width: 3 }),
      L("arms", "Glints", { rot: 30, len: 0.45, branches: 0, tip: "spear", tipSize: 0.08, lozenges: 0, width: 2 }),
    ], { glow: 1.2 }),
  },
};

export const DEFAULT_PRESET = "arendelle";

const TIP_KINDS = ["diamond", "spear", "arrow", "hex", "trident", "star"];

/** A random but plausible stack, keeping the colours from `style`. */
export function randomDesign(prev, style = STYLE_DEFAULTS, r = Math.random) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const colours = { color: style.color, tint: style.tint, facet: style.facet };
  const layers = [];
  layers.push(L("plate", "Core", { ...colours, radius: 0.08 + r() * 0.12, rings: 1 + Math.floor(r() * 3), star: r() < 0.3 ? 0.5 : 0 }));
  layers.push(L("arms", "Main arms", {
    ...colours, branches: 1 + Math.floor(r() * 5), bStart: 0.2 + r() * 0.2, bEnd: 0.6 + r() * 0.25, angle: 40 + r() * 25,
    bLen: 0.12 + r() * 0.25, taper: r() * 0.9, bShape: pick(["leaf", "kite", "fern", "needle", "shard", "line", "plate"]),
    bWidth: 0.15 + r() * 0.2, fronds: r() < 0.3 ? Math.floor(r() * 4) : 0, tip: pick(TIP_KINDS), tipSize: 0.05 + r() * 0.06,
    lozenges: Math.floor(r() * 3),
  }));
  if (r() < 0.75) {
    layers.push(L("arms", "Short arms", {
      ...colours, rot: 30, r0: 0.05, len: 0.35 + r() * 0.35, branches: Math.floor(r() * 3), bLen: 0.08 + r() * 0.1,
      bShape: pick(["kite", "line", "leaf", "needle"]), tip: pick(["spear", "diamond", "arrow"]), tipSize: 0.05 + r() * 0.04,
      lozenges: r() < 0.5 ? 1 : 0, width: 2.2,
    }));
  }
  if (r() < 0.7) {
    layers.push(L("crystals", "Sector plates", {
      ...colours, count: 6, rot: r() < 0.5 ? 30 : 0, r0: 0.06, r1: 0.3 + r() * 0.3, shape: pick(["kite", "leaf", "shard"]),
      cw: 0.08 + r() * 0.1, widest: 0.3 + r() * 0.2, ridges: 2 + Math.floor(r() * 3), spine: false,
    }));
  }
  if (r() < 0.4) {
    layers.unshift(L("crystals", "Edge glints", {
      ...colours, count: pick([12, 18, 24]), r0: 0.86, r1: 1.0, shape: pick(["spike", "kite", "flake"]), cw: 0.03, alt: 0.6,
      ridges: 1, seed: 1 + Math.floor(r() * 200),
    }));
  }
  return { name: "snowflake-" + Math.floor(r() * 9000 + 1000), glowColor: prev.glowColor, glow: prev.glow, photo: prev.photo, light: prev.light, layers };
}
