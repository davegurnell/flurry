// Undo history for the design. Slider drags call `edit` on every tick and
// `commit` when released, so one drag becomes a single undo step.

const LIMIT = 80;

export const initHistory = (doc) => ({ doc, baseline: doc, past: [] });

const settle = (s) => (s.doc === s.baseline ? s : { ...s, past: [...s.past, s.baseline].slice(-LIMIT), baseline: s.doc });

export function historyReducer(s, action) {
  switch (action.type) {
    case "edit": {
      const doc = action.fn(s.doc);
      const next = doc === s.doc ? s : { ...s, doc };
      return action.commit ? settle(next) : next;
    }
    case "commit":
      return settle(s);
    case "replace": // a whole new design (preset, library, random); undoable
      return settle({ ...settle(s), doc: action.doc });
    case "undo": {
      // Throw away an uncommitted live edit first, otherwise step back.
      if (s.doc !== s.baseline) return { ...s, doc: s.baseline };
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return { doc: prev, baseline: prev, past: s.past.slice(0, -1) };
    }
    default:
      return s;
  }
}

// Immutable helpers used by the UI.
export const patchLayer = (id, patch) => (d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
export const patchDoc = (patch) => (d) => ({ ...d, ...patch });
export const patchPhoto = (patch) => (d) => ({ ...d, photo: { ...d.photo, ...patch } });
export const patchLight = (patch) => (d) => ({ ...d, light: { ...d.light, ...patch } });
export const recolourAll = (c) => (d) => ({ ...d, layers: d.layers.map((l) => ({ ...l, color: c.color, tint: c.tint, facet: c.facet })) });

export function moveLayer(id, delta) {
  return (d) => {
    const i = d.layers.findIndex((l) => l.id === id), j = i + delta;
    if (i < 0 || j < 0 || j >= d.layers.length) return d;
    const layers = d.layers.slice();
    [layers[i], layers[j]] = [layers[j], layers[i]];
    return { ...d, layers };
  };
}
export const insertLayer = (layer, at = 0) => (d) => {
  const layers = d.layers.slice();
  layers.splice(at, 0, layer);
  return { ...d, layers };
};
export const removeLayer = (id) => (d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) });
