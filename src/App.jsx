import { useCallback, useEffect, useRef, useState } from "react";
import { useDesign } from "./state/useDesign.js";
import { recolourAll } from "./state/history.js";
import { PRESETS, randomDesign } from "./model/presets.js";
import { read, write, KEYS } from "./lib/storage.js";
import { TopBar } from "./components/TopBar.jsx";
import { LayerList } from "./components/LayerList.jsx";
import { LayerInspector } from "./components/LayerInspector.jsx";
import { ColourPanel, LightPanel, PhotoPanel, LibraryPanel } from "./components/SidePanels.jsx";
import { Board } from "./components/Board.jsx";

function useToast() {
  const [msg, setMsg] = useState("");
  const [shown, setShown] = useState(false);
  const timer = useRef();
  const toast = useCallback((m) => {
    setMsg(m);
    setShown(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), 2600);
  }, []);
  const el = <div className={"toast" + (shown ? " show" : "")} role="status" aria-live="polite">{msg}</div>;
  return [toast, el];
}

export default function App() {
  const design = useDesign();
  const { doc, replace, undo } = design;
  const [selId, setSelId] = useState(doc.layers[0]?.id);
  const [bg, setBgState] = useState(() => read(KEYS.bg, "frost"));
  const [toast, toastEl] = useToast();

  // Undo or a new design can remove the selected layer; fall back to the top one.
  const selected = doc.layers.find((l) => l.id === selId) || doc.layers[0];

  const setBg = (v) => { setBgState(v); write(KEYS.bg, v); };

  function loadPreset(key) {
    let next = PRESETS[key].make();
    if (selected) next = recolourAll(selected)(next); // keep the colours the user has chosen
    next.glowColor = doc.glowColor;
    next.light = doc.light;
    replace(next);
    setSelId(next.layers[0]?.id);
  }

  function surprise() {
    const next = randomDesign(doc, selected);
    replace(next);
    setSelId(next.layers[0]?.id);
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo]);

  return (
    <div className="app">
      <TopBar design={design} onPreset={loadPreset} onRandom={surprise} toast={toast} />
      <aside className="panel left">
        <LayerList design={design} selected={selected} onSelect={setSelId} />
        <ColourPanel design={design} bg={bg} setBg={setBg} toast={toast} />
        <LightPanel design={design} />
        <PhotoPanel design={design} />
        <LibraryPanel design={design} toast={toast} />
      </aside>
      <Board doc={doc} bg={bg} />
      <LayerInspector design={design} layer={selected} />
      {toastEl}
    </div>
  );
}
