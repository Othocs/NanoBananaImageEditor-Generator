import React, { useState, useEffect, useRef } from 'react';
import type { CropData } from '../../types';

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  cropData: CropData;
  onCropUpdate: (cropData: CropData) => void;
  onApply: () => void;
  onCancel: () => void;
}

type CropHandle = 'nw' | 'ne' | 'se' | 'sw';

const CropOverlay: React.FC<CropOverlayProps> = ({
  imageWidth,
  imageHeight,
  cropData,
  onCropUpdate,
  onApply,
  onCancel
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<CropHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropData>(cropData);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        // Move the crop area
        const newX = Math.max(0, Math.min(imageWidth - initialCrop.width, initialCrop.x + deltaX));
        const newY = Math.max(0, Math.min(imageHeight - initialCrop.height, initialCrop.y + deltaY));
        
        onCropUpdate({
          ...initialCrop,
          x: newX,
          y: newY
        });
      } else if (isResizing && resizeHandle) {
        // Resize the crop area while maintaining aspect ratio
        const aspectRatio = initialCrop.width / initialCrop.height;
        let newCrop = { ...initialCrop };

        switch (resizeHandle) {
          case 'se':
            const newWidth = Math.max(20, Math.min(imageWidth - initialCrop.x, initialCrop.width + deltaX));
            const newHeight = newWidth / aspectRatio;
            if (newHeight <= imageHeight - initialCrop.y) {
              newCrop.width = newWidth;
              newCrop.height = newHeight;
            }
            break;
          case 'sw':
            const swWidth = Math.max(20, Math.min(initialCrop.x + initialCrop.width, initialCrop.width - deltaX));
            const swHeight = swWidth / aspectRatio;
            if (swHeight <= imageHeight - initialCrop.y) {
              newCrop.x = initialCrop.x + (initialCrop.width - swWidth);
              newCrop.width = swWidth;
              newCrop.height = swHeight;
            }
            break;
          case 'ne':
            const neWidth = Math.max(20, Math.min(imageWidth - initialCrop.x, initialCrop.width + deltaX));
            const neHeight = neWidth / aspectRatio;
            if (neHeight <= initialCrop.y + initialCrop.height) {
              newCrop.y = initialCrop.y + (initialCrop.height - neHeight);
              newCrop.width = neWidth;
              newCrop.height = neHeight;
            }
            break;
          case 'nw':
            const nwWidth = Math.max(20, Math.min(initialCrop.x + initialCrop.width, initialCrop.width - deltaX));
            const nwHeight = nwWidth / aspectRatio;
            if (nwHeight <= initialCrop.y + initialCrop.height) {
              newCrop.x = initialCrop.x + (initialCrop.width - nwWidth);
              newCrop.y = initialCrop.y + (initialCrop.height - nwHeight);
              newCrop.width = nwWidth;
              newCrop.height = nwHeight;
            }
            break;
        }

        onCropUpdate(newCrop);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, initialCrop, imageWidth, imageHeight, onCropUpdate]);

  const handleCropAreaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop(cropData);
  };

  const handleResizeStart = (handle: CropHandle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop(cropData);
  };

  // Handle keyboard shortcuts and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside the overlay content
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onApply();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onApply, onCancel]);

  const handles: { position: CropHandle; className: string }[] = [
    { position: 'nw', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize' },
    { position: 'ne', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize' },
    { position: 'se', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize' },
    { position: 'sw', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize' },
  ];

  return (
    <div ref={overlayRef} className="absolute inset-0 z-20">
      {/* Dark overlay for areas outside crop */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="cropMask">
            <rect x="0" y="0" width={imageWidth} height={imageHeight} fill="white" />
            <rect x={cropData.x} y={cropData.y} width={cropData.width} height={cropData.height} fill="black" />
          </mask>
        </defs>
        <rect x="0" y="0" width={imageWidth} height={imageHeight} fill="rgba(0,0,0,0.5)" mask="url(#cropMask)" />
      </svg>

      {/* Crop area with handles */}
      <div
        className="absolute border-2 border-white cursor-move"
        style={{
          left: cropData.x,
          top: cropData.y,
          width: cropData.width,
          height: cropData.height,
        }}
        onMouseDown={handleCropAreaMouseDown}
      >
        {/* Grid lines for rule of thirds */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white opacity-30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white opacity-30" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white opacity-30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white opacity-30" />
        </div>

        {/* Resize handles */}
        {handles.map(({ position, className }) => (
          <div
            key={position}
            className={`absolute w-3 h-3 bg-white border-2 border-workbench-selected rounded-full ${className}`}
            onMouseDown={(e) => handleResizeStart(position, e)}
          />
        ))}

        {/* Dimensions display */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white text-xs bg-black bg-opacity-75 px-2 py-1 rounded">
          {Math.round(cropData.width)} × {Math.round(cropData.height)}
        </div>
      </div>
    </div>
  );
};

export default CropOverlay;