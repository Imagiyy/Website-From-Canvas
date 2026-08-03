import React, { useState } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import LayerPanel from "./components/LayerPanel";
import PropertyPanel from "./components/PropertyPanel";
import ExportModal from "./components/ExportModal";
import StatusBar from "./components/StatusBar";
import "./App.css";

function App() {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="app">
      <Toolbar onExportClick={() => setIsExportOpen(true)} />
      <div className="app__body">
        <LayerPanel />
        <div className="app__canvas-container">
          <Canvas />
        </div>
        <PropertyPanel />
      </div>
      <StatusBar />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

export default App;
