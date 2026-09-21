import { useState } from "react";
import { PRESETS } from "../model/presets.js";
import { slug } from "../engine/svg.js";
import { downloadBlob, svgBlob, pngBlob } from "../lib/download.js";

const PNG_SIZES = [2000, 4000, 6000];
const PRESET_GROUPS = [...new Set(Object.values(PRESETS).map((p) => p.group))];

export function TopBar({ design, onPreset, onRandom, toast }) {
  const { doc, edit, commit, undo, canUndo } = design;
  const [pngPx, setPngPx] = useState(4000);
  const [rendering, setRendering] = useState(false);
  const [copying, setCopying] = useState(false);
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

  // Canva pastes clipboard images but not SVG text, and browsers only copy PNG
  // reliably, so this copies a transparent PNG at the chosen size.
  // The PNG is passed as a promise so Safari still counts the click as the gesture.
  async function copyImage() {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      toast("This browser can't copy images. Use Download SVG instead.");
      return;
    }
    setCopying(true);
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob(doc, pngPx) })]);
      toast(`Copied a ${pngPx} px image. Paste it into Canva.`);
    } catch {
      toast("Your browser blocked the clipboard. Use Download SVG instead.");
    }
    setCopying(false);
  }

  return (
    <header className="top">
      <h1 className="brand">Letters from the Sky</h1>
      <div className="cluster">
        <label className="note" htmlFor="presetSel">Start from</label>
        <select id="presetSel" value="" onChange={(e) => e.target.value && onPreset(e.target.value)}>
          <option value="">Choose a preset…</option>
          {PRESET_GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {Object.entries(PRESETS).filter(([, p]) => p.group === g).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </optgroup>
          ))}
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
        <button type="button" onClick={copyImage} disabled={copying}>{copying ? "Copying…" : "Copy image"}</button>
      </div>
    </header>
  );
}
