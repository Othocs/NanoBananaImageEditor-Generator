import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Home } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { CANVAS_SIZE } from '../../constants/canvas';

const ZoomControls: React.FC = () => {
  const { zoom, setZoom, resetView, setPanOffset } = useWorkbenchStore();

  const handleZoomIn = () => {
    // Increment by 10%
    const newZoom = Math.min(zoom + 0.1, 5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    // Decrement by 10%
    const newZoom = Math.max(zoom - 0.1, 0.1);
    setZoom(newZoom);
  };

  const formatZoomPercentage = () => {
    return `${Math.round(zoom * 100)}%`;
  };

  const handleRecenter = () => {
    // Get viewport dimensions
    const viewport = document.querySelector('.viewport');
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      // Center the canvas in the viewport
      const centerOffset = {
        x: rect.width / 2 - (CANVAS_SIZE * zoom) / 2,
        y: rect.height / 2 - (CANVAS_SIZE * zoom) / 2
      };
      setPanOffset(centerOffset);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-40 flex items-center gap-1 bg-workbench-sidebar backdrop-blur-sm rounded-lg shadow-lg border border-workbench-border p-1">
      <button
        className="p-2 rounded-md hover:bg-workbench-hover text-workbench-text transition-colors"
        onClick={handleZoomOut}
        title="Zoom out (Ctrl/Cmd + -)"
      >
        <ZoomOut size={18} />
      </button>
      <button
        className="px-3 py-1 min-w-[60px] text-sm text-workbench-text hover:bg-workbench-hover rounded-md transition-colors"
        onClick={resetView}
        title="Reset zoom (Ctrl/Cmd + 0)"
      >
        {formatZoomPercentage()}
      </button>
      <button
        className="p-2 rounded-md hover:bg-workbench-hover text-workbench-text transition-colors"
        onClick={handleZoomIn}
        title="Zoom in (Ctrl/Cmd + +)"
      >
        <ZoomIn size={18} />
      </button>
      <button
        className="p-2 rounded-md hover:bg-workbench-hover text-workbench-text transition-colors ml-1"
        onClick={resetView}
        title="Fit to screen"
      >
        <Maximize2 size={18} />
      </button>
      <button
        className="p-2 rounded-md hover:bg-workbench-hover text-workbench-text transition-colors"
        onClick={handleRecenter}
        title="Recenter view"
      >
        <Home size={18} />
      </button>
    </div>
  );
};

export default ZoomControls;