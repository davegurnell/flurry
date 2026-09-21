import { Ink, SIZE, C, K, circleD } from "./ink.js";
import { DRAW, drawPhoto, photoCut } from "./draw.js";
import { STYLE_DEFAULTS } from "../model/defaults.js";

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "layer";

/** Share of the graphic's width the photo should take up in Canva. */
export const photoWidthShare = (photo) => (2 * photoCut(photo) * K) / SIZE;

/**
 * Render a design to a standalone SVG string with a transparent background.
 * `preview` adds an on-screen guide for the photo edge that is never exported.
 */
export function buildSVG(doc, { px = SIZE, preview = false } = {}) {
  const groups = [];
  let count = 0;
  // The first layer in the list is the top of the stack, so draw from the end.
  for (let i = doc.layers.length - 1; i >= 0; i--) {
    const l = doc.layers[i];
    if (!l.visible) continue;
    const ink = new Ink(l, doc.glowColor, doc.glow, doc.light);
    DRAW[l.type](ink, l);
    count += ink.count();
    groups.push(`<g id="${slug(l.name)}-${i + 1}">${ink.out()}</g>`);
  }

  let body = groups.join("\n"), defs = "";
  if (doc.photo.on) {
    const cut = photoCut(doc.photo);
    defs = `<defs><clipPath id="photo-cut"><path clip-rule="evenodd" d="M0 0H${SIZE}V${SIZE}H0Z${circleD(cut)}"/></clipPath></defs>`;
    body = `<g clip-path="url(#photo-cut)">${body}</g>`;
    // The rim borrows its colours from the top visible layer.
    const style = { ...(doc.layers.find((l) => l.visible) || STYLE_DEFAULTS), ...doc.photo, glow: 1, opacity: 1 };
    const ink = new Ink(style, doc.glowColor, doc.glow, doc.light);
    drawPhoto(ink, doc.photo);
    count += ink.count();
    body += `\n<g id="photo-rim">${ink.out()}</g>`;
    if (preview) {
      body += `<circle cx="${C}" cy="${C}" r="${(K * cut).toFixed(1)}" fill="none" stroke="#8599C2" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.8"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${SIZE} ${SIZE}">\n<title>${esc(doc.name)}</title>\n${defs}${body}\n</svg>`;
  return { svg, count };
}
