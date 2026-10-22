// `bg` is the preview background that suits the palette.
export const PALETTES = {
  frost: { label: "Royal ice · for pale backgrounds", color: "#2B5FB8", tint: "#9DC2EE", facet: "#FFFFFF", glow: "#FFFFFF", highlight: "#FFFFFF", shadow: "#1E4A9E", bg: "frost" },
  glacier: { label: "Glacier glow · like the film", color: "#BFE6FF", tint: "#5B8FF0", facet: "#E4F4FF", glow: "#3F97FF", highlight: "#CDEBFF", shadow: "#3A2E9E", bg: "night" },
  moon: { label: "Moonlight · for dark backgrounds", color: "#FFFFFF", tint: "#BFE3FF", facet: "#DDF1FF", glow: "#6DB8FF", highlight: "#FFFFFF", shadow: "#3469C2", bg: "night" },
  silver: { label: "Silver frost", color: "#5E7699", tint: "#D3E1F2", facet: "#FFFFFF", glow: "#FFFFFF", highlight: "#FFFFFF", shadow: "#556C8F", bg: "frost" },
  aurora: { label: "Aurora · violet and teal", color: "#5B4FC4", tint: "#9FE3E0", facet: "#FFFFFF", glow: "#E9F7FF", highlight: "#F2FFFE", shadow: "#4636A8", bg: "frost" },
};

// What a first-time visitor sees.
export const DEFAULT_PALETTE = "glacier";

export const BACKGROUNDS = {
  frost: "Pale frost",
  night: "Night blue",
  checker: "Checkerboard (shows transparency)",
};
