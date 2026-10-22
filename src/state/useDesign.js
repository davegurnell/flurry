import { useCallback, useEffect, useMemo, useReducer } from "react";
import { historyReducer, initHistory, applyPalette } from "./history.js";
import { normalizeDoc } from "../model/defaults.js";
import { PRESETS, DEFAULT_PRESET } from "../model/presets.js";
import { PALETTES, DEFAULT_PALETTE } from "../model/palettes.js";
import { read, write, KEYS } from "../lib/storage.js";

function loadInitial() {
  const saved = read(KEYS.doc, null);
  return saved && Array.isArray(saved.layers) ? normalizeDoc(saved) : applyPalette(PALETTES[DEFAULT_PALETTE])(PRESETS[DEFAULT_PRESET].make());
}

/** The current design plus undo, persisted to this browser on every committed change. */
export function useDesign() {
  const [state, dispatch] = useReducer(historyReducer, undefined, () => initHistory(loadInitial()));

  useEffect(() => { write(KEYS.doc, state.baseline); }, [state.baseline]);

  const edit = useCallback((fn, commit = false) => dispatch({ type: "edit", fn, commit }), []);
  const commit = useCallback(() => dispatch({ type: "commit" }), []);
  const replace = useCallback((doc) => dispatch({ type: "replace", doc }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);

  return useMemo(
    () => ({ doc: state.doc, canUndo: state.past.length > 0 || state.doc !== state.baseline, edit, commit, replace, undo }),
    [state, edit, commit, replace, undo],
  );
}
