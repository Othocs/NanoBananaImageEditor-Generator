import type { Position, Size } from '../types';

interface ImageBounds {
  position: Position;
  size: Size;
}

interface ConnectionPoint {
  x: number;
  y: number;
}

interface BezierPath {
  start: ConnectionPoint;
  end: ConnectionPoint;
  controlPoint1: ConnectionPoint;
  controlPoint2?: ConnectionPoint;
}

export function getImageCenter(bounds: ImageBounds): ConnectionPoint {
  return {
    x: bounds.position.x + bounds.size.width / 2,
    y: bounds.position.y + bounds.size.height / 2
  };
}

export function getConnectionPoint(bounds: ImageBounds, targetBounds: ImageBounds): ConnectionPoint {
  const center = getImageCenter(bounds);
  const targetCenter = getImageCenter(targetBounds);
  
  // Calculate angle from source to target
  const angle = Math.atan2(targetCenter.y - center.y, targetCenter.x - center.x);
  
  // Get point on edge of image
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const halfWidth = bounds.size.width / 2;
  const halfHeight = bounds.size.height / 2;
  
  // Determine which edge to use based on angle
  let edgeX: number, edgeY: number;
  
  if (Math.abs(cos) * halfHeight > Math.abs(sin) * halfWidth) {
    // Hit left or right edge
    const xDist = cos > 0 ? halfWidth : -halfWidth;
    edgeX = center.x + xDist;
    edgeY = center.y + xDist * Math.tan(angle);
  } else {
    // Hit top or bottom edge
    const yDist = sin > 0 ? halfHeight : -halfHeight;
    edgeX = center.x + yDist / Math.tan(angle);
    edgeY = center.y + yDist;
  }
  
  // Clamp to image bounds
  edgeX = Math.max(bounds.position.x, Math.min(bounds.position.x + bounds.size.width, edgeX));
  edgeY = Math.max(bounds.position.y, Math.min(bounds.position.y + bounds.size.height, edgeY));
  
  return { x: edgeX, y: edgeY };
}

export function calculateBezierPath(
  sourceBounds: ImageBounds,
  targetBounds: ImageBounds
): BezierPath {
  // Get connection points on edges of images
  const start = getConnectionPoint(sourceBounds, targetBounds);
  const end = getConnectionPoint(targetBounds, sourceBounds);
  
  // Calculate distance for control point offset
  const distance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );
  
  // Control point offset (creates the curve)
  const curveFactor = 0.3; // How much the line curves
  const controlOffset = Math.min(distance * curveFactor, 150); // Cap the curve amount
  
  // Calculate perpendicular direction for curve
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Normalized perpendicular vector
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Single control point for quadratic bezier (smoother for our use case)
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Offset the control point perpendicular to the line
  const controlPoint1: ConnectionPoint = {
    x: midX + perpX * controlOffset,
    y: midY + perpY * controlOffset
  };
  
  return {
    start,
    end,
    controlPoint1
  };
}

export function pathToSvgString(path: BezierPath): string {
  // Create SVG path string for quadratic bezier curve
  return `M ${path.start.x} ${path.start.y} Q ${path.controlPoint1.x} ${path.controlPoint1.y} ${path.end.x} ${path.end.y}`;
}

export function calculateArrowhead(path: BezierPath, size: number = 10): string {
  // Calculate angle at the end of the curve for arrowhead direction
  const dx = path.end.x - path.controlPoint1.x;
  const dy = path.end.y - path.controlPoint1.y;
  const angle = Math.atan2(dy, dx);
  
  // Calculate arrowhead points
  const arrowAngle = Math.PI / 6; // 30 degrees
  const x1 = path.end.x - size * Math.cos(angle - arrowAngle);
  const y1 = path.end.y - size * Math.sin(angle - arrowAngle);
  const x2 = path.end.x - size * Math.cos(angle + arrowAngle);
  const y2 = path.end.y - size * Math.sin(angle + arrowAngle);
  
  return `M ${x1} ${y1} L ${path.end.x} ${path.end.y} L ${x2} ${y2}`;
}

export function getFlowAnimationPath(path: BezierPath, progress: number): ConnectionPoint {
  // Calculate position along bezier curve for animation
  // Using quadratic bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
  const t = progress;
  const oneMinusT = 1 - t;
  
  return {
    x: oneMinusT * oneMinusT * path.start.x + 
       2 * oneMinusT * t * path.controlPoint1.x + 
       t * t * path.end.x,
    y: oneMinusT * oneMinusT * path.start.y + 
       2 * oneMinusT * t * path.controlPoint1.y + 
       t * t * path.end.y
  };
}