import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { WorkbenchImage } from '../../types';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { screenToCanvas } from '../../utils/coordinates';

interface ImageNodeProps {
  image: WorkbenchImage;
}

const ImageNode: React.FC<ImageNodeProps> = ({ image }) => {
  const { 
    selectImage, 
    updateImagePosition, 
    updateMultipleImagePositions,
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
  const nodeRef = useRef<HTMLDivElement>(null);

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
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X size={14} />
        </button>
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