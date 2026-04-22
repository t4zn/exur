'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelsProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export default function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((clientX - containerRect.left) / containerRect.width) * 100;

      // Clamp the width between min and max values
      const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
      setLeftWidth(clampedWidth);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left Panel */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="flex-shrink-0 min-w-0"
      >
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        className="resize-handle-visible flex-shrink-0 group flex items-center justify-center touch-none transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          width: '16px',
          cursor: 'col-resize',
          minHeight: '100%',
          backgroundColor: 'transparent',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <div
          className="flex flex-col gap-1 transition-opacity duration-200"
          style={{
            opacity: isDragging ? 1 : 0.6
          }}
        >
          <div
            style={{
              width: '4px',
              height: '4px',
              backgroundColor: 'var(--foreground)',
              borderRadius: '50%',
              opacity: 0.7
            }}
          />
          <div
            style={{
              width: '4px',
              height: '4px',
              backgroundColor: 'var(--foreground)',
              borderRadius: '50%',
              opacity: 0.7
            }}
          />
          <div
            style={{
              width: '4px',
              height: '4px',
              backgroundColor: 'var(--foreground)',
              borderRadius: '50%',
              opacity: 0.7
            }}
          />
          <div
            style={{
              width: '4px',
              height: '4px',
              backgroundColor: 'var(--foreground)',
              borderRadius: '50%',
              opacity: 0.7
            }}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="flex-shrink-0 min-w-0"
      >
        {rightPanel}
      </div>
    </div>
  );
}