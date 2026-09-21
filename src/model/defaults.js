export const STYLE_DEFAULTS = { color: "#2B5FB8", tint: "#9DC2EE", facet: "#FFFFFF", width: 3, fill: 0.42, ridges: 2, glow: 1, opacity: 1 };

export const TYPE_DEFAULTS = {
  arms: {
    count: 6, rot: 0, r0: 0, len: 0.95, rails: false,
    branches: 3, bStart: 0.3, bEnd: 0.75, angle: 58, bLen: 0.3, taper: 0.5, bShape: "leaf", bWidth: 0.26, fronds: 0,
    tip: "diamond", tipSize: 0.08, lozenges: 1, lozSize: 0.06,
  },
  crystals: { count: 12, rot: 0, r0: 0.5, r1: 0.75, dir: "out", shape: "kite", cw: 0.07, widest: 0.4, alt: 1, jitter: 0, seed: 7, spine: true, flakeStyle: "star" },
  plate: { sides: 6, radius: 0.16, rings: 3, rot: 0, star: 0, spokes: true },
  ring: { radius: 0.6, sides: 0, rot: 0, double: false, gap: 0.02, dash: false },
};

export const TYPE_NAMES = { arms: "Arms", crystals: "Crystal ring", plate: "Hex plate", ring: "Ring" };

export const PHOTO_DEFAULTS = { on: false, radius: 0.42, rim: 0.045, overhang: 0.09, icicles: 40, seed: 11, fill: 0.35, ridges: 1, width: 2 };

let counter = 0;
export const newId = () => `L${Date.now().toString(36)}${(counter++).toString(36)}`;

export const makeLayer = (type, name, over = {}) => ({
  id: newId(), type, name, visible: true, ...STYLE_DEFAULTS, ...TYPE_DEFAULTS[type], ...over,
});

/** Fill in anything missing from a stored design and give its layers fresh ids. */
export function normalizeDoc(d) {
  return {
    name: d.name || "snowflake",
    glowColor: d.glowColor || "#FFFFFF",
    glow: d.glow ?? 1,
    photo: { ...PHOTO_DEFAULTS, ...d.photo },
    layers: (d.layers || [])
      .filter((l) => TYPE_DEFAULTS[l.type])
      .map((l) => ({ ...STYLE_DEFAULTS, ...TYPE_DEFAULTS[l.type], ...l, id: newId() })),
  };
}
