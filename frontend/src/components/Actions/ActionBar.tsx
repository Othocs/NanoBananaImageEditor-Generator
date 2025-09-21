import React from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Video, 
  Workflow,
  MoreHorizontal
} from 'lucide-react';

const ActionBar: React.FC = () => {
  const actions = [
    { icon: <MessageSquare size={18} />, label: 'Describe an Image' },
    { icon: <Sparkles size={18} />, label: 'Combine ideas' },
    { icon: <Video size={18} />, label: 'Make a video from an image' },
    { icon: <Workflow size={18} />, label: 'Explore Flows' },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-workbench-sidebar/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-workbench-border">
      {actions.map((action, index) => (
        <button
          key={index}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-workbench-text-secondary hover:text-workbench-text hover:bg-workbench-hover rounded-md transition-all"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
      <button className="p-1.5 text-workbench-text-secondary hover:text-workbench-text hover:bg-workbench-hover rounded-md transition-all">
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
};

export default ActionBar;