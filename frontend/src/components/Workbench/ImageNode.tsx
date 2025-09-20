import React, { useRef, useState, useEffect } from 'react';
import type { WorkbenchImage } from '../../types';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { screenToCanvas } from '../../utils/coordinates';
import ResizeHandles from './ResizeHandles';
import type { ResizeHandle } from './ResizeHandles';

interface ImageNodeProps {
  image: WorkbenchImage;
}

const ImageNode: React.FC<ImageNodeProps> = ({ image }) => {
  const { 
    selectImage, 
    updateImagePosition, 
    updateMultipleImagePositions,
    updateImageSize,
    updateMultipleImageSizes,
    bringToFront,
    activeTool,
    zoom,
    panOffset,
    spacePressed,
    images,
    selectedImageIds
  } = useWorkbenchStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedImagesOffsets, setSelectedImagesOffsets] = useState<{ id: string; offset: { x: number; y: number } }[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, initialX: 0, initialY: 0 });
  const [initialSizes, setInitialSizes] = useState<{ id: string; width: number; height: number }[]>([]);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = (handle: ResizeHandle, e: React.MouseEvent) => {
    if (!image.selected) return;
    
    const viewportRect = nodeRef.current?.closest('.viewport')?.getBoundingClientRect();
    if (!viewportRect) return;
    
    const canvasPos = screenToCanvas(
      { x: e.clientX, y: e.clientY },
      zoom,
      panOffset,
      viewportRect
    );
    
    // Store initial sizes for all selected images
    const sizes = selectedImageIds.map(id => {
      const img = images.find(i => i.id === id);
      if (!img) return null;
      return {
        id,
        width: img.size.width,
        height: img.size.height
      };
    }).filter(Boolean) as { id: string; width: number; height: number }[];
    
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: canvasPos.x,
      y: canvasPos.y,
      width: image.size.width,
      height: image.size.height,
      initialX: image.position.x,
      initialY: image.position.y
    });
    setInitialSizes(sizes);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand' || spacePressed) return;
    if (activeTool !== 'select') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const isMultiSelect = e.ctrlKey || e.metaKey;
    
    // Determine which images should be selected after this click
    let imagesToMove: string[] = [];
    
    if (!image.selected) {
      // If clicking on an unselected image
      if (isMultiSelect) {
        // Add to selection
        selectImage(image.id, true);
        imagesToMove = [...selectedImageIds, image.id];
      } else {
        // Replace selection with just this image
        selectImage(image.id, false);
        imagesToMove = [image.id];
      }
    } else {
      // Clicking on an already selected image - move all selected images
      imagesToMove = selectedImageIds.includes(image.id) 
        ? selectedImageIds 
        : [...selectedImageIds, image.id];
    }
    
    bringToFront(image.id);
    
    const viewportRect = nodeRef.current?.closest('.viewport')?.getBoundingClientRect();
    if (!viewportRect) return;
    
    const canvasPos = screenToCanvas(
      { x: e.clientX, y: e.clientY },
      zoom,
      panOffset,
      viewportRect
    );
    
    // Calculate offsets for all images that will be moved
    const offsets = imagesToMove.map(id => {
      const img = images.find(i => i.id === id);
      if (!img) return null;
      return {
        id,
        offset: {
          x: canvasPos.x - img.position.x,
          y: canvasPos.y - img.position.y
        }
      };
    }).filter(Boolean) as { id: string; offset: { x: number; y: number } }[];
    
    setSelectedImagesOffsets(offsets);
    setIsDragging(true);
    setDragStart({
      x: canvasPos.x - image.position.x,
      y: canvasPos.y - image.position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const viewportRect = nodeRef.current?.closest('.viewport')?.getBoundingClientRect();
      if (!viewportRect) return;
      
      const canvasPos = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        zoom,
        panOffset,
        viewportRect
      );
      
      // If multiple images are selected, move them all together
      if (selectedImagesOffsets.length > 1) {
        const updates = selectedImagesOffsets.map(item => ({
          id: item.id,
          position: {
            x: canvasPos.x - item.offset.x,
            y: canvasPos.y - item.offset.y
          }
        }));
        updateMultipleImagePositions(updates);
      } else {
        // Single image movement
        const newPosition = {
          x: canvasPos.x - dragStart.x,
          y: canvasPos.y - dragStart.y
        };
        updateImagePosition(image.id, newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setSelectedImagesOffsets([]);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, selectedImagesOffsets, image.id, updateImagePosition, updateMultipleImagePositions, zoom, panOffset]);

  // Handle resize
  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const viewportRect = nodeRef.current?.closest('.viewport')?.getBoundingClientRect();
      if (!viewportRect) return;
      
      const canvasPos = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        zoom,
        panOffset,
        viewportRect
      );
      
      const deltaX = canvasPos.x - resizeStart.x;
      const deltaY = canvasPos.y - resizeStart.y;
      
      // Calculate the scale based on which corner is being dragged
      // We use the maximum of x or y delta to maintain aspect ratio
      let scale = 1;
      
      switch (resizeHandle) {
        case 'se':
          // Bottom-right: scale based on positive deltas
          scale = Math.max(
            (resizeStart.width + deltaX) / resizeStart.width,
            (resizeStart.height + deltaY) / resizeStart.height
          );
          break;
        case 'sw':
          // Bottom-left: scale based on negative X, positive Y
          scale = Math.max(
            (resizeStart.width - deltaX) / resizeStart.width,
            (resizeStart.height + deltaY) / resizeStart.height
          );
          break;
        case 'ne':
          // Top-right: scale based on positive X, negative Y
          scale = Math.max(
            (resizeStart.width + deltaX) / resizeStart.width,
            (resizeStart.height - deltaY) / resizeStart.height
          );
          break;
        case 'nw':
          // Top-left: scale based on negative deltas
          scale = Math.max(
            (resizeStart.width - deltaX) / resizeStart.width,
            (resizeStart.height - deltaY) / resizeStart.height
          );
          break;
      }
      
      // Ensure minimum scale
      scale = Math.max(scale, 0.1);
      
      const newWidth = resizeStart.width * scale;
      const newHeight = resizeStart.height * scale;
      
      // Calculate new position based on which corner is being dragged
      let newX = resizeStart.initialX;
      let newY = resizeStart.initialY;
      
      switch (resizeHandle) {
        case 'se':
          // Bottom-right: no position change
          break;
        case 'sw':
          // Bottom-left: adjust X position
          newX = resizeStart.initialX + (resizeStart.width - newWidth);
          break;
        case 'ne':
          // Top-right: adjust Y position
          newY = resizeStart.initialY + (resizeStart.height - newHeight);
          break;
        case 'nw':
          // Top-left: adjust both X and Y
          newX = resizeStart.initialX + (resizeStart.width - newWidth);
          newY = resizeStart.initialY + (resizeStart.height - newHeight);
          break;
      }
      
      // Apply to multiple images if selected
      if (initialSizes.length > 1) {
        const updates = initialSizes.map(item => ({
          id: item.id,
          size: {
            width: item.width * scale,
            height: item.height * scale
          }
        }));
        
        updateMultipleImageSizes(updates);
        
        // Only update position for the image being directly resized
        if (newX !== resizeStart.initialX || newY !== resizeStart.initialY) {
          updateImagePosition(image.id, { x: newX, y: newY });
        }
      } else {
        // Single image resize
        updateImageSize(image.id, { width: newWidth, height: newHeight });
        
        if (newX !== resizeStart.initialX || newY !== resizeStart.initialY) {
          updateImagePosition(image.id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      setInitialSizes([]);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, initialSizes, image.id, updateImageSize, updateMultipleImageSizes, updateImagePosition, zoom, panOffset]);


  return (
    <div
      ref={nodeRef}
      className={`image-node ${image.selected ? 'selected' : ''}`}
      style={{
        left: image.position.x,
        top: image.position.y,
        width: image.size.width,
        height: image.size.height,
        zIndex: image.zIndex,
        cursor: (activeTool === 'select' && !spacePressed) ? 'move' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <img 
        src={image.url} 
        alt="Workbench item"
        className="w-full h-full object-contain"
        draggable={false}
      />
      
      {image.selected && (
        <ResizeHandles 
          onResizeStart={handleResizeStart}
          visible={true}
        />
      )}
      
      {image.selectionAreas.map((area) => (
        <svg
          key={area.id}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {area.type === 'rectangle' && area.points.length === 2 && (
            <rect
              x={Math.min(area.points[0].x, area.points[1].x)}
              y={Math.min(area.points[0].y, area.points[1].y)}
              width={Math.abs(area.points[1].x - area.points[0].x)}
              height={Math.abs(area.points[1].y - area.points[0].y)}
              fill="rgba(37, 99, 235, 0.2)"
              stroke="rgba(37, 99, 235, 0.8)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </svg>
      ))}
    </div>
  );
};

export default ImageNode;