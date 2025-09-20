import React, { useState, useEffect } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';

interface ContextMenuProps {
  children: React.ReactNode;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  const { addImage, setShowGenerateModal } = useWorkbenchStore();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });

  const handleUploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => addImage(file));
      }
    };
    input.click();
    setIsVisible(false);
  };

  const handleGenerateImage = () => {
    setShowGenerateModal(true);
    setIsVisible(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
  };

  const handleClick = () => {
    // Only close context menu, don't prevent other clicks
    if (isVisible) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setIsVisible(false);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false);
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible]);

  return (
    <>
      <div onContextMenu={handleContextMenu} onClick={handleClick}>
        {children}
      </div>
      
      {isVisible && (
        <div 
          className="fixed z-50 bg-workbench-sidebar border border-workbench-border rounded-md shadow-lg py-1 min-w-[12rem]"
          style={{ 
            left: position.x, 
            top: position.y,
            transform: 'translate(0, 0)'
          }}
        >
          <button
            onClick={handleUploadImage}
            className="w-full text-left px-3 py-2 text-sm text-workbench-text hover:bg-workbench-hover flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>
          <div className="h-px bg-workbench-border mx-1 my-1" />
          <button
            onClick={handleGenerateImage}
            className="w-full text-left px-3 py-2 text-sm text-workbench-text hover:bg-workbench-hover flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Image
          </button>
        </div>
      )}
    </>
  );
};

export default ContextMenu;