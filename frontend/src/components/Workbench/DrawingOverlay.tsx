import React, { useRef, useState, useEffect } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import type { Position } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const DrawingOverlay: React.FC = () => {
  const { images, addSelectionArea } = useWorkbenchStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Position | null>(null);
  const [currentPos, setCurrentPos] = useState<Position | null>(null);
  const [targetImageId, setTargetImageId] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw current selection if drawing
    if (isDrawing && startPos && currentPos) {
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
      
      const width = currentPos.x - startPos.x;
      const height = currentPos.y - startPos.y;
      
      ctx.fillRect(startPos.x, startPos.y, width, height);
      ctx.strokeRect(startPos.x, startPos.y, width, height);
    }
  }, [isDrawing, startPos, currentPos]);

  const getImageAtPosition = (pos: Position): string | null => {
    for (const image of images) {
      if (pos.x >= image.position.x && 
          pos.x <= image.position.x + image.size.width &&
          pos.y >= image.position.y && 
          pos.y <= image.position.y + image.size.height) {
        return image.id;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const imageId = getImageAtPosition(pos);
    if (imageId) {
      const image = images.find(img => img.id === imageId);
      if (image) {
        setIsDrawing(true);
        setStartPos({
          x: pos.x - image.position.x,
          y: pos.y - image.position.y
        });
        setCurrentPos({
          x: pos.x - image.position.x,
          y: pos.y - image.position.y
        });
        setTargetImageId(imageId);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !targetImageId) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const image = images.find(img => img.id === targetImageId);
    if (!image) return;
    
    setCurrentPos({
      x: e.clientX - rect.left - image.position.x,
      y: e.clientY - rect.top - image.position.y
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && startPos && currentPos && targetImageId) {
      // Add selection area to the image
      addSelectionArea(targetImageId, {
        id: uuidv4(),
        points: [startPos, currentPos],
        type: 'rectangle'
      });
    }
    
    setIsDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
    setTargetImageId(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ cursor: 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default DrawingOverlay;