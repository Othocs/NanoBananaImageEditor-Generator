import type { Position } from '../types';

export const screenToCanvas = (
  screenPos: Position, 
  zoom: number, 
  panOffset: Position,
  viewportRect: DOMRect
): Position => {
  return {
    x: (screenPos.x - viewportRect.left - panOffset.x) / zoom,
    y: (screenPos.y - viewportRect.top - panOffset.y) / zoom
  };
};

export const canvasToScreen = (
  canvasPos: Position,
  zoom: number,
  panOffset: Position
): Position => {
  return {
    x: canvasPos.x * zoom + panOffset.x,
    y: canvasPos.y * zoom + panOffset.y
  };
};

export const getZoomPoint = (
  mousePos: Position,
  zoom: number,
  panOffset: Position,
  viewportRect: DOMRect
): Position => {
  const canvasPos = screenToCanvas(mousePos, zoom, panOffset, viewportRect);
  return canvasPos;
};

export const calculateNewPanOffset = (
  zoomPoint: Position,
  oldZoom: number,
  newZoom: number,
  mousePos: Position,
  viewportRect: DOMRect
): Position => {
  const scaleDiff = newZoom - oldZoom;
  const offsetX = -(zoomPoint.x * scaleDiff) + (mousePos.x - viewportRect.left - (zoomPoint.x * newZoom));
  const offsetY = -(zoomPoint.y * scaleDiff) + (mousePos.y - viewportRect.top - (zoomPoint.y * newZoom));
  
  return {
    x: offsetX,
    y: offsetY
  };
};

export const clampZoom = (zoom: number, min: number = 0.1, max: number = 5): number => {
  return Math.max(min, Math.min(max, zoom));
};