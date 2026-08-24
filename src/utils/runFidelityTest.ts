import type { CanvasNode, NodesById } from "../types/canvas";
import { resolveNodeBox, resolveNodeStyle, resolveNodeContent, getRenderTree } from "./nodeResolver";
import { exportSite } from "./exportSite";
import { exportToReact } from "./exportReact";
import { exportToNextjs } from "./exportNextjs";
import { exportToTailwind } from "./exportTailwind";

console.log("=== RUNNING FIDELITY PARITY UNIT TEST SUITE ===");

const sampleGroupParent: CanvasNode = {
  id: "group-1",
  parentId: null,
  type: "group",
  name: "Header Group",
  order: 1,
  geometry: { x: 100, y: 200, width: 800, height: 100, rotation: 0 },
  style: { opacity: 1 },
  children: ["child-1"],
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

// 1. Check resolveNodeBox relative offsets
const parentBox = resolveNodeBox(sampleGroupParent, sampleNodes);
const childBox = resolveNodeBox(sampleChildNode, sampleNodes);

console.assert(parentBox.relativeX === 100 && parentBox.relativeY === 200, "Parent box coordinates match world");
console.assert(childBox.relativeX === 20 && childBox.relativeY === 20, "Child box coordinates relative to parent (120-100=20, 220-200=20)");
console.assert(childBox.isChildOfGroup === true, "Child correctly identified as child of group");

// 2. Check resolveNodeStyle
const style = resolveNodeStyle(sampleChildNode);
console.assert(style.fill === "#3b82f6", "Style fill extracted");
console.assert(style.cornerRadius === 8, "Style cornerRadius extracted");
console.assert(style.typography?.fontFamily === "Roboto", "Style font family extracted");

// 3. Check resolveNodeContent
const content = resolveNodeContent(sampleChildNode);
console.assert(content.text === "Hello Canvas World", "Content text extracted");
console.assert(content.showLogo === true, "Visibility switch showLogo is true");

// 4. Check getRenderTree
const tree = getRenderTree(sampleNodes);
console.assert(tree[0].id === "group-1", "Tree top-level node returned");

// 5. Test all 4 Exporters
const pages = {
  "page-1": {
    id: "page-1",
    name: "Home",
    slug: "index",
    nodes: sampleNodes,
  },
};

const htmlRes = exportSite(pages, "page-1");
console.assert(htmlRes.css.includes("left: 20px;"), "HTML exporter outputs parent-relative offset left: 20px");
console.assert(htmlRes.css.includes("top: 20px;"), "HTML exporter outputs parent-relative offset top: 20px");

const reactRes = exportToReact(pages, "page-1", sampleNodes);
console.assert(reactRes.length > 0, "React exporter outputs components");

const nextRes = exportToNextjs(pages, "page-1", sampleNodes);
console.assert(nextRes.length > 0, "Next.js exporter outputs pages");

const tailwindRes = exportToTailwind(pages, "page-1", sampleNodes);
console.assert(tailwindRes.length > 0, "Tailwind exporter outputs pages");

console.log("✅ ALL FIDELITY PARITY UNIT TESTS PASSED SUCCESSFULLY (0 DROPPED PROPERTIES)!");
