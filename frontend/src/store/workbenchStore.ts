import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { WorkbenchImage, Tool, Position, SelectionArea } from '../types';

interface WorkbenchState {
  images: WorkbenchImage[];
  activeTool: Tool;
  selectedImageIds: string[];
  isGenerating: boolean;
  showGenerateModal: boolean;
  isDragging: boolean;
  dragSelection: { start: Position; end: Position } | null;
  
  // Actions
  setActiveTool: (tool: Tool) => void;
  addImage: (file: File) => void;
  addImageFromUrl: (url: string) => void;
  removeImage: (id: string) => void;
  updateImagePosition: (id: string, position: Position) => void;
  selectImage: (id: string, multiSelect?: boolean) => void;
  selectImages: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  deleteSelected: () => void;
  setShowGenerateModal: (show: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  bringToFront: (id: string) => void;
  setDragSelection: (selection: { start: Position; end: Position } | null) => void;
  addSelectionArea: (imageId: string, area: SelectionArea) => void;
  clearSelectionAreas: (imageId: string) => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  images: [],
  activeTool: 'select',
  selectedImageIds: [],
  isGenerating: false,
  showGenerateModal: false,
  isDragging: false,
  dragSelection: null,
  
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  addImage: (file) => {
    const id = uuidv4();
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        set((state) => ({
          images: [...state.images, {
            id,
            url: e.target?.result as string,
            file,
            position: { 
              x: Math.random() * 400 + 100, 
              y: Math.random() * 400 + 100 
            },
            size: { 
              width: Math.min(img.width, 400), 
              height: Math.min(img.height, 400) * (img.height / img.width) 
            },
            selected: false,
            selectionAreas: [],
            zIndex: state.images.length
          }]
        }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  },
  
  addImageFromUrl: (url) => {
    const id = uuidv4();
    const img = new Image();
    img.onload = () => {
      set((state) => ({
        images: [...state.images, {
          id,
          url,
          position: { 
            x: Math.random() * 400 + 100, 
            y: Math.random() * 400 + 100 
          },
          size: { 
            width: Math.min(img.width, 400), 
            height: Math.min(img.height, 400) * (img.height / img.width) 
          },
          selected: false,
          selectionAreas: [],
          zIndex: state.images.length
        }]
      }));
    };
    img.src = url;
  },
  
  removeImage: (id) => {
    set((state) => ({
      images: state.images.filter(img => img.id !== id),
      selectedImageIds: state.selectedImageIds.filter(sid => sid !== id)
    }));
  },
  
  updateImagePosition: (id, position) => {
    set((state) => ({
      images: state.images.map(img => 
        img.id === id ? { ...img, position } : img
      )
    }));
  },
  
  selectImage: (id, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        const isSelected = state.selectedImageIds.includes(id);
        return {
          selectedImageIds: isSelected 
            ? state.selectedImageIds.filter(sid => sid !== id)
            : [...state.selectedImageIds, id],
          images: state.images.map(img => ({
            ...img,
            selected: img.id === id ? !img.selected : img.selected
          }))
        };
      } else {
        return {
          selectedImageIds: [id],
          images: state.images.map(img => ({
            ...img,
            selected: img.id === id
          }))
        };
      }
    });
  },
  
  selectImages: (ids) => {
    set((state) => ({
      selectedImageIds: ids,
      images: state.images.map(img => ({
        ...img,
        selected: ids.includes(img.id)
      }))
    }));
  },
  
  clearSelection: () => {
    set((state) => ({
      selectedImageIds: [],
      images: state.images.map(img => ({ ...img, selected: false }))
    }));
  },
  
  selectAll: () => {
    set((state) => ({
      selectedImageIds: state.images.map(img => img.id),
      images: state.images.map(img => ({ ...img, selected: true }))
    }));
  },
  
  deleteSelected: () => {
    set((state) => ({
      images: state.images.filter(img => !state.selectedImageIds.includes(img.id)),
      selectedImageIds: []
    }));
  },
  
  setShowGenerateModal: (show) => set({ showGenerateModal: show }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
  bringToFront: (id) => {
    set((state) => {
      const maxZ = Math.max(...state.images.map(img => img.zIndex));
      return {
        images: state.images.map(img => 
          img.id === id ? { ...img, zIndex: maxZ + 1 } : img
        )
      };
    });
  },
  
  setDragSelection: (selection) => set({ dragSelection: selection }),
  
  addSelectionArea: (imageId, area) => {
    set((state) => ({
      images: state.images.map(img => 
        img.id === imageId 
          ? { ...img, selectionAreas: [...img.selectionAreas, area] }
          : img
      )
    }));
  },
  
  clearSelectionAreas: (imageId) => {
    set((state) => ({
      images: state.images.map(img => 
        img.id === imageId 
          ? { ...img, selectionAreas: [] }
          : img
      )
    }));
  }
}));