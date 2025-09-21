import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { WorkbenchImage } from '../../types';
import { useWorkbenchStore } from '../../store/workbenchStore';

interface ImageNodeProps {
  image: WorkbenchImage;
}

const ImageNode: React.FC<ImageNodeProps> = ({ image }) => {
  const { 
    selectImage, 
    updateImagePosition, 
    removeImage, 
    bringToFront,
    activeTool 
  } = useWorkbenchStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const isMultiSelect = e.ctrlKey || e.metaKey;
    selectImage(image.id, isMultiSelect);
    bringToFront(image.id);
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - image.position.x,
      y: e.clientY - image.position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateImagePosition(image.id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, image.id, updateImagePosition]);

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
        cursor: activeTool === 'select' ? 'move' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <img 
        src={image.url} 
        alt="Workbench item"
        className="w-full h-full object-contain rounded-lg"
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