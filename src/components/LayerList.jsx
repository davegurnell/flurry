import { useState } from "react";
import { TYPE_NAMES, makeLayer, newId, STYLE_DEFAULTS } from "../model/defaults.js";
import { insertLayer, moveLayer, patchLayer, removeLayer } from "../state/history.js";

export function LayerList({ design, selected, onSelect }) {
  const { doc, edit } = design;
  const [addType, setAddType] = useState("arms");
  const i = doc.layers.findIndex((l) => l.id === selected?.id);

  function add() {
    const base = selected || STYLE_DEFAULTS;
    const layer = makeLayer(addType, TYPE_NAMES[addType], { color: base.color, tint: base.tint, facet: base.facet });
    edit(insertLayer(layer, 0), true);
    onSelect(layer.id);
  }
  function duplicate() {
    const copy = { ...selected, id: newId(), name: selected.name + " copy" };
    edit(insertLayer(copy, i), true);
    onSelect(copy.id);
  }
  function remove() {
    const next = doc.layers[i + 1] || doc.layers[i - 1];
    edit(removeLayer(selected.id), true);
    onSelect(next?.id);
  }

  return (
    <section>
      <h2>Layers · top to bottom</h2>
      <ul className="layers">
        {doc.layers.map((l) => (
          <li key={l.id} className={(l.id === selected?.id ? "sel" : "") + (l.visible ? "" : " hidden")}>
            <input
              id={`vis-${l.id}`}
              type="checkbox"
              checked={l.visible}
              aria-label={`Show ${l.name}`}
              onChange={(e) => edit(patchLayer(l.id, { visible: e.target.checked }), true)}
            />
            <button type="button" className="pick" aria-pressed={l.id === selected?.id} onClick={() => onSelect(l.id)}>
              <span>{l.name || "Untitled"}</span>
              <span className="chip">{TYPE_NAMES[l.type]}</span>
            </button>
          </li>
        ))}
        {!doc.layers.length && <li className="empty">No layers yet</li>}
      </ul>
      <div className="layer-tools">
        <button type="button" disabled={i <= 0} onClick={() => edit(moveLayer(selected.id, -1), true)}>Up</button>
        <button type="button" disabled={i < 0 || i >= doc.layers.length - 1} onClick={() => edit(moveLayer(selected.id, 1), true)}>Down</button>
        <button type="button" disabled={i < 0} onClick={duplicate}>Copy</button>
        <button type="button" disabled={i < 0} onClick={remove}>Delete</button>
      </div>
      <div className="add-row">
        <select id="addSel" aria-label="Layer type to add" value={addType} onChange={(e) => setAddType(e.target.value)}>
          {Object.entries(TYPE_NAMES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <button type="button" onClick={add}>Add layer</button>
      </div>
    </section>
  );
}
