// Declarative control lists. The UI renders one control per entry.

const R = (k, label, min, max, step, fmt) => ({ k, label, t: "range", min, max, step, fmt });
const S = (k, label, options) => ({ k, label, t: "select", options });
const B = (k, label) => ({ k, label, t: "check" });
const COLOR = (k, label) => ({ k, label, t: "color" });

const pct = (v) => Math.round(v * 100) + "%";
const deg = (v) => (+v).toFixed(1).replace(".0", "") + "°";

const SHAPES = [["kite", "Kite"], ["leaf", "Leaf"], ["shard", "Shard"], ["spike", "Spike"], ["arrow", "Arrowhead"], ["chevron", "Chevron"], ["hex", "Hex plate"]];
const TIPS = [["none", "None"], ["diamond", "Diamond"], ["spear", "Spear"], ["arrow", "Arrowhead"], ["hex", "Hex plate"], ["trident", "Trident"], ["star", "Star burst"]];

export const LAYER_SCHEMA = {
  arms: [
    ["Structure", [
      R("count", "Number of arms", 2, 24, 1), R("rot", "Rotation", 0, 180, 0.5, deg),
      R("r0", "Starts at radius", 0, 0.9, 0.005, pct), R("len", "Reaches radius", 0.05, 1.05, 0.005, pct), B("rails", "Double spine"),
    ]],
    ["Branches", [
      R("branches", "Branches per side", 0, 14, 1), R("bStart", "First branch at", 0, 1, 0.01, pct), R("bEnd", "Last branch at", 0, 1, 0.01, pct),
      R("angle", "Branch angle", 10, 90, 0.5, deg), R("bLen", "Branch length", 0, 0.7, 0.005, pct), R("taper", "Taper toward tip", -1, 1, 0.05),
      S("bShape", "Branch shape", [["line", "Line"], ["fern", "Fern"], ["needle", "Needle"], ["plate", "Plate-tipped"], ...SHAPES]),
      R("bWidth", "Branch fullness", 0.05, 0.7, 0.01), R("fronds", "Fronds on each branch", 0, 10, 1),
    ]],
    ["Tip and beads", [
      S("tip", "Tip shape", TIPS), R("tipSize", "Tip size", 0, 0.25, 0.005),
      R("lozenges", "Beads on spine", 0, 5, 1), R("lozSize", "Bead size", 0.01, 0.14, 0.005),
    ]],
  ],
  crystals: [
    ["Placement", [
      R("count", "Number of crystals", 2, 96, 1), R("rot", "Rotation", 0, 180, 0.25, deg),
      R("r0", "Inner radius", 0, 1.1, 0.005, pct), R("r1", "Outer radius", 0, 1.1, 0.005, pct),
      S("dir", "Pointing", [["out", "Outward"], ["in", "Inward"], ["both", "Both ways"]]),
    ]],
    ["Shape", [
      S("shape", "Crystal shape", [...SHAPES, ["flake", "Tiny snowflake"]]),
      { ...S("flakeStyle", "Tiny snowflake style", [["star", "Star"], ["fern", "Fern"], ["plate", "Plate"]]), when: (l) => l.shape === "flake" },
      R("cw", "Crystal width", 0.005, 0.4, 0.001), R("widest", "Widest point", 0.05, 0.95, 0.01, pct),
      R("alt", "Every other crystal", 0.1, 1, 0.01, pct), R("jitter", "Irregularity", 0, 1, 0.01, pct),
      R("seed", "Variation", 1, 200, 1), B("spine", "Centre line"),
    ]],
  ],
  plate: [["Plate", [
    R("sides", "Sides", 3, 12, 1), R("radius", "Radius", 0.02, 0.9, 0.005, pct), R("rings", "Nested rings", 1, 8, 1),
    R("rot", "Rotation", 0, 60, 0.5, deg), R("star", "Star points", 0, 0.95, 0.01, (v) => (v > 0 ? pct(v) : "off")), B("spokes", "Spokes to corners"),
  ]]],
  ring: [["Ring", [
    R("radius", "Radius", 0.02, 1.1, 0.005, pct), S("sides", "Outline", [[0, "Circle"], [6, "Hexagon"], [8, "Octagon"], [12, "12-sided"]]),
    R("rot", "Rotation", 0, 60, 0.5, deg), B("double", "Double line"), R("gap", "Double-line gap", 0.004, 0.06, 0.001, pct), B("dash", "Dotted"),
  ]]],
};

export const STYLE_SCHEMA = [
  COLOR("color", "Line colour"), COLOR("tint", "Fill colour"), COLOR("facet", "Facet highlight"),
  R("width", "Line weight", 0.3, 8, 0.1), R("fill", "Fill opacity", 0, 0.9, 0.01, pct), R("ridges", "Etched facets", 0, 6, 1),
  R("glow", "Glow", 0, 2, 0.05), R("opacity", "Layer opacity", 0, 1, 0.01, pct),
];

export const PHOTO_SCHEMA = [
  R("radius", "Photo radius", 0.1, 0.8, 0.005, pct), R("rim", "Ice rim width", 0, 0.12, 0.002, pct),
  R("overhang", "Icicle overhang", 0, 0.2, 0.002, pct), R("icicles", "Icicles", 8, 90, 1), R("seed", "Variation", 1, 200, 1),
  R("fill", "Ice opacity", 0, 0.9, 0.01, pct), R("width", "Line weight", 0.3, 6, 0.1), R("ridges", "Etched facets", 0, 3, 1),
];

const lightFrom = (v) => {
  const named = { 0: "above", 90: "right", "-90": "left", 180: "below", "-180": "below" };
  return named[v] ? `${deg(v)} · ${named[v]}` : deg(v);
};

export const LIGHT_SCHEMA = [
  R("angle", "Light comes from", -180, 180, 1, lightFrom), R("strength", "Shading strength", 0, 1, 0.01, pct),
  COLOR("highlight", "Lit side colour"), COLOR("shadow", "Shaded side colour"),
];

export const LINE_WEIGHT_SCHEMA = R("lineWeight", "Line weight · every layer", 0.5, 3, 0.05, (v) => "×" + (+v).toFixed(2));

export const GLOW_SCHEMA = R("glow", "Glow strength", 0, 2, 0.05);
