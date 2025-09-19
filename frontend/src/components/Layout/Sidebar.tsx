import React from 'react';
import { 
  MousePointer2, 
  Plus, 
  Star, 
  Square,
  HelpCircle
} from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import type { Tool } from '../../types';

interface ToolItem {
  id: Tool;
  icon: React.ReactNode;
  tooltip: string;
}

const Sidebar: React.FC = () => {
  const { activeTool, setActiveTool } = useWorkbenchStore();
  
  const tools: ToolItem[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, tooltip: 'Select' },
    { id: 'add', icon: <Plus size={20} />, tooltip: 'Add Image' },
    { id: 'generate', icon: <Star size={20} />, tooltip: 'Generate' },
    { id: 'selectArea', icon: <Square size={20} />, tooltip: 'Select Area' },
  ];

  const handleAddImageClick = () => {
    if (activeTool === 'add') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          const addImage = useWorkbenchStore.getState().addImage;
          Array.from(files).forEach(file => addImage(file));
        }
      };
      input.click();
    }
    setActiveTool('add');
  };

  const handleToolClick = (tool: Tool) => {
    if (tool === 'add') {
      handleAddImageClick();
    } else if (tool === 'generate') {
      const selectedCount = useWorkbenchStore.getState().selectedImageIds.length;
      if (selectedCount > 0) {
        useWorkbenchStore.getState().setShowGenerateModal(true);
      } else {
        alert('Please select at least one image to use as context for generation');
      }
      setActiveTool(tool);
    } else {
      setActiveTool(tool);
    }
  };

  return (
    <aside className="w-14 bg-workbench-sidebar border-r border-workbench-border flex flex-col items-center py-4">
      <div className="flex flex-col gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`tool-button relative group ${activeTool === tool.id ? 'active' : ''}`}
            title={tool.tooltip}
          >
            {tool.icon}
            <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-workbench-hover text-workbench-text px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ml-2">
              {tool.tooltip}
            </span>
          </button>
        ))}
      </div>
      
      <div className="mt-auto flex flex-col gap-2">
        <button className="tool-button">
          <HelpCircle size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;