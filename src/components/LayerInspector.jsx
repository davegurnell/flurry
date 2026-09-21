import { TYPE_NAMES } from "../model/defaults.js";
import { LAYER_SCHEMA, STYLE_SCHEMA } from "../model/schema.js";
import { patchLayer } from "../state/history.js";
import { Controls } from "./Control.jsx";

export function LayerInspector({ design, layer }) {
  const { edit, commit, doc } = design;
  const photoOn = doc.photo.on;
  if (!layer) return <aside className="panel right"><p className="note">Add a layer to start building.</p></aside>;

  const change = (patch, done) => edit(patchLayer(layer.id, patch), done);

  return (
    <aside className="panel right">
      <section>
        <h2>{TYPE_NAMES[layer.type]} layer</h2>
        <div className="ctl">
          <label htmlFor="layerName">Layer name</label>
          <input id="layerName" type="text" value={layer.name} onChange={(e) => change({ name: e.target.value }, false)} onBlur={commit} />
        </div>
        {photoOn && (
          <div className="ctl check">
            <label htmlFor="layerFront">In front of the photo</label>
            <input id="layerFront" type="checkbox" checked={!!layer.front} onChange={(e) => change({ front: e.target.checked }, true)} />
          </div>
        )}
      </section>
      {LAYER_SCHEMA[layer.type].map(([title, specs]) => (
        <section className="group" key={title}>
          <h3>{title}</h3>
          <Controls specs={specs} obj={layer} idPrefix="p" onChange={change} onCommit={commit} />
        </section>
      ))}
      <section className="group">
        <h3>Colour and finish</h3>
        <Controls specs={STYLE_SCHEMA} obj={layer} idPrefix="s" onChange={change} onCommit={commit} />
      </section>
    </aside>
  );
}
