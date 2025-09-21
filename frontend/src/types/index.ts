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

export type Tool = 'select' | 'add' | 'generate' | 'selectArea';

export interface GeneratePromptData {
  prompt: string;
  contextImageIds: string[];
}