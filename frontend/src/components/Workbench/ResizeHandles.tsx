import React from 'react';

export type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw';

interface ResizeHandlesProps {
  onResizeStart: (handle: ResizeHandle, e: React.MouseEvent) => void;
  visible: boolean;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ onResizeStart, visible }) => {
  if (!visible) return null;

  const handles: { position: ResizeHandle; className: string; cursor: string }[] = [
    { position: 'nw', className: '-top-2 -left-2', cursor: 'nw-resize' },
    { position: 'ne', className: '-top-2 -right-2', cursor: 'ne-resize' },
    { position: 'se', className: '-bottom-2 -right-2', cursor: 'se-resize' },
    { position: 'sw', className: '-bottom-2 -left-2', cursor: 'sw-resize' },
  ];

  return (
    <>
      {handles.map(({ position, className, cursor }) => (
        <div
          key={position}
          className={`resize-handle absolute w-4 h-4 bg-white border-[3px] border-workbench-selected rounded-full z-10 ${className}`}
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