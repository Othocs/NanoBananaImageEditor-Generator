import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import ImageNode from './ImageNode';
import SelectionBox from './SelectionBox';
import type { Position } from '../../types';

const Workbench: React.FC = () => {
  const workbenchRef = useRef<HTMLDivElement>(null);
  const {
    images,
    addImage,
    clearSelection,
    selectImages,
    deleteSelected,
    selectAll,
    setShowGenerateModal,
  } = useWorkbenchStore();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Position>({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState<Position>({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Handle drag and drop files
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addImage(file);
      }
    });
  }, [addImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            addImage(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addImage]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, selectAll, clearSelection]);

  // Handle box selection
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection on empty space (not on context menu)
    if ((e.target as HTMLElement).classList.contains('workbench-canvas')) {
      const rect = workbenchRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const startPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      setIsSelecting(true);
      setSelectionStart(startPos);
      setSelectionEnd(startPos);
      
      if (!e.ctrlKey && !e.metaKey) {
        clearSelection();
      }
    }
  };

  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = workbenchRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setSelectionEnd({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const handleMouseUp = () => {
      if (isSelecting) {
        // Calculate which images are in the selection box
        const minX = Math.min(selectionStart.x, selectionEnd.x);
        const maxX = Math.max(selectionStart.x, selectionEnd.x);
        const minY = Math.min(selectionStart.y, selectionEnd.y);
        const maxY = Math.max(selectionStart.y, selectionEnd.y);
        
        const selectedIds = images
          .filter(img => {
            const imgRight = img.position.x + img.size.width;
            const imgBottom = img.position.y + img.size.height;
            
            return !(img.position.x > maxX || 
                    imgRight < minX || 
                    img.position.y > maxY || 
                    imgBottom < minY);
          })
          .map(img => img.id);
        
        if (selectedIds.length > 0) {
          selectImages(selectedIds);
        }
      }
      
      setIsSelecting(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, selectionStart, selectionEnd, images, selectImages]);

  // Handle double-click to add image
  const handleDoubleClick = () => {
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
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Handle context menu actions
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
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleGenerateImage = () => {
    setShowGenerateModal(true);
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  // Close context menu on click or escape
  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0 });
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu({ visible: false, x: 0, y: 0 });
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.visible]);

  return (
    <>
      <div 
        ref={workbenchRef}
        className="workbench-canvas relative flex-1 overflow-hidden bg-workbench-bg dot-pattern-bg"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {images.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-workbench-text-secondary">
              <p className="mb-2">Right-click to upload or generate images</p>
              <p className="text-sm">Drop images here • Paste from clipboard • Double-click to upload</p>
            </div>
          </div>
        )}
        
        {images.map((image) => (
          <ImageNode key={image.id} image={image} />
        ))}
        
        {isSelecting && (
          <SelectionBox
            start={selectionStart}
            end={selectionEnd}
          />
        )}
      </div>

      {contextMenu.visible && (
        <div 
          className="fixed z-50 bg-workbench-sidebar border border-workbench-border rounded-md shadow-lg py-1 min-w-[12rem]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
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

export default Workbench;