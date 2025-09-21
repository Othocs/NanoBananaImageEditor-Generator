import React from 'react';
import { Grid3x3 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-14 bg-workbench-bg border-b border-workbench-border flex items-center px-4">
      <div className="flex items-center gap-3">
        <Grid3x3 className="w-5 h-5 text-workbench-text-secondary" />
        <span className="text-workbench-text">
          Image Editor
        </span>
      </div>
    </header>
  );
};

export default Header;