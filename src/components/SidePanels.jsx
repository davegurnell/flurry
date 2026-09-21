import { useState } from "react";
import { PALETTES, BACKGROUNDS } from "../model/palettes.js";
import { PHOTO_SCHEMA, GLOW_SCHEMA, LIGHT_SCHEMA } from "../model/schema.js";
import { normalizeDoc } from "../model/defaults.js";
import { patchDoc, patchPhoto, patchLight, recolourAll } from "../state/history.js";
import { photoWidthShare } from "../engine/svg.js";
import { read, write, KEYS } from "../lib/storage.js";
import { Control, Controls } from "./Control.jsx";

export function ColourPanel({ design, bg, setBg, toast }) {
  const { doc, edit, commit } = design;

  function applyPalette(key) {
    const p = PALETTES[key];
    if (!p) return;
    edit((d) => ({ ...recolourAll(p)(d), glowColor: p.glow, light: { ...d.light, highlight: p.highlight, shadow: p.shadow } }), true);
    setBg(p.bg);
    toast("Palette applied to every layer");
  }

  return (
    <section>
      <h2>Colour</h2>
      <div className="ctl">
        <label htmlFor="paletteSel">Palette for every layer</label>
        <select id="paletteSel" value="" onChange={(e) => applyPalette(e.target.value)}>
          <option value="">Apply a palette…</option>
          {Object.entries(PALETTES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
        </select>
      </div>
      <Control spec={{ k: "glowColor", label: "Glow colour", t: "color" }} value={doc.glowColor} idPrefix="doc"
        onChange={(v) => edit(patchDoc({ glowColor: v }))} onCommit={commit} />
      <Control spec={GLOW_SCHEMA} value={doc.glow} idPrefix="doc"
        onChange={(v, done) => edit(patchDoc({ glow: v }), done)} onCommit={commit} />
      <div className="ctl">
        <label htmlFor="bgSel">Preview background</label>
        <select id="bgSel" value={bg} onChange={(e) => setBg(e.target.value)}>
          {Object.entries(BACKGROUNDS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
      </div>
      <p className="note">The background is only for previewing. Downloads always have a transparent background.</p>
    </section>
  );
}

export function LightPanel({ design }) {
  const { doc, edit, commit } = design;
  const { light } = doc;
  return (
    <section>
      <h2>Fill shading</h2>
      <div className="ctl">
        <label htmlFor="lightMode">Fill style</label>
        <select id="lightMode" value={light.on ? "lit" : "flat"} onChange={(e) => edit(patchLight({ on: e.target.value === "lit" }), true)}>
          <option value="flat">Flat · one colour per layer</option>
          <option value="lit">Lit · shaded by a light source</option>
        </select>
      </div>
      {light.on && <Controls specs={LIGHT_SCHEMA} obj={light} idPrefix="light" onChange={(p, done) => edit(patchLight(p), done)} onCommit={commit} />}
      <p className="note">
        {light.on
          ? "Each crystal is split down its spine and each half is tilted slightly. The half facing the light blends toward the lit colour, the other toward the shaded colour. The layer's fill colour is the midtone."
          : "Turn on Lit to shade each crystal as if light were shining across the page. It lifts the snowflake off the background."}
      </p>
    </section>
  );
}

export function PhotoPanel({ design }) {
  const { doc, edit, commit } = design;
  const { photo } = doc;
  return (
    <section>
      <h2>Photo opening</h2>
      <div className="ctl check">
        <label htmlFor="photoOn">Leave a space for a photo</label>
        <input id="photoOn" type="checkbox" checked={photo.on} onChange={(e) => edit(patchPhoto({ on: e.target.checked }), true)} />
      </div>
      {photo.on && <Controls specs={PHOTO_SCHEMA} obj={photo} idPrefix="ph" onChange={(p, done) => edit(patchPhoto(p), done)} onCommit={commit} />}
      {photo.on ? (
        <p className="note">
          In Canva, put your photo in a circle frame <b>{(photoWidthShare(photo) * 100).toFixed(1)}%</b> of this graphic's width,
          centred underneath it. The dashed guide shows the edge and is not exported.
        </p>
      ) : (
        <p className="note">Turn this on to cut a round opening in the middle with icicles hanging over its edge.</p>
      )}
    </section>
  );
}

export function LibraryPanel({ design, toast }) {
  const { doc, replace } = design;
  const [items, setItems] = useState(() => read(KEYS.library, []));

  const store = (next) => {
    const ok = write(KEYS.library, next);
    if (ok) setItems(next);
    return ok;
  };

  function save() {
    const name = doc.name || "untitled";
    const next = [{ name, doc }, ...items.filter((x) => x.name !== name)].slice(0, 40);
    toast(store(next) ? `Saved ${name}` : "This browser won't let the page store designs. Download the SVG to keep it.");
  }

  return (
    <section>
      <h2>Saved designs</h2>
      <button type="button" onClick={save}>Save this design</button>
      <ul className="library">
        {items.map((item) => (
          <li key={item.name}>
            <button type="button" onClick={() => { replace(normalizeDoc(item.doc)); toast(`Opened ${item.name}`); }}>{item.name}</button>
            <button type="button" aria-label={`Remove ${item.name}`} onClick={() => store(items.filter((x) => x !== item))}>Remove</button>
          </li>
        ))}
      </ul>
      <p className="note">Saved designs are kept in this browser.</p>
    </section>
  );
}
