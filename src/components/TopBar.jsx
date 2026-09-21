import { useState } from "react";
import { PRESETS } from "../model/presets.js";
import { slug } from "../engine/svg.js";
import { downloadBlob, svgBlob, pngBlob } from "../lib/download.js";
import { buildSVG } from "../engine/svg.js";

const PNG_SIZES = [2000, 4000, 6000];

export function TopBar({ design, onPreset, onRandom, toast }) {
  const { doc, edit, commit, undo, canUndo } = design;
  const [pngPx, setPngPx] = useState(4000);
  const [rendering, setRendering] = useState(false);
  const base = slug(doc.name) || "snowflake";

  async function downloadPng() {
    setRendering(true);
    try {
      downloadBlob(`${base}-${pngPx}px.png`, await pngBlob(doc, pngPx));
    } catch {
      toast("This browser couldn't render the PNG. Download the SVG instead.");
    }
    setRendering(false);
  }

  async function copySvg() {
    try {
      await navigator.clipboard.writeText(buildSVG(doc).svg);
      toast("SVG code copied");
    } catch {
      toast("Your browser blocked the clipboard. Use Download SVG instead.");
    }
  }

  return (
    <header className="top">
      <h1 className="brand">Letters from the Sky</h1>
      <div className="cluster">
        <label className="note" htmlFor="presetSel">Start from</label>
        <select id="presetSel" value="" onChange={(e) => e.target.value && onPreset(e.target.value)}>
          <option value="">Choose a preset…</option>
          {Object.entries(PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
        </select>
        <button type="button" onClick={onRandom}>Surprise me</button>
        <button type="button" onClick={undo} disabled={!canUndo}>Undo</button>
      </div>
      <div className="grow" />
      <div className="cluster">
        <label className="note" htmlFor="docName">File name</label>
        <input id="docName" type="text" size={16} value={doc.name} onChange={(e) => edit((d) => ({ ...d, name: e.target.value }))} onBlur={commit} />
        <button type="button" className="primary" onClick={() => downloadBlob(`${base}.svg`, svgBlob(doc))}>Download SVG</button>
        <select id="pngSize" aria-label="PNG size" value={pngPx} onChange={(e) => setPngPx(+e.target.value)}>
          {PNG_SIZES.map((n) => <option key={n} value={n}>{n} px</option>)}
        </select>
        <button type="button" onClick={downloadPng} disabled={rendering}>{rendering ? "Rendering…" : "Download PNG"}</button>
        <button type="button" onClick={copySvg}>Copy SVG code</button>
      </div>
    </header>
  );
}
