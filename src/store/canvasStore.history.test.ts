import assert from "node:assert/strict";
import test from "node:test";

import { useCanvasStore } from "./canvasStore";

test("history snapshots ignore invalid selection ids", () => {
  const state = useCanvasStore.getState();
  const initial = state.nodes;

  const next = {
    ...initial,
    a: { id: "a", type: "rectangle", name: "Rect", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 10, height: 10, rotation: 0 }, style: { opacity: 1 } },
  };

  useCanvasStore.setState({
    nodes: next,
    selectedNodeIds: new Set(["a", "missing"]),
  });

  const snapshot = useCanvasStore.getState().selectedNodeIds;
  assert.ok(snapshot.has("a"));
  assert.equal(snapshot.has("missing"), false);
});

test("grouping rejects invalid child parent relationships", () => {
  const store = useCanvasStore.getState();

  const nodes = {
    a: { id: "a", type: "rectangle", name: "A", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 20, height: 20, rotation: 0 }, style: { opacity: 1 } },
    b: { id: "b", type: "rectangle", name: "B", parentId: null, order: 1, geometry: { x: 30, y: 0, width: 20, height: 20, rotation: 0 }, style: { opacity: 1 } },
  };

  useCanvasStore.setState({
    nodes,
    selectedNodeIds: new Set(["a", "b"]),
    nextNumber: { ...store.nextNumber },
  });

  useCanvasStore.getState().groupSelected();

  const grouped = useCanvasStore.getState().nodes;
  const groupNode = Object.values(grouped).find((node) => node.type === "group");
  assert.ok(groupNode);
  assert.equal(groupNode?.children?.length, 2);
});

test("groupSelected rejects mixed parents and nested selections", () => {
  const store = useCanvasStore.getState();
  const nodes = {
    a: { id: "a", type: "rectangle", name: "A", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 20, height: 20, rotation: 0 }, style: { opacity: 1 } },
    b: { id: "b", type: "rectangle", name: "B", parentId: null, order: 1, geometry: { x: 30, y: 0, width: 20, height: 20, rotation: 0 }, style: { opacity: 1 } },
    g: { id: "g", type: "group", name: "Parent group", parentId: null, order: 2, geometry: { x: 0, y: 0, width: 50, height: 20, rotation: 0 }, style: { opacity: 1 }, children: ["a"] },
  };

  useCanvasStore.setState({
    nodes,
    selectedNodeIds: new Set(["g", "b"]),
    nextNumber: { ...store.nextNumber },
  });

  useCanvasStore.getState().groupSelected();

  const grouped = useCanvasStore.getState().nodes;
  const groupNodes = Object.values(grouped).filter((node) => node.type === "group");
  assert.equal(groupNodes.length, 1);
  assert.equal(groupNodes[0].children?.length, 1);
});

test("setActivePage preserves the active page snapshot and clears selection safely", () => {
  const store = useCanvasStore.getState();
  const pages = {
    "page-1": { id: "page-1", name: "Home", slug: "index", nodes: { a: { id: "a", type: "rectangle", name: "A", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 20, height: 20, rotation: 0 }, style: { opacity: 1 } } } },
    "page-2": { id: "page-2", name: "About", slug: "about", nodes: { b: { id: "b", type: "text", name: "B", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 40, height: 20, rotation: 0 }, style: { opacity: 1 }, content: { kind: "text", text: "Hello" } } } },
  };

  useCanvasStore.setState({
    pages,
    activePageId: "page-1",
    nodes: pages["page-1"].nodes,
    selectedNodeIds: new Set(["a"]),
    nextNumber: { ...store.nextNumber },
  });

  useCanvasStore.getState().setActivePage("page-2");

  const next = useCanvasStore.getState();
  assert.equal(next.activePageId, "page-2");
  assert.equal(next.nodes.b.id, "b");
  assert.equal(next.selectedNodeIds.size, 0);
});
