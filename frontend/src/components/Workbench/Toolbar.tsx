import React from 'react';
import { MousePointer, Hand, GitBranch } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';

const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool, showFlowConnections, toggleFlowConnections } = useWorkbenchStore();

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1 bg-workbench-sidebar backdrop-blur-sm rounded-lg shadow-lg border border-workbench-border p-1">
      <button
        className={`p-2 rounded-md transition-colors ${
          activeTool === 'select'
            ? 'bg-workbench-selected text-white'
            : 'hover:bg-workbench-hover text-workbench-text'
        }`}
        onClick={() => setActiveTool('select')}
        title="Select tool (V)"
      >
        <MousePointer size={18} />
      </button>
      <button
        className={`p-2 rounded-md transition-colors ${
          activeTool === 'hand'
            ? 'bg-workbench-selected text-white'
            : 'hover:bg-workbench-hover text-workbench-text'
        }`}
        onClick={() => setActiveTool('hand')}
        title="Hand tool (H or hold Space)"
      >
        <Hand size={18} />
      </button>
      <div className="w-px h-6 bg-workbench-border mx-1" />
      <button
        className={`p-2 rounded-md transition-colors ${
          showFlowConnections
            ? 'bg-workbench-selected text-white'
            : 'hover:bg-workbench-hover text-workbench-text'
        }`}
        onClick={toggleFlowConnections}
        title="Toggle flow connections"
      >
        <GitBranch size={18} />
      </button>
    </div>
  );
};

export default Toolbar;