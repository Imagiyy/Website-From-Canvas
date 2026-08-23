import type { NodesById, CanvasNode, PagesById } from "../types/canvas";
import { useInteractionStore } from "../store/interactionStore";

function safeComponentName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "").replace(/^[0-9]/, "C$&") || "Component";
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function getNodeWithInteractions(node: CanvasNode): CanvasNode {
  const storeInteractions = useInteractionStore.getState().interactions[node.id];
  if (storeInteractions) {
    return { ...node, interactions: { ...node.interactions, ...storeInteractions } };
  }
  return node;
}

function styleToCSSObject(node: CanvasNode, nodes?: NodesById): string {
  const rules: string[] = [];
  let g = node.geometry;
  if (node.parentId && nodes && nodes[node.parentId]) {
    const parentGeom = nodes[node.parentId].geometry;
    g = { ...g, x: g.x - parentGeom.x, y: g.y - parentGeom.y };
  }
  const s = node.style;

  rules.push(`position: 'absolute'`);
  rules.push(`left: ${Math.round(g.x)}`);
  rules.push(`top: ${Math.round(g.y)}`);
  rules.push(`width: ${Math.round(g.width)}`);
  rules.push(`height: ${Math.round(g.height)}`);

  if (g.rotation) rules.push(`transform: 'rotate(${g.rotation}deg)'`);
  
  const isBoxElement = node.type === "rectangle" || node.type === "text" || node.type === "image" || node.type === "product";
  if (isBoxElement) {
    if (s.fill && s.fill !== "transparent") rules.push(`backgroundColor: '${s.fill}'`);
    if (s.cornerRadius) rules.push(`borderRadius: ${s.cornerRadius}`);
    if (s.border && s.border.width > 0) {
      rules.push(`border: '${s.border.width}px ${s.border.style} ${s.border.color}'`);
    }
  }

  if (s.opacity !== undefined && s.opacity !== 1) rules.push(`opacity: ${s.opacity}`);
  if (s.blur) rules.push(`filter: 'blur(${s.blur}px)'`);
  if (s.backgroundBlur) rules.push(`backdropFilter: 'blur(${s.backgroundBlur}px)'`);
  if (s.shadow) {
    rules.push(`boxShadow: '${s.shadow.x}px ${s.shadow.y}px ${s.shadow.blur}px ${s.shadow.color}'`);
  }
  if (s.typography) {
    if (s.typography.fontFamily) rules.push(`fontFamily: '${s.typography.fontFamily}'`);
    if (s.typography.fontSize) rules.push(`fontSize: ${s.typography.fontSize}`);
    if (s.typography.fontWeight) rules.push(`fontWeight: ${s.typography.fontWeight}`);
    if (s.typography.color) rules.push(`color: '${s.typography.color}'`);
    if (s.typography.align) rules.push(`textAlign: '${s.typography.align}'`);
    if (s.typography.lineHeight) rules.push(`lineHeight: ${s.typography.lineHeight}`);
  }

  return `{ ${rules.join(", ")} }`;
}

function renderNodeJSX(nodeRaw: CanvasNode, nodes: NodesById, level: number): string {
  const node = getNodeWithInteractions(nodeRaw);
  const i = indent(level);
  const styleProp = `style={${styleToCSSObject(node, nodes)}}`;

  let clickProp = "";
  const click = node.interactions?.click;
  if (click && click.type && click.type !== "none") {
    if (click.type === "openUrl" && click.target) {
      clickProp = ` onClick={() => window.open('${click.target}', '${click.openInNewTab ? "_blank" : "_self"}')}`;
    } else if (click.type === "navigateTo" && click.target) {
      clickProp = ` onClick={() => onNavigate ? onNavigate('${click.target}') : window.location.href = '${click.target}.html'}`;
    } else if (click.type === "scrollTo" && click.target) {
      clickProp = ` onClick={() => document.getElementById('${click.target}')?.scrollIntoView({ behavior: 'smooth' })}`;
    }
  }

  switch (node.type) {
    case "rectangle":
      return `${i}<div id="${node.id}" ${styleProp}${clickProp} />`;

    case "text": {
      const text = node.content?.kind === "text" ? node.content.text : "Text";
      return `${i}<div id="${node.id}" ${styleProp}${clickProp}>\n${i}  <p>${text}</p>\n${i}</div>`;
    }

    case "image": {
      const src = node.content?.kind === "image" ? node.content.assetUrl : "";
      const fit = node.content?.kind === "image" ? node.content.fit : "cover";
      return `${i}<div id="${node.id}" ${styleProp}${clickProp}>\n${i}  <img src="${src}" alt="${node.name}" style={{ objectFit: '${fit}', width: '100%', height: '100%' }} />\n${i}</div>`;
    }

    case "group": {
      const children = (node.children || [])
        .map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => !!n)
        .sort((a, b) => a.order - b.order)
        .map((c) => renderNodeJSX(c, nodes, level + 1))
        .join("\n");
      return `${i}<div id="${node.id}" ${styleProp}${clickProp}>\n${children}\n${i}</div>`;
    }

    default:
      return `${i}<div id="${node.id}" ${styleProp}${clickProp} />`;
  }
}

/** Generate a React functional component for a page */
function generatePageComponent(pageName: string, nodes: NodesById): string {
  const componentName = safeComponentName(pageName);
  const topLevel = Object.values(nodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => a.order - b.order);

  const jsx = topLevel.map((n) => renderNodeJSX(n, nodes, 3)).join("\n");

  return `import React from 'react';

const ${componentName}: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#0f0f1a' }}>
${jsx}
    </div>
  );
};

export default ${componentName};
`;
}

export interface ExportedReactFile {
  filename: string;
  content: string;
}

/** Export all pages as React components */
export function exportToReact(pages: PagesById, activePageId: string, currentNodes: NodesById): ExportedReactFile[] {
  const safePages = Object.keys(pages).length > 0 ? pages : { "page-1": { id: "page-1", name: "Home", slug: "index", nodes: currentNodes } };
  const activePage = safePages[activePageId] ?? Object.values(safePages)[0];
  if (!activePage) return [];

  const allPages = {
    ...safePages,
    [activePage.id]: { ...activePage, nodes: currentNodes },
  };

  const files: ExportedReactFile[] = [];

  // Generate page components
  Object.values(allPages).forEach((page) => {
    const componentName = safeComponentName(page.name);
    files.push({
      filename: `components/${componentName}.tsx`,
      content: generatePageComponent(page.name, page.nodes),
    });
  });

  // Generate App.tsx with routing
  const imports = Object.values(allPages)
    .map((p) => {
      const name = safeComponentName(p.name);
      return `import ${name} from './components/${name}';`;
    })
    .join("\n");

  const routes = Object.values(allPages)
    .map((p) => {
      const name = safeComponentName(p.name);
      const path = p.slug === "index" ? "/" : `/${p.slug}`;
      return `        <Route path="${path}" element={<${name} />} />`;
    })
    .join("\n");

  files.push({
    filename: "App.tsx",
    content: `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
${imports}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
${routes}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
`,
  });

  // Generate package.json
  files.push({
    filename: "package.json",
    content: JSON.stringify({
      name: "canvassite-export",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.20.0",
      },
      scripts: {
        start: "react-scripts start",
        build: "react-scripts build",
      },
    }, null, 2),
  });

  return files;
}
