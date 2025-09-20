import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    removeImage, 
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
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [initialSizes, setInitialSizes] = useState<{ id: string; width: number; height: number }[]>([]);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
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
      height: image.size.height
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
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = image.position.x;
      let newY = image.position.y;
      
      // Calculate new dimensions based on handle
      switch (resizeHandle) {
        case 'e':
          newWidth = resizeStart.width + deltaX;
          break;
        case 'w':
          newWidth = resizeStart.width - deltaX;
          newX = image.position.x + deltaX;
          break;
        case 's':
          newHeight = resizeStart.height + deltaY;
          break;
        case 'n':
          newHeight = resizeStart.height - deltaY;
          newY = image.position.y + deltaY;
          break;
        case 'se':
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height + deltaY;
          break;
        case 'sw':
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height + deltaY;
          newX = image.position.x + deltaX;
          break;
        case 'ne':
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height - deltaY;
          newY = image.position.y + deltaY;
          break;
        case 'nw':
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height - deltaY;
          newX = image.position.x + deltaX;
          newY = image.position.y + deltaY;
          break;
      }
      
      // Maintain aspect ratio if shift is held
      if (aspectRatioLocked) {
        const aspectRatio = resizeStart.width / resizeStart.height;
        if (['e', 'w'].includes(resizeHandle)) {
          newHeight = newWidth / aspectRatio;
        } else if (['n', 's'].includes(resizeHandle)) {
          newWidth = newHeight * aspectRatio;
        } else {
          // For corner handles, prioritize width changes
          newHeight = newWidth / aspectRatio;
        }
      }
      
      // Apply to multiple images if selected
      if (initialSizes.length > 1) {
        const scaleX = newWidth / resizeStart.width;
        const scaleY = newHeight / resizeStart.height;
        
        const updates = initialSizes.map(item => {
          const img = images.find(i => i.id === item.id);
          if (!img) return null;
          
          return {
            id: item.id,
            size: {
              width: item.width * scaleX,
              height: item.height * scaleY
            }
          };
        }).filter(Boolean) as { id: string; size: { width: number; height: number } }[];
        
        updateMultipleImageSizes(updates);
        
        // Update position if resizing from left or top
        if (['w', 'nw', 'sw'].includes(resizeHandle)) {
          updateImagePosition(image.id, { x: newX, y: image.position.y });
        }
        if (['n', 'nw', 'ne'].includes(resizeHandle)) {
          updateImagePosition(image.id, { x: image.position.x, y: newY });
        }
        if (resizeHandle === 'nw') {
          updateImagePosition(image.id, { x: newX, y: newY });
        }
      } else {
        // Single image resize
        updateImageSize(image.id, { width: newWidth, height: newHeight });
        
        // Update position if resizing from left or top
        if (['w', 'nw', 'sw'].includes(resizeHandle)) {
          updateImagePosition(image.id, { x: newX, y: image.position.y });
        }
        if (['n', 'nw', 'ne'].includes(resizeHandle)) {
          updateImagePosition(image.id, { x: image.position.x, y: newY });
        }
        if (resizeHandle === 'nw') {
          updateImagePosition(image.id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      setInitialSizes([]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setAspectRatioLocked(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        setAspectRatioLocked(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isResizing, resizeHandle, resizeStart, initialSizes, image, aspectRatioLocked, updateImageSize, updateMultipleImageSizes, updateImagePosition, images, zoom, panOffset]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeImage(image.id);
  };

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
        <>
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
          <ResizeHandles 
            onResizeStart={handleResizeStart}
            visible={true}
          />
        </>
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