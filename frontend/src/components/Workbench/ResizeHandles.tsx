import React from 'react';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ResizeHandlesProps {
  onResizeStart: (handle: ResizeHandle, e: React.MouseEvent) => void;
  visible: boolean;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ onResizeStart, visible }) => {
  if (!visible) return null;

  const handles: { position: ResizeHandle; className: string; cursor: string }[] = [
    { position: 'nw', className: 'top-0 left-0', cursor: 'nw-resize' },
    { position: 'n', className: 'top-0 left-1/2 -translate-x-1/2', cursor: 'n-resize' },
    { position: 'ne', className: 'top-0 right-0', cursor: 'ne-resize' },
    { position: 'e', className: 'top-1/2 right-0 -translate-y-1/2', cursor: 'e-resize' },
    { position: 'se', className: 'bottom-0 right-0', cursor: 'se-resize' },
    { position: 's', className: 'bottom-0 left-1/2 -translate-x-1/2', cursor: 's-resize' },
    { position: 'sw', className: 'bottom-0 left-0', cursor: 'sw-resize' },
    { position: 'w', className: 'top-1/2 left-0 -translate-y-1/2', cursor: 'w-resize' },
  ];

  return (
    <>
      {handles.map(({ position, className, cursor }) => (
        <div
          key={position}
          className={`resize-handle absolute w-2 h-2 bg-white border border-workbench-selected rounded-sm z-10 ${className}`}
          style={{ cursor }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onResizeStart(position, e);
          }}
        />
      ))}
    </>
  );
};

export default ResizeHandles;