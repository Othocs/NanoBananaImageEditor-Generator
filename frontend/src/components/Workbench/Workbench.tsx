import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import ImageNode from './ImageNode';
import SelectionBox from './SelectionBox';
import DrawingOverlay from './DrawingOverlay';
import type { Position } from '../../types';

const Workbench: React.FC = () => {
  const workbenchRef = useRef<HTMLDivElement>(null);
  const {
    images,
    activeTool,
    addImage,
    clearSelection,
    selectImages,
    deleteSelected,
    selectAll,
  } = useWorkbenchStore();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Position>({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState<Position>({ x: 0, y: 0 });

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
    if (activeTool !== 'select') return;
    
    // Only start selection on empty space
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

  return (
    <div 
      ref={workbenchRef}
      className="workbench-canvas relative flex-1 overflow-hidden bg-workbench-bg"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {images.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-workbench-text-secondary">
            <p className="mb-2">Double-click anywhere to create a new Block, or start with...</p>
            <p className="text-sm">Drop images here • Paste from clipboard • Click + to add</p>
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
      
      {activeTool === 'selectArea' && (
        <DrawingOverlay />
      )}
    </div>
  );
};

export default Workbench;