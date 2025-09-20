// Central configuration for canvas dimensions and related constants
export const CANVAS_CONFIG = {
  // Main canvas size in pixels
  SIZE: 2000,
  
  // Minimum visible pixels when canvas is panned to edge
  MIN_VISIBLE_PIXELS: 100,
  
  // Maximum image size when adding to canvas
  MAX_IMAGE_SIZE: 400,
  
  // Image size constraints for resizing
  MIN_IMAGE_SIZE: 20,
  MAX_RESIZE_SIZE: 2000,
  
  // Zoom constraints
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  
  // Default zoom level
  DEFAULT_ZOOM: 1
};

// Export individual constants for convenience
export const CANVAS_SIZE = CANVAS_CONFIG.SIZE;