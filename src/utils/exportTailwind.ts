// Export to Tailwind CSS HTML — 4.1
import type { NodesById, CanvasNode, PagesById } from "../types/canvas";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Map numeric px value to nearest Tailwind spacing class */
function pxToTw(px: number): string {
  const map: Record<number, string> = {
    0: "0", 1: "px", 2: "0.5", 4: "1", 8: "2", 12: "3", 16: "4",
    20: "5", 24: "6", 32: "8", 40: "10", 48: "12", 56: "14",
    64: "16", 80: "20", 96: "24", 112: "28", 128: "32",
    144: "36", 160: "40", 192: "48", 224: "56", 256: "64",
    288: "72", 320: "80", 384: "96",
  };

  const closest = Object.entries(map).reduce((best, [key, val]) => {
    const diff = Math.abs(Number(key) - px);
    return diff < best.diff ? { diff, val } : best;
  }, { diff: Infinity, val: `[${px}px]` });

  return closest.val;
}

/** Map hex color to closest Tailwind color or use arbitrary value */
function colorToTw(hex: string, prefix: string): string {
  const colors: Record<string, string> = {
    "#000000": `${prefix}-black`,
    "#ffffff": `${prefix}-white`,
    "#ef4444": `${prefix}-red-500`,
    "#f97316": `${prefix}-orange-500`,
    "#f59e0b": `${prefix}-amber-500`,
    "#eab308": `${prefix}-yellow-500`,
    "#22c55e": `${prefix}-green-500`,
    "#10b981": `${prefix}-emerald-500`,
    "#3b82f6": `${prefix}-blue-500`,
    "#6366f1": `${prefix}-indigo-500`,
    "#8b5cf6": `${prefix}-violet-500`,
    "#ec4899": `${prefix}-pink-500`,
    "#6b7280": `${prefix}-gray-500`,
    "#1e293b": `${prefix}-slate-800`,
    "#0f172a": `${prefix}-slate-900`,
    "#transparent": "",
  };

  const lower = hex.toLowerCase();
  return colors[lower] || `${prefix}-[${hex}]`;
}

/** Map font size px to Tailwind text class */
function fontSizeToTw(px: number): string {
  const map: Record<number, string> = {
    12: "text-xs", 14: "text-sm", 16: "text-base", 18: "text-lg",
    20: "text-xl", 24: "text-2xl", 30: "text-3xl", 36: "text-4xl",
    48: "text-5xl", 60: "text-6xl", 72: "text-7xl", 96: "text-8xl",
  };
  return map[px] || `text-[${px}px]`;
}

/** Generate Tailwind classes for a node */
function nodeToTailwindClasses(node: CanvasNode): string {
  const classes: string[] = ["absolute"];
  const g = node.geometry;
  const s = node.style;

  classes.push(`left-[${Math.round(g.x)}px]`);
  classes.push(`top-[${Math.round(g.y)}px]`);
  classes.push(`w-[${Math.round(g.width)}px]`);
  classes.push(`h-[${Math.round(g.height)}px]`);

  if (g.rotation) classes.push(`rotate-[${g.rotation}deg]`);

  if (s.fill && s.fill !== "transparent") {
    classes.push(colorToTw(s.fill, "bg"));
  }

  if (s.opacity !== undefined && s.opacity !== 1) {
    classes.push(`opacity-${Math.round(s.opacity * 100)}`);
  }

  if (s.cornerRadius) {
    const r = s.cornerRadius;
    if (r >= 9999) classes.push("rounded-full");
    else if (r >= 12) classes.push("rounded-xl");
    else if (r >= 8) classes.push("rounded-lg");
    else if (r >= 6) classes.push("rounded-md");
    else if (r >= 4) classes.push("rounded");
    else classes.push(`rounded-[${r}px]`);
  }

  if (s.border) {
    classes.push(`border-${s.border.width}`);
    classes.push(colorToTw(s.border.color, "border"));
    if (s.border.style === "dashed") classes.push("border-dashed");
    if (s.border.style === "dotted") classes.push("border-dotted");
  }

  if (s.blur) classes.push(`blur-[${s.blur}px]`);
  if (s.backgroundBlur) classes.push(`backdrop-blur-[${s.backgroundBlur}px]`);

  if (s.shadow) {
    classes.push(`shadow-[${s.shadow.x}px_${s.shadow.y}px_${s.shadow.blur}px_${s.shadow.color}]`);
  }

  if (s.typography) {
    const t = s.typography;
    classes.push(fontSizeToTw(t.fontSize));
    if (t.fontWeight >= 700) classes.push("font-bold");
    else if (t.fontWeight >= 600) classes.push("font-semibold");
    else if (t.fontWeight >= 500) classes.push("font-medium");
    if (t.color) classes.push(colorToTw(t.color, "text"));
    if (t.align === "center") classes.push("text-center");
    if (t.align === "right") classes.push("text-right");
    if (t.textTransform === "uppercase") classes.push("uppercase");
    if (t.textTransform === "lowercase") classes.push("lowercase");
    if (t.textTransform === "capitalize") classes.push("capitalize");
    if (t.textDecoration === "underline") classes.push("underline");
    if (t.textDecoration === "line-through") classes.push("line-through");
  }

  return classes.join(" ");
}

function renderNodeHTML(node: CanvasNode, nodes: NodesById, indent: string = "    "): string {
  const classes = nodeToTailwindClasses(node);

  switch (node.type) {
    case "rectangle":
      return `${indent}<div class="${classes}"></div>`;

    case "text": {
      const text = node.content?.kind === "text" ? node.content.text : "Text";
      return `${indent}<div class="${classes}">\n${indent}  <p>${escapeHtml(text)}</p>\n${indent}</div>`;
    }

    case "image": {
      const src = node.content?.kind === "image" ? node.content.assetUrl : "";
      const fit = node.content?.kind === "image" ? node.content.fit : "cover";
      const fitClass = fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : "object-cover";
      return `${indent}<img class="${classes} ${fitClass}" src="${src}" alt="${escapeHtml(node.name)}" />`;
    }

    case "group": {
      const children = (node.children || [])
        .map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => !!n)
        .sort((a, b) => a.order - b.order)
        .map((c) => renderNodeHTML(c, nodes, indent + "  "))
        .join("\n");
      return `${indent}<div class="${classes}">\n${children}\n${indent}</div>`;
    }

    default:
      return `${indent}<div class="${classes}"></div>`;
  }
}

export interface ExportedTailwindFile {
  filename: string;
  content: string;
}

/** Export pages as static HTML with Tailwind CSS CDN */
export function exportToTailwind(pages: PagesById, activePageId: string, currentNodes: NodesById): ExportedTailwindFile[] {
  const allPages = {
    ...pages,
    [activePageId]: { ...pages[activePageId], nodes: currentNodes },
  };

  const files: ExportedTailwindFile[] = [];

  Object.values(allPages).forEach((page) => {
    const topLevel = Object.values(page.nodes)
      .filter((n) => n.parentId === null)
      .sort((a, b) => a.order - b.order);

    const bodyHTML = topLevel.map((n) => renderNodeHTML(n, page.nodes)).join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.name)} — CanvasSite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
        },
      },
    }
  </script>
</head>
<body class="bg-[#0f0f1a] text-[#e4e4f0] font-sans min-h-screen">
  <div class="relative w-full min-h-screen overflow-x-hidden">
${bodyHTML}
  </div>
</body>
</html>`;

    files.push({
      filename: `${page.slug || "page"}.html`,
      content: html,
    });
  });

  return files;
}
