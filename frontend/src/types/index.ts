export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface SelectionArea {
  id: string;
  points: Position[];
  type: 'rectangle' | 'freeform';
}

export interface CropData {
  x: number;      // Crop area X position (relative to original image)
  y: number;      // Crop area Y position
  width: number;  // Crop area width
  height: number; // Crop area height
}

export interface WorkbenchImage {
  id: string;
  url: string;
  file?: File;
  position: Position;
  size: Size;
  selected: boolean;
  selectionAreas: SelectionArea[];
  zIndex: number;
  cropData?: CropData;        // Current crop area
  originalSize?: Size;        // Store original dimensions before cropping
  isCropping?: boolean;       // Whether in crop mode
  isCropped?: boolean;        // Whether image is currently cropped
}

export type Tool = 'select' | 'hand' | 'add' | 'generate' | 'selectArea';

export interface ViewportState {
  zoom: number;
  panOffset: Position;
}

export interface GeneratePromptData {
  prompt: string;
  contextImageIds: string[];
}