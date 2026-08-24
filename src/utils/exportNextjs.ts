// Export to Next.js Pages — 4.1
import type { NodesById, CanvasNode, PagesById, PageSEO } from "../types/canvas";
import { useInteractionStore } from "../store/interactionStore";
import { resolveNodeBox, resolveNodeStyle, getRenderTree } from "./nodeResolver";

function safeComponentName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "").replace(/^[0-9]/, "C$&") || "Page";
}

function getNodeWithInteractions(node: CanvasNode): CanvasNode {
  const storeInteractions = useInteractionStore.getState().interactions[node.id];
  if (storeInteractions) {
    return { ...node, interactions: { ...node.interactions, ...storeInteractions } };
  }
  return node;
}

function styleToCSS(node: CanvasNode, nodes: NodesById): string {
  const box = resolveNodeBox(node, nodes);
  const s = resolveNodeStyle(node);
  const rules: string[] = [];

  rules.push(`  position: absolute;`);
  rules.push(`  left: ${Math.round(box.relativeX)}px;`);
  rules.push(`  top: ${Math.round(box.relativeY)}px;`);
  rules.push(`  width: ${Math.round(box.width)}px;`);
  rules.push(`  height: ${Math.round(box.height)}px;`);

  if (box.rotation) rules.push(`  transform: rotate(${box.rotation}deg);`);

  if (!s.isVectorShape) {
    if (s.gradient) {
      rules.push(`  background: linear-gradient(${s.gradient.angle ?? 135}deg, ${s.gradient.startColor}, ${s.gradient.endColor});`);
    } else if (s.fill && s.fill !== "transparent") {
      rules.push(`  background-color: ${s.fill};`);
    }
    if (s.cornerRadius) rules.push(`  border-radius: ${s.cornerRadius}px;`);
    if (s.border && s.border.width > 0) {
      rules.push(`  border: ${s.border.width}px ${s.border.style} ${s.border.color};`);
    }
  }

  if (s.opacity !== undefined && s.opacity !== 1) rules.push(`  opacity: ${s.opacity};`);
  if (s.blur) rules.push(`  filter: blur(${s.blur}px);`);
  if (s.backgroundBlur) rules.push(`  backdrop-filter: blur(${s.backgroundBlur}px);`);
  if (s.shadow) rules.push(`  box-shadow: ${s.shadow.x}px ${s.shadow.y}px ${s.shadow.blur}px ${s.shadow.color};`);

  if (s.typography) {
    const t = s.typography;
    if (t.fontFamily) rules.push(`  font-family: ${t.fontFamily};`);
    if (t.fontSize) rules.push(`  font-size: ${t.fontSize}px;`);
    if (t.fontWeight) rules.push(`  font-weight: ${t.fontWeight};`);
    if (t.color) rules.push(`  color: ${t.color};`);
    if (t.align) rules.push(`  text-align: ${t.align};`);
    if (t.lineHeight) rules.push(`  line-height: ${t.lineHeight};`);
  }

  return rules.join("\n");
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

function renderNodeJSX(nodeRaw: CanvasNode, nodes: NodesById, indent: string = "        "): string {
  const node = getNodeWithInteractions(nodeRaw);
  const className = `node_${safeId(node.id).slice(0, 8)}`;
  let elementJSX = "";

  switch (node.type) {
    case "text": {
      const text = node.content?.kind === "text" ? node.content.text : "Text";
      elementJSX = `${indent}<div className={styles.${className}}>\n${indent}  <p>${text}</p>\n${indent}</div>`;
      break;
    }
    case "image": {
      const src = node.content?.kind === "image" ? node.content.assetUrl : "/placeholder.png";
      elementJSX = `${indent}<div className={styles.${className}}>\n${indent}  <img src="${src}" alt="${node.name}" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />\n${indent}</div>`;
      break;
    }
    case "group": {
      const children = (node.children || [])
        .map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => !!n)
        .sort((a, b) => a.order - b.order)
        .map((c) => renderNodeJSX(c, nodes, indent + "  "))
        .join("\n");
      elementJSX = `${indent}<div className={styles.${className}}>\n${children}\n${indent}</div>`;
      break;
    }
    default:
      elementJSX = `${indent}<div className={styles.${className}} />`;
      break;
  }

  const click = node.interactions?.click;
  if (click && click.type && click.type !== "none") {
    if (click.type === "navigateTo" && click.target) {
      return `${indent}<Link href="/${click.target}" style={{ display: 'block', textDecoration: 'none' }}>\n${elementJSX}\n${indent}</Link>`;
    }
    if (click.type === "openUrl" && click.target) {
      const targetAttr = click.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `${indent}<a href="${click.target}"${targetAttr} style={{ display: 'block', textDecoration: 'none' }}>\n${elementJSX}\n${indent}</a>`;
    }
  }

  return elementJSX;
}

export interface ExportedNextFile {
  filename: string;
  content: string;
}

/** Export all pages as Next.js App Router pages */
export function exportToNextjs(
  pages: PagesById,
  activePageId: string,
  currentNodes: NodesById,
  seoData?: Record<string, PageSEO>
): ExportedNextFile[] {
  const safePages = Object.keys(pages).length > 0 ? pages : { "page-1": { id: "page-1", name: "Home", slug: "index", nodes: currentNodes } };
  const activePage = safePages[activePageId] ?? Object.values(safePages)[0];
  if (!activePage) return [];

  const allPages = {
    ...safePages,
    [activePage.id]: { ...activePage, nodes: currentNodes },
  };

  const files: ExportedNextFile[] = [];

  // Generate layout.tsx
  files.push({
    filename: "app/layout.tsx",
    content: `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CanvasSite Export',
  description: 'Generated by CanvasSite',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  });

  // Generate globals.css
  const globalCSS: string[] = [
    `* { box-sizing: border-box; margin: 0; padding: 0; }`,
    `body { font-family: 'Inter', sans-serif; background: #0f0f1a; color: #e4e4f0; }`,
  ];
  files.push({
    filename: "app/globals.css",
    content: globalCSS.join("\n"),
  });

  // Generate page files
  Object.values(allPages).forEach((page) => {
    const componentName = safeComponentName(page.name);
    const isIndex = page.slug === "index";
    const folder = isIndex ? "app" : `app/${page.slug}`;

    const topLevel = getRenderTree(page.nodes);

    // Generate CSS Module
    const cssRules = Object.values(page.nodes).map((node) => {
      const className = `node_${safeId(node.id).slice(0, 8)}`;
      return `.${className} {\n${styleToCSS(node, page.nodes)}\n}`;
    });

    files.push({
      filename: `${folder}/${componentName}.module.css`,
      content: `.container {\n  position: relative;\n  width: 100%;\n  min-height: 100vh;\n}\n\n${cssRules.join("\n\n")}`,
    });

    // Generate page.tsx
    const seo = seoData?.[page.id];
    const metadataExport = seo
      ? `
export const metadata = {
  title: '${seo.title || page.name}',
  description: '${seo.description || ""}',
  openGraph: {
    title: '${seo.ogTitle || seo.title || page.name}',
    description: '${seo.ogDescription || seo.description || ""}',
    ${seo.ogImage ? `images: ['${seo.ogImage}'],` : ""}
  },
};
`
      : `
export const metadata = {
  title: '${page.name}',
};
`;

    const jsx = topLevel.map((n) => renderNodeJSX(n, page.nodes)).join("\n");

    files.push({
      filename: `${folder}/page.tsx`,
      content: `import Link from 'next/link';
import styles from './${componentName}.module.css';
${metadataExport}
export default function ${componentName}Page() {
  return (
    <main className={styles.container}>
${jsx}
    </main>
  );
}
`,
    });
  });

  // Generate package.json
  files.push({
    filename: "package.json",
    content: JSON.stringify({
      name: "canvassite-nextjs",
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        next: "^14.0.0",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
    }, null, 2),
  });

  // Generate next.config.js
  files.push({
    filename: "next.config.js",
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
`,
  });

  return files;
}
