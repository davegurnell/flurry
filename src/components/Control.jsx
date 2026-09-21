/**
 * One control from a schema entry. `onChange(value, done)`: `done` is false while a
 * slider or colour is being dragged and true once the change is final.
 */
export function Control({ spec, value, onChange, onCommit, idPrefix }) {
  const id = `${idPrefix}-${spec.k}`;

  if (spec.t === "check") {
    return (
      <div className="ctl check">
        <label htmlFor={id}>{spec.label}</label>
        <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked, true)} />
      </div>
    );
  }

  if (spec.t === "select") {
    return (
      <div className="ctl">
        <label htmlFor={id}>{spec.label}</label>
        <select
          id={id}
          value={String(value)}
          onChange={(e) => {
            const opt = spec.options.find(([v]) => String(v) === e.target.value);
            onChange(opt ? opt[0] : e.target.value, true);
          }}
        >
          {spec.options.map(([v, t]) => <option key={v} value={String(v)}>{t}</option>)}
        </select>
      </div>
    );
  }

  if (spec.t === "color") {
    return (
      <div className="ctl">
        <label htmlFor={id}>{spec.label}</label>
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value, false)} onBlur={onCommit} />
      </div>
    );
  }

  const shown = spec.fmt ? spec.fmt(+value) : (+value).toFixed(spec.step >= 1 ? 0 : 2);
  return (
    <div className="ctl">
      <label htmlFor={id}>{spec.label}</label>
      <output htmlFor={id}>{shown}</output>
      <input
        id={id}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        onChange={(e) => onChange(+e.target.value, false)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
      />
    </div>
  );
}

/** Render every control in `specs` against `obj`. */
export function Controls({ specs, obj, onChange, onCommit, idPrefix }) {
  return specs
    .filter((s) => !s.when || s.when(obj))
    .map((s) => (
      <Control key={s.k} spec={s} value={obj[s.k]} idPrefix={idPrefix} onCommit={onCommit} onChange={(v, done) => onChange({ [s.k]: v }, done)} />
    ));
}
