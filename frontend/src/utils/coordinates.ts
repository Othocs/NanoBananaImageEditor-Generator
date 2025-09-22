import type { Position, Size } from '../types';

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
  _oldZoom: number,  // Kept for API compatibility, but not used in new calculation
  newZoom: number,
  mousePos: Position,
  viewportRect: DOMRect
): Position => {
  // Keep the point under the cursor at the same screen position after zooming
  // This ensures zoom is centered on the cursor location
  const offsetX = (mousePos.x - viewportRect.left) - (zoomPoint.x * newZoom);
  const offsetY = (mousePos.y - viewportRect.top) - (zoomPoint.y * newZoom);
  
  return {
    x: offsetX,
    y: offsetY
  };
};

export const clampZoom = (zoom: number, min: number = 0.1, max: number = 5): number => {
  return Math.max(min, Math.min(max, zoom));
};

export const constrainPanOffset = (
  panOffset: Position,
  _viewportSize: { width: number; height: number },
  _zoom: number,
  _canvasSize: number = 2000
): Position => {
  // No constraints - allow free panning
  return panOffset;
};

export const constrainImagePosition = (
  position: Position,
  _imageSize: Size,
  _canvasSize: number = 2000
): Position => {
  // No constraints - allow images anywhere
  return position;
};