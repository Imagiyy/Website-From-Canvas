import JSZip from "jszip";
import { downloadFile } from "./exportImage";

export interface ZipFileItem {
  filename: string;
  content: string;
}

/**
 * Compiles a list of export files into a downloadable .zip package
 */
export async function downloadSiteZip(files: ZipFileItem[], packageName: string = "canvas-website"): Promise<void> {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.filename, file.content);
  });

  // Generate README.md explaining the export
  const readmeContent = `# ${packageName} Export

Generated with CanvasSite Website Builder.

## File Structure

${files.map((f) => `- \`${f.filename}\``).join("\n")}

## Deployment

1. For HTML/CSS: Open \`index.html\` in any browser or upload all files to Vercel, Netlify, GitHub Pages, or any web host.
2. For React / Next.js: Copy the component files into your project source folder.
`;

  zip.file("README.md", readmeContent);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${packageName}.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
