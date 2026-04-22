'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelsVerticalProps {
  topPanel: ReactNode;
  bottomPanel: ReactNode;
  defaultTopHeight?: number;
  minTopHeight?: number;
  maxTopHeight?: number;
}

export default function ResizablePanelsVertical({
  topPanel,
  bottomPanel,
  defaultTopHeight = 70,
  minTopHeight = 40,
  maxTopHeight = 85
}: ResizablePanelsVerticalProps) {
  const [topHeight, setTopHeight] = useState(defaultTopHeight);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (clientY: number) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newTopHeight = ((clientY - containerRect.top) / containerRect.height) * 100;

      // Clamp the height between min and max values
      const clampedHeight = Math.min(Math.max(newTopHeight, minTopHeight), maxTopHeight);
      setTopHeight(clampedHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
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
      document.body.style.cursor = 'row-resize';
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
  }, [isDragging, minTopHeight, maxTopHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Top Panel */}
      <div
        style={{ height: `${topHeight}%` }}
        className="flex-shrink-0 min-h-0"
      >
        {topPanel}
      </div>

      {/* Resizer */}
      <div
        className="resize-handle-visible flex-shrink-0 group flex items-center justify-center touch-none transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          height: '16px',
          cursor: 'row-resize',
          minWidth: '100%',
          backgroundColor: 'transparent',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <div
          className="flex gap-1 transition-opacity duration-200"
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

      {/* Bottom Panel */}
      <div
        style={{ height: `${100 - topHeight}%` }}
        className="flex-shrink-0 min-h-0"
      >
        {bottomPanel}
      </div>
    </div>
  );
}
