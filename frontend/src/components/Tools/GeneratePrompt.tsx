import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const GeneratePrompt: React.FC = () => {
  const { 
    showGenerateModal, 
    setShowGenerateModal, 
    selectedImageIds, 
    images,
    isGenerating,
    setIsGenerating,
    addImageFromUrl,
    contextMenuCanvasPosition,
    setContextMenuCanvasPosition
  } = useWorkbenchStore();
  
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!showGenerateModal) return null;

  const selectedImages = images.filter(img => selectedImageIds.includes(img.id));

  const imageToBase64 = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Convert selected images to base64
      const contextImagesBase64: string[] = [];
      for (const img of selectedImages) {
        try {
          const base64 = await imageToBase64(img.url);
          contextImagesBase64.push(base64);
        } catch (err) {
          console.error(`Failed to convert image ${img.id} to base64:`, err);
        }
      }
      
      // Prepare request body
      const requestBody = {
        prompt: prompt,
        context_images: contextImagesBase64.length > 0 ? contextImagesBase64 : undefined,
        settings: {
          temperature: 0.8
        }
      };
      
      // Call backend API
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.image) {
        // Convert base64 to data URL and add to workbench at the right-click position
        const imageDataUrl = `data:image/png;base64,${data.image}`;
        addImageFromUrl(imageDataUrl, contextMenuCanvasPosition || undefined);
        
        // Clear the saved position after using it
        setContextMenuCanvasPosition(null);
        
        // Close modal and reset
        setShowGenerateModal(false);
        setPrompt('');
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setShowGenerateModal(false);
    setPrompt('');
    setError(null);
    setContextMenuCanvasPosition(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-workbench-sidebar border border-workbench-border rounded-lg p-6 max-w-2xl w-full mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-workbench-selected" />
            <h2 className="text-lg font-semibold text-workbench-text">Generate Image</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-workbench-hover rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-workbench-text-secondary mb-2">
            Using {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} as context
          </p>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {selectedImages.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt="Context"
                className="h-20 w-20 object-cover rounded border border-workbench-border"
              />
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm text-workbench-text-secondary mb-2">
            Describe what you want to generate
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Combine these images with a cyberpunk aesthetic..."
            className="w-full h-32 px-3 py-2 bg-workbench-bg border border-workbench-border rounded-md text-workbench-text placeholder-workbench-text-secondary focus:outline-none focus:border-workbench-selected resize-none"
            autoFocus
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex-1 py-2 bg-workbench-selected text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-workbench-hover text-workbench-text rounded-md hover:bg-workbench-border transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratePrompt;