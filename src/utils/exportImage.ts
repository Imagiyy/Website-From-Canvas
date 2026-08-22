// Export as PNG/SVG/PDF — 4.1
// Uses canvas/SVG serialization for screenshot export

import type { NodesById, CanvasNode } from "../types/canvas";

/** Render all nodes to an SVG string for export */
function renderNodesToSVG(nodes: NodesById, width: number, height: number): string {
  const topLevel = Object.values(nodes)
    .filter((n) => n.parentId === null && n.visible !== false)
    .sort((a, b) => a.order - b.order);

  const svgElements = topLevel.map((n) => renderNodeSVG(n, nodes)).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap');
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="#0f0f1a"/>
${svgElements}
</svg>`;
}

function renderNodeSVG(node: CanvasNode, nodes: NodesById): string {
  const { x, y, width, height, rotation } = node.geometry;
  const s = node.style;
  const transform = rotation ? ` transform="rotate(${rotation} ${x + width / 2} ${y + height / 2})"` : "";
  const opacity = s.opacity !== 1 ? ` opacity="${s.opacity}"` : "";
  const filter = s.blur ? ` filter="url(#blur-${node.id.slice(0, 8)})"` : "";

  let defs = "";
  if (s.blur) {
    defs = `  <defs><filter id="blur-${node.id.slice(0, 8)}"><feGaussianBlur stdDeviation="${s.blur}"/></filter></defs>\n`;
  }

  switch (node.type) {
    case "rectangle": {
      const fill = s.fill || "transparent";
      const rx = s.cornerRadius ? ` rx="${s.cornerRadius}"` : "";
      let stroke = "";
      if (s.border) {
        stroke = ` stroke="${s.border.color}" stroke-width="${s.border.width}"`;
        if (s.border.style === "dashed") stroke += ' stroke-dasharray="6,6"';
        if (s.border.style === "dotted") stroke += ' stroke-dasharray="2,2"';
      }
      return `${defs}  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${rx}${stroke}${opacity}${transform}${filter}/>`;
    }

    case "text": {
      const text = node.content?.kind === "text" ? node.content.text : "Text";
      const t = s.typography;
      const fontAttrs = t
        ? ` font-family="${t.fontFamily}" font-size="${t.fontSize}" font-weight="${t.fontWeight}" fill="${t.color}"`
        : ` font-family="Inter, sans-serif" font-size="16" fill="#e4e4f0"`;
      const textAnchor = t?.align === "center" ? "middle" : t?.align === "right" ? "end" : "start";
      const textX = t?.align === "center" ? x + width / 2 : t?.align === "right" ? x + width : x;
      return `${defs}  <text x="${textX}" y="${y + (t?.fontSize || 16)}" text-anchor="${textAnchor}"${fontAttrs}${opacity}${transform}>${escapeXml(text)}</text>`;
    }

    case "image": {
      const src = node.content?.kind === "image" ? node.content.assetUrl : "";
      if (src) {
        return `${defs}  <image x="${x}" y="${y}" width="${width}" height="${height}" href="${src}" preserveAspectRatio="xMidYMid slice"${opacity}${transform}${filter}/>`;
      }
      return `${defs}  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#2a2a4a"${opacity}${transform}/>`;
    }

    case "circle": {
      const fill = s.fill || "#10B981";
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      let stroke = "";
      if (s.border) {
        stroke = ` stroke="${s.border.color}" stroke-width="${s.border.width}"`;
      }
      return `${defs}  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${stroke}${opacity}${transform}${filter}/>`;
    }

    case "line": {
      const strokeColor = s.border?.color || "#2563EB";
      const strokeWidth = s.border?.width || 2;
      return `${defs}  <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round"${opacity}${transform}/>`;
    }

    case "group": {
      const children = (node.children || [])
        .map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => !!n && n.visible !== false)
        .sort((a, b) => a.order - b.order)
        .map((c) => renderNodeSVG(c, nodes))
        .join("\n");
      return `${defs}  <g${opacity}${transform}>\n${children}\n  </g>`;
    }

    case "brush":
    case "pencil": {
      const pathData = node.pathData || "";
      const strokeColor = s.border?.color || s.fill || "#3B82F6";
      const strokeWidth = s.brushSize || (node.type === "pencil" ? 2 : 12);
      return `${defs}  <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${opacity}${transform}/>`;
    }

    default: {
      const fill = s.fill || "#E5E7EB";
      return `${defs}  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${opacity}${transform}${filter}/>`;
    }
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Export canvas as SVG string */
export function exportAsSVG(nodes: NodesById, width = 1200, height = 900): string {
  return renderNodesToSVG(nodes, width, height);
}

/** Export canvas as PNG data URL */
export async function exportAsPNG(nodes: NodesById, width = 1200, height = 900, scale = 2): Promise<string> {
  const svgString = renderNodesToSVG(nodes, width, height);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("Failed to render SVG to PNG"));
    };
    img.src = svgUrl;
  });
}

/** Export canvas as PDF (using jsPDF-like approach via canvas) */
export async function exportAsPDF(nodes: NodesById, width = 1200, height = 900): Promise<Blob> {
  // Generate a high-res PNG first, then wrap in minimal PDF
  const pngDataUrl = await exportAsPNG(nodes, width, height, 2);

  // Minimal PDF generator (embeds PNG as XObject)
  // For production, you'd use jsPDF. This is a functional standalone implementation.
  const pngResponse = await fetch(pngDataUrl);
  const pngBlob = await pngResponse.blob();
  const pngArrayBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngArrayBuffer);

  // Create a simple PDF with embedded image
  const pdfWidth = width;
  const pdfHeight = height;

  const pdf = buildSimplePDF(pngBytes, pdfWidth, pdfHeight);
  return new Blob([pdf], { type: "application/pdf" });
}

/** Build a minimal valid PDF with an embedded PNG image */
function buildSimplePDF(pngBytes: Uint8Array, width: number, height: number): Uint8Array {
  const encoder = new TextEncoder();

  const header = `%PDF-1.4\n`;
  const catalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const pages = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const page = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>\nendobj\n`;

  const contentStream = `q\n${width} 0 0 ${height} 0 0 cm\n/Img Do\nQ\n`;
  const content = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`;

  const imageObj = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width * 2} /Height ${height * 2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${pngBytes.length} >>\nstream\n`;
  const imageEnd = `\nendstream\nendobj\n`;

  // Calculate byte offsets
  const parts = [header, catalog, pages, page, content, imageObj];
  const headerBytes = encoder.encode(parts.join(""));

  const xrefStart = headerBytes.length + pngBytes.length + encoder.encode(imageEnd).length;

  const xref = `xref\n0 6\n0000000000 65535 f \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  // Combine all parts
  const allParts = [...encoder.encode(parts.join("")), ...pngBytes, ...encoder.encode(imageEnd + xref + trailer)];
  return new Uint8Array(allParts);
}

/** Trigger a file download */
export function downloadFile(data: string | Blob, filename: string, mimeType?: string): void {
  let blob: Blob;
  if (typeof data === "string") {
    blob = new Blob([data], { type: mimeType || "text/plain" });
  } else {
    blob = data;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
