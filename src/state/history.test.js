import { test } from "node:test";
import assert from "node:assert/strict";
import { historyReducer, initHistory, patchLayer, moveLayer } from "./history.js";

const doc0 = { name: "a", layers: [{ id: "x", v: 0 }, { id: "y", v: 0 }] };
const run = (s, ...actions) => actions.reduce(historyReducer, s);
const edit = (fn, commit = false) => ({ type: "edit", fn, commit });

test("a drag of many live edits becomes one undo step", () => {
  let s = initHistory(doc0);
  s = run(s, edit(patchLayer("x", { v: 1 })), edit(patchLayer("x", { v: 2 })), edit(patchLayer("x", { v: 3 })), { type: "commit" });
  assert.equal(s.past.length, 1);
  s = run(s, { type: "undo" });
  assert.equal(s.doc.layers[0].v, 0);
  assert.equal(s.past.length, 0);
});

test("undo during a drag drops the live edit first", () => {
  let s = run(initHistory(doc0), edit(patchLayer("x", { v: 1 }), true), edit(patchLayer("x", { v: 9 })));
  s = run(s, { type: "undo" });
  assert.equal(s.doc.layers[0].v, 1);
  s = run(s, { type: "undo" });
  assert.equal(s.doc.layers[0].v, 0);
});

test("commit without changes adds nothing", () => {
  const s = run(initHistory(doc0), { type: "commit" }, { type: "commit" });
  assert.equal(s.past.length, 0);
});

test("replace is undoable", () => {
  const other = { name: "b", layers: [] };
  let s = run(initHistory(doc0), { type: "replace", doc: other });
  assert.equal(s.doc, other);
  s = run(s, { type: "undo" });
  assert.equal(s.doc, doc0);
});

test("moveLayer swaps neighbours and ignores moves off the ends", () => {
  assert.deepEqual(moveLayer("y", -1)(doc0).layers.map((l) => l.id), ["y", "x"]);
  assert.equal(moveLayer("x", -1)(doc0), doc0);
});
