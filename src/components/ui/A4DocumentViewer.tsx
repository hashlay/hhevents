import React, { useState, useEffect, useRef } from 'react';
import { FileText, ZoomIn, ZoomOut } from 'lucide-react';

export interface A4DocumentViewerProps {
  children: React.ReactNode;
  className?: string;
  defaultMode?: 'fit' | '100';
  allowToggle?: boolean;
}

export const A4DocumentViewer: React.FC<A4DocumentViewerProps> = ({
  children,
  className = '',
  defaultMode = 'fit',
  allowToggle = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 820
  );
  const [contentHeight, setContentHeight] = useState<number>(1123);
  const [mode, setMode] = useState<'fit' | '100'>(defaultMode);

  // Standard strict A4 pixel width at 96 DPI (210mm = 793.7px)
  const A4_WIDTH = 794;

  useEffect(() => {
    let animId: number;

    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setContainerWidth((prev) => (Math.abs(prev - w) > 4 ? Math.round(w) : prev));
        }
      }
      if (contentRef.current) {
        const h = contentRef.current.offsetHeight;
        if (h > 0) {
          setContentHeight((prev) => (Math.abs(prev - h) > 4 ? Math.round(h) : prev));
        }
      }
    };

    updateWidth();

    // Use ResizeObserver safely on container only
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(updateWidth);
      });
      ro.observe(containerRef.current);
      return () => {
        cancelAnimationFrame(animId);
        ro.disconnect();
      };
    }

    const onResize = () => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(updateWidth);
    };

    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const isSmallScreen = containerWidth < A4_WIDTH + 16;
  const fitScale = isSmallScreen
    ? Math.min(1, Math.max(0.25, (containerWidth - 8) / A4_WIDTH))
    : 1;
  const currentScale = mode === 'fit' && isSmallScreen ? fitScale : 1;
  const scaledHeight = isSmallScreen && mode === 'fit' ? Math.ceil(contentHeight * fitScale) : undefined;

  return (
    <div className={`w-full a4-document-viewer ${className}`} ref={containerRef}>
      {/* Mobile Strict A4 Scale Controls (Shown only on viewports narrower than A4 width) */}
      {isSmallScreen && allowToggle && (
        <div className="no-print flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-100/90 backdrop-blur-xs rounded-xl border border-slate-200 text-xs mb-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
            <FileText className="w-3.5 h-3.5 text-[#0082a6]" />
            <span>Strict A4 Document</span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({Math.round(currentScale * 100)}%)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setMode('fit')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'fit'
                  ? 'bg-[#0082a6] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ZoomOut className="w-3 h-3" />
              <span>Fit Screen</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('100')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mode === '100'
                  ? 'bg-[#0082a6] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ZoomIn className="w-3 h-3" />
              <span>100% Size</span>
            </button>
          </div>
        </div>
      )}

      {/* Document Viewport Wrapper */}
      <div
        className={`w-full a4-document-viewport ${
          mode === '100' && isSmallScreen ? 'overflow-x-auto pb-4' : 'overflow-hidden flex justify-center'
        }`}
        style={{
          height: scaledHeight ? `${scaledHeight}px` : undefined,
        }}
      >
        <div
          ref={contentRef}
          style={{
            width: `${A4_WIDTH}px`,
            minWidth: `${A4_WIDTH}px`,
            maxWidth: `${A4_WIDTH}px`,
            transform: currentScale !== 1 ? `scale(${currentScale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          onClick={() => {
            if (isSmallScreen && allowToggle) {
              setMode((prev) => (prev === 'fit' ? '100' : 'fit'));
            }
          }}
          className={`${isSmallScreen ? 'cursor-pointer' : ''}`}
          title={isSmallScreen ? 'Click to toggle between Fit Screen and 100% Zoom' : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
