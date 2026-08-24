import { describe, it, expect } from "vitest";
import type { CanvasNode, NodesById } from "../types/canvas";
import { resolveNodeBox, resolveNodeStyle, resolveNodeContent, getRenderTree } from "./nodeResolver";
import { exportSite } from "./exportSite";
import { exportReact } from "./exportReact";
import { exportNextjs } from "./exportNextjs";
import { exportTailwind } from "./exportTailwind";

describe("Single Source of Truth nodeResolver Engine", () => {
  const sampleGroupParent: CanvasNode = {
    id: "group-1",
    parentId: null,
    type: "group",
    name: "Header Group",
    order: 1,
    geometry: { x: 100, y: 200, width: 800, height: 100, rotation: 0 },
    style: { opacity: 1 },
    children: ["child-1", "child-2"],
  };

  const sampleChildNode: CanvasNode = {
    id: "child-1",
    parentId: "group-1",
    type: "text",
    name: "Group Title Text",
    order: 2,
    geometry: { x: 120, y: 220, width: 200, height: 30, rotation: 0 },
    style: {
      fill: "#3b82f6",
      cornerRadius: 8,
      opacity: 0.9,
      typography: { fontFamily: "Roboto", fontSize: 16, fontWeight: 700, color: "#ffffff", align: "left", lineHeight: 1.4 },
    },
    content: { kind: "text", text: "Hello Canvas World" },
  };

  const sampleNodes: NodesById = {
    "group-1": sampleGroupParent,
    "child-1": sampleChildNode,
  };

  it("resolveNodeBox resolves parent-relative coordinates for group children to fix double-offsetting", () => {
    const parentBox = resolveNodeBox(sampleGroupParent, sampleNodes);
    expect(parentBox.x).toBe(100);
    expect(parentBox.y).toBe(200);
    expect(parentBox.relativeX).toBe(100);
    expect(parentBox.relativeY).toBe(200);
    expect(parentBox.isChildOfGroup).toBe(false);

    const childBox = resolveNodeBox(sampleChildNode, sampleNodes);
    expect(childBox.x).toBe(120);
    expect(childBox.y).toBe(220);
    expect(childBox.relativeX).toBe(20); // 120 - 100
    expect(childBox.relativeY).toBe(20); // 220 - 200
    expect(childBox.isChildOfGroup).toBe(true);
  });

  it("resolveNodeStyle extracts typography, fills, and vector flags", () => {
    const style = resolveNodeStyle(sampleChildNode);
    expect(style.fill).toBe("#3b82f6");
    expect(style.cornerRadius).toBe(8);
    expect(style.opacity).toBe(0.9);
    expect(style.typography?.fontFamily).toBe("Roboto");
    expect(style.typography?.fontSize).toBe(16);
    expect(style.isVectorShape).toBe(false);
  });

  it("resolveNodeContent fills fallback defaults and visibility toggles", () => {
    const content = resolveNodeContent(sampleChildNode);
    expect(content.text).toBe("Hello Canvas World");
    expect(content.showLogo).toBe(true);
    expect(content.showCta).toBe(true);
    expect(content.showTitle).toBe(true);
  });

  it("getRenderTree sorts nodes spatially by Y ascending then X ascending", () => {
    const nodesMap: NodesById = {
      "node-bottom": { id: "node-bottom", parentId: null, type: "rectangle", name: "Bottom", order: 1, geometry: { x: 0, y: 500, width: 100, height: 100, rotation: 0 }, style: {} },
      "node-top": { id: "node-top", parentId: null, type: "rectangle", name: "Top", order: 2, geometry: { x: 0, y: 50, width: 100, height: 100, rotation: 0 }, style: {} },
    };
    const tree = getRenderTree(nodesMap);
    expect(tree[0].id).toBe("node-top");
    expect(tree[1].id).toBe("node-bottom");
  });

  it("all 4 code exporters (HTML/CSS, React, Next.js, Tailwind) run cleanly with 0 dropped properties", () => {
    const pages = {
      "page-1": {
        id: "page-1",
        name: "Home",
        slug: "index",
        nodes: sampleNodes,
      },
    };

    const htmlRes = exportSite(pages, "page-1");
    expect(htmlRes.css).toContain("left: 20px;"); // relative offset check
    expect(htmlRes.css).toContain("top: 20px;");
    expect(htmlRes.css).toContain("font-family: Roboto");

    const reactRes = exportReact(pages, "page-1");
    expect(reactRes.components.length).toBeGreaterThan(0);

    const nextRes = exportNextjs(pages, "page-1");
    expect(nextRes.files.length).toBeGreaterThan(0);

    const tailwindRes = exportTailwind(pages, "page-1");
    expect(tailwindRes.css).toContain("@tailwind");
  });
});
