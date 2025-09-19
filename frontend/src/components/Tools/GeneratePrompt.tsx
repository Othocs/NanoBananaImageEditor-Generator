import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';

const GeneratePrompt: React.FC = () => {
  const { 
    showGenerateModal, 
    setShowGenerateModal, 
    selectedImageIds, 
    images,
    isGenerating,
    setIsGenerating
  } = useWorkbenchStore();
  
  const [prompt, setPrompt] = useState('');

  if (!showGenerateModal) return null;

  const selectedImages = images.filter(img => selectedImageIds.includes(img.id));

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate generation process
    console.log('Generating with:', {
      prompt,
      contextImages: selectedImages.map(img => img.id)
    });
    
    // TODO: Connect to backend API
    setTimeout(() => {
      setIsGenerating(false);
      setShowGenerateModal(false);
      setPrompt('');
      alert(`Generation started with prompt: "${prompt}" using ${selectedImages.length} image(s) as context`);
    }, 2000);
  };

  const handleClose = () => {
    setShowGenerateModal(false);
    setPrompt('');
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