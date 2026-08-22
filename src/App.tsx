import React, { useState } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import LayerPanel from "./components/LayerPanel";
import PropertyPanel from "./components/PropertyPanel";
import ExportModal from "./components/ExportModal";
import StatusBar from "./components/StatusBar";
import ContextMenu from "./components/ContextMenu";
import "./App.css";

export interface ContextMenuState {
  x: number;
  y: number;
  targetNodeId?: string | null;
}

function App() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  return (
    <div className="app">
      <Toolbar onExportClick={() => setIsExportOpen(true)} />
      <div className="app__body">
        <LayerPanel onContextMenu={(e, nodeId) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY, targetNodeId: nodeId });
        }} />
        <div className="app__canvas-container">
          <Canvas onContextMenu={(e, nodeId) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, targetNodeId: nodeId });
          }} />
        </div>
        <PropertyPanel />
      </div>
      <StatusBar />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetNodeId={contextMenu.targetNodeId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export default App;
