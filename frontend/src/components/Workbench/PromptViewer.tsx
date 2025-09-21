import React, { useEffect, useState } from 'react';
import { X, Copy, Sparkles, Check } from 'lucide-react';
import { useWorkbenchStore } from '../../store/workbenchStore';

const PromptViewer: React.FC = () => {
  const { 
    promptViewerOpen, 
    viewingPromptImageId, 
    closePromptViewer,
    images 
  } = useWorkbenchStore();
  
  const [copied, setCopied] = useState(false);
  
  const image = images.find(img => img.id === viewingPromptImageId);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && promptViewerOpen) {
        closePromptViewer();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [promptViewerOpen, closePromptViewer]);
  
  if (!promptViewerOpen || !image?.generationContext) {
    return null;
  }
  
  const handleCopyPrompt = () => {
    if (image.generationContext?.prompt) {
      navigator.clipboard.writeText(image.generationContext.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get context images
  const contextImages = image.generationContext.contextImageIds
    .map(id => images.find(img => img.id === id))
    .filter(Boolean);
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={closePromptViewer}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] animate-scale-in">
        <div className="bg-workbench-sidebar border border-workbench-border rounded-lg shadow-2xl max-w-2xl w-[90vw] max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-workbench-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-workbench-selected" />
              <h2 className="text-lg font-semibold text-workbench-text">AI Generation Details</h2>
            </div>
            <button
              onClick={closePromptViewer}
              className="p-1 hover:bg-workbench-hover rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-workbench-text-secondary" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Prompt Section */}
            <div>
              <label className="block text-sm font-medium text-workbench-text-secondary mb-2">
                Prompt
              </label>
              <div className="bg-workbench-bg border border-workbench-border rounded-md p-3">
                <p className="text-workbench-text whitespace-pre-wrap break-words">
                  {image.generationContext.prompt || 'No prompt available'}
                </p>
              </div>
            </div>
            
            {/* Timestamp */}
            <div>
              <label className="block text-sm font-medium text-workbench-text-secondary mb-2">
                Generated
              </label>
              <p className="text-workbench-text">
                {formatTimestamp(image.generationContext.timestamp)}
              </p>
            </div>
            
            {/* Context Images */}
            {contextImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-workbench-text-secondary mb-2">
                  Context Images ({contextImages.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {contextImages.map(contextImg => contextImg && (
                    <div 
                      key={contextImg.id}
                      className="relative group"
                    >
                      <img
                        src={contextImg.url}
                        alt="Context"
                        className="h-20 w-20 object-cover rounded border border-workbench-border group-hover:border-workbench-selected transition-colors"
                      />
                      {contextImg.generationContext && (
                        <div className="absolute top-1 right-1 bg-workbench-sidebar/90 rounded p-0.5">
                          <Sparkles className="w-3 h-3 text-workbench-selected" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Generated Image Preview */}
            <div>
              <label className="block text-sm font-medium text-workbench-text-secondary mb-2">
                Generated Image
              </label>
              <div className="bg-workbench-bg border border-workbench-border rounded-md p-2">
                <img
                  src={image.url}
                  alt="Generated"
                  className="max-h-48 mx-auto object-contain"
                />
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-workbench-border">
            <button
              onClick={handleCopyPrompt}
              className="w-full py-2 px-4 bg-workbench-selected text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromptViewer;