import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEditorState, syncPageNodes, createDefaultPages } from "./editorState";
import { sanitizeNodeChildren, isValidNodeMap } from "../utils/editorValidation";

test("normalizeEditorState builds a safe default page graph", () => {
  const result = normalizeEditorState({
    pages: {
      "page-1": {
        id: "page-1",
        name: "Home",
        slug: "index",
        nodes: {
          a: { id: "a", type: "rectangle", name: "Rect", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 10, height: 10, rotation: 0 }, style: { opacity: 1 } },
        },
      },
    },
    activePageId: "page-1",
  });

  assert.equal(result.activePageId, "page-1");
  assert.equal(Object.keys(result.pages).length, 1);
  assert.equal(result.nodes.a.id, "a");
});

test("syncPageNodes preserves active page edits", () => {
  const pages = createDefaultPages({
    a: { id: "a", type: "rectangle", name: "Rect", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 10, height: 10, rotation: 0 }, style: { opacity: 1 } },
  });

  const next = syncPageNodes(pages, "page-1", {
    a: { id: "a", type: "rectangle", name: "Rect", parentId: null, order: 0, geometry: { x: 20, y: 20, width: 30, height: 30, rotation: 0 }, style: { opacity: 1 } },
  });

  assert.equal(next["page-1"].nodes.a.geometry.x, 20);
});

test("sanitizeNodeChildren removes missing parent references", () => {
  const nodes = {
    a: { id: "a", type: "group", name: "Group", parentId: null, order: 0, geometry: { x: 0, y: 0, width: 10, height: 10, rotation: 0 }, style: { opacity: 1 }, children: ["b"] },
    b: { id: "b", type: "rectangle", name: "Rect", parentId: "missing", order: 0, geometry: { x: 0, y: 0, width: 10, height: 10, rotation: 0 }, style: { opacity: 1 } },
  };

  const cleaned = sanitizeNodeChildren(nodes);
  assert.equal(cleaned.b.parentId, null);
});

test("isValidNodeMap rejects invalid node maps", () => {
  assert.equal(isValidNodeMap({ a: { id: "a", type: "rectangle" } as any }), false);
  assert.equal(isValidNodeMap({ a: { id: "a", type: "rectangle", name: "Rect" } }), true);
});
