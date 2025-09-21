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

export interface WorkbenchImage {
  id: string;
  url: string;
  file?: File;
  position: Position;
  size: Size;
  selected: boolean;
  selectionAreas: SelectionArea[];
  zIndex: number;
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