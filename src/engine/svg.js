import { Ink, SIZE, C, K, circleD } from "./ink.js";
import { DRAW, drawPhoto, photoCut } from "./draw.js";
import { STYLE_DEFAULTS } from "../model/defaults.js";

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "layer";

/** Share of the graphic's width the photo should take up in Canva. */
export const photoWidthShare = (photo) => (2 * photoCut(photo) * K) / SIZE;

/**
 * Which parts of a photo design to export. With a photo opening, layers marked
 * `front` and the icy rim go in front of the photo; everything else goes behind it.
 * Both parts share the same canvas so they line up when stacked at the same size.
 */
export const PARTS = { all: "Whole design", back: "Behind the photo", front: "In front of the photo" };

/**
 * Render a design to a standalone SVG string with a transparent background.
 * `preview` adds an on-screen stand-in for the photo that is never exported.
 */
export function buildSVG(doc, { px = SIZE, preview = false, part = "all" } = {}) {
  const photo = doc.photo.on;
  if (!photo) part = "all";
  const lineScale = doc.lineWeight ?? 1;
  let count = 0;

  const render = (layers) => {
    const groups = [];
    // The first layer in the list is the top of the stack, so draw from the end.
    for (let i = doc.layers.length - 1; i >= 0; i--) {
      const l = doc.layers[i];
      if (!layers.includes(l)) continue;
      const ink = new Ink(l, doc.glowColor, doc.glow, doc.light, lineScale);
      DRAW[l.type](ink, l);
      count += ink.count();
      groups.push(`<g id="${slug(l.name)}-${i + 1}">${ink.out()}</g>`);
    }
    return groups.join("\n");
  };

  const visible = doc.layers.filter((l) => l.visible);
  const inFront = (l) => photo && l.front;
  let body = "", defs = "";

  if (part !== "front") {
    const back = render(visible.filter((l) => !inFront(l)));
    if (photo) {
      defs = `<defs><clipPath id="photo-cut"><path clip-rule="evenodd" d="M0 0H${SIZE}V${SIZE}H0Z${circleD(photoCut(doc.photo))}"/></clipPath></defs>`;
      body += `<g id="behind-photo" clip-path="url(#photo-cut)">${back}</g>`;
    } else body += back;
  }

  if (photo && preview) {
    const r = (K * photoCut(doc.photo)).toFixed(1);
    body += `\n<circle cx="${C}" cy="${C}" r="${r}" fill="#8EA6C8" fill-opacity="0.35" stroke="#8599C2" stroke-width="1.5" stroke-dasharray="6 6"/>`;
  }

  if (photo && part !== "back") {
    const front = render(visible.filter(inFront));
    // The rim borrows its colours from the top visible layer.
    const style = { ...(visible[0] || STYLE_DEFAULTS), ...doc.photo, glow: 1, opacity: 1 };
    const ink = new Ink(style, doc.glowColor, doc.glow, doc.light, lineScale);
    drawPhoto(ink, doc.photo);
    count += ink.count();
    body += `\n<g id="in-front-of-photo">${front}\n<g id="photo-rim">${ink.out()}</g></g>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${SIZE} ${SIZE}">\n<title>${esc(doc.name)}</title>\n${defs}${body}\n</svg>`;
  return { svg, count };
}
