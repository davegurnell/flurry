import { buildSVG } from "../engine/svg.js";

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const svgBlob = (doc) => new Blob([buildSVG(doc).svg], { type: "image/svg+xml" });

/** Rasterise the design to a transparent PNG `px` pixels square. */
export async function pngBlob(doc, px) {
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(buildSVG(doc, { px }).svg);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  canvas.getContext("2d").drawImage(img, 0, 0, px, px);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("empty canvas"))), "image/png"));
}
