import React from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import LayerPanel from "./components/LayerPanel";
import PropertyPanel from "./components/PropertyPanel";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="app__body">
        <LayerPanel />
        <div className="app__canvas-container">
          <Canvas />
        </div>
        <PropertyPanel />
      </div>
    </div>
  );
}

export default App;
