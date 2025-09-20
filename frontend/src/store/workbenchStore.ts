import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { WorkbenchImage, Tool, Position, SelectionArea, Size, CropData } from '../types';
import { CANVAS_CONFIG } from '../constants/canvas';

interface WorkbenchState {
  images: WorkbenchImage[];
  activeTool: Tool;
  selectedImageIds: string[];
  isGenerating: boolean;
  showGenerateModal: boolean;
  isDragging: boolean;
  dragSelection: { start: Position; end: Position } | null;
  zoom: number;
  panOffset: Position;
  isPanning: boolean;
  spacePressed: boolean;
  
  // Actions
  setActiveTool: (tool: Tool) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Position) => void;
  resetView: () => void;
  setIsPanning: (panning: boolean) => void;
  setSpacePressed: (pressed: boolean) => void;
  addImage: (file: File, position?: Position) => void;
  addImageFromUrl: (url: string, position?: Position) => void;
  removeImage: (id: string) => void;
  updateImagePosition: (id: string, position: Position) => void;
  updateMultipleImagePositions: (updates: { id: string; position: Position }[]) => void;
  updateImageSize: (id: string, size: Size) => void;
  updateMultipleImageSizes: (updates: { id: string; size: Size }[]) => void;
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
  startCropping: (id: string) => void;
  updateCropArea: (id: string, cropData: CropData) => void;
  applyCrop: (id: string) => void;
  cancelCrop: (id: string) => void;
  removeCrop: (id: string) => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  images: [],
  activeTool: 'select',
  selectedImageIds: [],
  isGenerating: false,
  showGenerateModal: false,
  isDragging: false,
  dragSelection: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isPanning: false,
  spacePressed: false,
  
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  setZoom: (zoom) => set({ zoom }),
  
  setPanOffset: (offset) => set({ panOffset: offset }),
  
  resetView: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),
  
  setIsPanning: (panning) => set({ isPanning: panning }),
  
  setSpacePressed: (pressed) => set({ spacePressed: pressed }),
  
  addImage: (file, position) => {
    const id = uuidv4();
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate size while maintaining aspect ratio
        const MAX_SIZE = CANVAS_CONFIG.MAX_IMAGE_SIZE;
        const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);
        const width = img.width * scale;
        const height = img.height * scale;
        
        // Determine initial position - place randomly in a large area
        const initialPosition = position || { 
          x: Math.random() * 3000, 
          y: Math.random() * 3000
        };
        
        set((state) => ({
          images: [...state.images, {
            id,
            url: e.target?.result as string,
            file,
            position: initialPosition,
            size: { width, height },
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
  
  addImageFromUrl: (url, position) => {
    const id = uuidv4();
    const img = new Image();
    img.onload = () => {
      // Calculate size while maintaining aspect ratio
      const MAX_SIZE = 400;
      const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);
      const width = img.width * scale;
      const height = img.height * scale;
      
      // Determine initial position - place randomly in a large area
      const initialPosition = position || { 
        x: Math.random() * 3000, 
        y: Math.random() * 3000
      };
      
      set((state) => ({
        images: [...state.images, {
          id,
          url,
          position: initialPosition,
          size: { width, height },
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
  
  updateMultipleImagePositions: (updates) => {
    set((state) => ({
      images: state.images.map(img => {
        const update = updates.find(u => u.id === img.id);
        return update ? { ...img, position: update.position } : img;
      })
    }));
  },
  
  updateImageSize: (id, size) => {
    set((state) => ({
      images: state.images.map(img => 
        img.id === id 
          ? { 
              ...img, 
              size: {
                width: Math.max(CANVAS_CONFIG.MIN_IMAGE_SIZE, Math.min(CANVAS_CONFIG.MAX_RESIZE_SIZE, size.width)),
                height: Math.max(CANVAS_CONFIG.MIN_IMAGE_SIZE, Math.min(CANVAS_CONFIG.MAX_RESIZE_SIZE, size.height))
              } 
            } 
          : img
      )
    }));
  },
  
  updateMultipleImageSizes: (updates) => {
    set((state) => ({
      images: state.images.map(img => {
        const update = updates.find(u => u.id === img.id);
        if (update) {
          return { 
            ...img, 
            size: {
              width: Math.max(CANVAS_CONFIG.MIN_IMAGE_SIZE, Math.min(CANVAS_CONFIG.MAX_RESIZE_SIZE, update.size.width)),
              height: Math.max(CANVAS_CONFIG.MIN_IMAGE_SIZE, Math.min(CANVAS_CONFIG.MAX_RESIZE_SIZE, update.size.height))
            }
          };
        }
        return img;
      })
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
  },
  
  startCropping: (id) => {
    set((state) => ({
      images: state.images.map(img => 
        img.id === id 
          ? { 
              ...img, 
              isCropping: true,
              cropData: img.cropData || {
                x: 0,
                y: 0,
                width: img.size.width,
                height: img.size.height
              },
              originalSize: img.originalSize || img.size
            }
          : { ...img, isCropping: false } // Ensure only one image is cropping at a time
      )
    }));
  },
  
  updateCropArea: (id, cropData) => {
    set((state) => ({
      images: state.images.map(img => 
        img.id === id 
          ? { ...img, cropData }
          : img
      )
    }));
  },
  
  applyCrop: (id) => {
    set((state) => ({
      images: state.images.map(img => {
        if (img.id === id && img.cropData && img.originalSize) {
          const newSize = {
            width: img.cropData.width,
            height: img.cropData.height
          };
          return { 
            ...img, 
            isCropping: false,
            isCropped: true,
            size: newSize
          };
        }
        return img;
      })
    }));
  },
  
  cancelCrop: (id) => {
    set((state) => ({
      images: state.images.map(img => 
        img.id === id 
          ? { ...img, isCropping: false }
          : img
      )
    }));
  },
  
  removeCrop: (id) => {
    set((state) => ({
      images: state.images.map(img => {
        if (img.id === id && img.originalSize) {
          return { 
            ...img, 
            isCropped: false,
            size: img.originalSize,
            cropData: undefined
          };
        }
        return img;
      })
    }));
  }
}));