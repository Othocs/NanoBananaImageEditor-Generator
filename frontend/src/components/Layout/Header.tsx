import React, { useState } from 'react';
import { Grid3x3 } from 'lucide-react';

const Header: React.FC = () => {
  const [projectName, setProjectName] = useState('Untitled');
  const [isEditing, setIsEditing] = useState(false);

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <header className="h-14 bg-workbench-bg border-b border-workbench-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Grid3x3 className="w-5 h-5 text-workbench-text-secondary" />
        {isEditing ? (
          <input
            type="text"
            value={projectName}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="bg-transparent border-b border-workbench-text-secondary outline-none text-workbench-text"
            autoFocus
          />
        ) : (
          <span 
            onClick={handleNameClick}
            className="text-workbench-text cursor-pointer hover:text-workbench-text-secondary transition-colors"
          >
            {projectName}
          </span>
        )}
      </div>
      
      <button className="px-4 py-1.5 bg-workbench-hover text-workbench-text rounded-md hover:bg-workbench-border transition-colors text-sm">
        Share
      </button>
    </header>
  );
};

export default Header;