import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import ImageNode from './ImageNode';
import SelectionBox from './SelectionBox';
import Toolbar from './Toolbar';
import ZoomControls from './ZoomControls';
import type { Position } from '../../types';
import { screenToCanvas, calculateNewPanOffset, clampZoom } from '../../utils/coordinates';
import { CANVAS_SIZE } from '../../constants/canvas';

const Workbench: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    images,
    addImage,
    clearSelection,
    selectImages,
    deleteSelected,
    selectAll,
    setShowGenerateModal,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    activeTool,
    setActiveTool,
    isPanning,
    setIsPanning,
    spacePressed,
    setSpacePressed,
  } = useWorkbenchStore();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Position>({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState<Position>({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [initialPanOffset, setInitialPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [lastMousePosition, setLastMousePosition] = useState<Position>({ x: 500, y: 500 });
  const [contextMenuCanvasPosition, setContextMenuCanvasPosition] = useState<Position>({ x: 500, y: 500 });

  // Center the canvas on mount
  useEffect(() => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const initialOffset = {
        x: rect.width / 2 - (CANVAS_SIZE * zoom) / 2,
        y: rect.height / 2 - (CANVAS_SIZE * zoom) / 2
      };
      setPanOffset(initialOffset);
    }
  }, []);

  // Handle space key for temporary hand tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
        if (activeTool !== 'hand') {
          document.body.style.cursor = 'grab';
        }
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('hand');
      } else if ((e.ctrlKey || e.metaKey)) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          const newZoom = clampZoom(zoom + 0.1);
          setZoom(newZoom);
        } else if (e.key === '-') {
          e.preventDefault();
          const newZoom = clampZoom(zoom - 0.1);
          setZoom(newZoom);
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
          if (viewportRef.current) {
            const rect = viewportRef.current.getBoundingClientRect();
            const centerOffset = {
              x: rect.width / 2 - CANVAS_SIZE / 2,
              y: rect.height / 2 - CANVAS_SIZE / 2
            };
            setPanOffset(centerOffset);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, activeTool, zoom]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;

      const delta = e.deltaY * -0.01;
      const scaleFactor = Math.pow(2, delta);
      const newZoom = clampZoom(zoom * scaleFactor);
      
      const mousePos = { x: e.clientX, y: e.clientY };
      const canvasPoint = screenToCanvas(mousePos, zoom, panOffset, rect);
      const newOffset = calculateNewPanOffset(canvasPoint, zoom, newZoom, mousePos, rect);
      
      setZoom(newZoom);
      setPanOffset(newOffset);
    }
  }, [zoom, panOffset]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Handle drag and drop files
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const dropPosition = screenToCanvas(
      { x: e.clientX, y: e.clientY },
      zoom,
      panOffset,
      rect
    );
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addImage(file, dropPosition);
      }
    });
  }, [addImage, zoom, panOffset]);

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
            addImage(file, lastMousePosition);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addImage, lastMousePosition]);

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

  // Handle mouse down for selection or panning
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const isHandTool = activeTool === 'hand' || spacePressed;
    
    if (isHandTool) {
      // Start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setInitialPanOffset(panOffset);
      document.body.style.cursor = 'grabbing';
    } else if ((e.target as HTMLElement).classList.contains('canvas')) {
      // Start selection box
      const canvasPos = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        zoom,
        panOffset,
        rect
      );
      
      setIsSelecting(true);
      setSelectionStart(canvasPos);
      setSelectionEnd(canvasPos);
      
      if (!e.ctrlKey && !e.metaKey) {
        clearSelection();
      }
    }
  };

  // Handle mouse move for panning
  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      const newOffset = {
        x: initialPanOffset.x + deltaX,
        y: initialPanOffset.y + deltaY
      };
      
      setPanOffset(newOffset);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      if (activeTool === 'hand' || spacePressed) {
        document.body.style.cursor = 'grab';
      } else {
        document.body.style.cursor = 'default';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, initialPanOffset, activeTool, spacePressed]);

  // Handle box selection
  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasPos = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        zoom,
        panOffset,
        rect
      );
      
      setSelectionEnd(canvasPos);
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
  }, [isSelecting, selectionStart, selectionEnd, images, selectImages, zoom, panOffset]);

  // Handle double-click to add image
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (activeTool === 'hand' || spacePressed) return;
    
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickPosition = screenToCanvas(
      { x: e.clientX, y: e.clientY },
      zoom,
      panOffset,
      rect
    );
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => addImage(file, clickPosition));
      }
    };
    input.click();
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) {
      const canvasPos = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        zoom,
        panOffset,
        rect
      );
      setContextMenuCanvasPosition(canvasPos);
    }
    
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
        Array.from(files).forEach(file => addImage(file, contextMenuCanvasPosition));
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

  // Track mouse position for image placement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasPos = screenToCanvas(
          { x: e.clientX, y: e.clientY },
          zoom,
          panOffset,
          rect
        );
        setLastMousePosition(canvasPos);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [zoom, panOffset]);

  // Update cursor based on tool
  useEffect(() => {
    if (activeTool === 'hand' || spacePressed) {
      document.body.style.cursor = isPanning ? 'grabbing' : 'grab';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      document.body.style.cursor = 'default';
    };
  }, [activeTool, spacePressed, isPanning]);

  return (
    <>
      <Toolbar />
      <ZoomControls />
      <div 
        ref={viewportRef}
        className="viewport relative flex-1 overflow-hidden bg-workbench-bg viewport-dot-pattern"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div
          ref={canvasRef}
          className="canvas absolute bg-transparent"
          style={{
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: 'none',
            zIndex: 1,
          }}
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