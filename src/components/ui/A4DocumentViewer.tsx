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
    const measureWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setContainerWidth((prev) => (Math.abs(prev - w) > 2 ? w : prev));
        }
      }
    };

    const measureHeight = () => {
      if (contentRef.current) {
        // Read natural unscaled content height
        const h = contentRef.current.scrollHeight || contentRef.current.offsetHeight;
        if (h && h > 100) {
          setContentHeight((prev) => (Math.abs(prev - h) > 4 ? h : prev));
        }
      }
    };

    measureWidth();
    measureHeight();

    // Use ResizeObserver on container to observe WIDTH changes only
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width);
          if (w > 0) {
            setContainerWidth((prev) => (Math.abs(prev - w) > 2 ? w : prev));
          }
        }
      });
      ro.observe(containerRef.current);
    }

    // Use ResizeObserver on content to observe natural unscaled content height changes only
    let contentRo: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && contentRef.current) {
      contentRo = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const h = Math.round(entry.contentRect.height);
          if (h && h > 100) {
            setContentHeight((prev) => (Math.abs(prev - h) > 4 ? h : prev));
          }
        }
      });
      contentRo.observe(contentRef.current);
    }

    const onResize = () => {
      measureWidth();
      measureHeight();
    };

    window.addEventListener('resize', onResize);

    const t1 = setTimeout(measureHeight, 150);
    const t2 = setTimeout(measureHeight, 600);

    return () => {
      ro?.disconnect();
      contentRo?.disconnect();
      window.removeEventListener('resize', onResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const isSmallScreen = containerWidth < A4_WIDTH + 8;
  const fitScale = isSmallScreen
    ? Math.min(1, Math.max(0.2, (containerWidth - 4) / A4_WIDTH))
    : 1;
  const isFitMode = mode === 'fit' && isSmallScreen;
  const currentScale = isFitMode ? fitScale : 1;

  const safeContentHeight = Math.max(1123, contentHeight);
  const scaledWidth = Math.round(A4_WIDTH * currentScale);
  const scaledHeight = Math.ceil(safeContentHeight * currentScale);

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
                isFitMode
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
                !isFitMode
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
          !isFitMode && isSmallScreen
            ? 'overflow-x-auto pb-4 pt-1'
            : 'overflow-hidden flex justify-center items-start'
        }`}
        style={{
          minHeight: isFitMode ? `${scaledHeight}px` : undefined,
          height: isFitMode ? `${scaledHeight}px` : undefined,
        }}
      >
        <div
          className="a4-document-inner"
          style={
            isFitMode
              ? {
                  width: `${scaledWidth}px`,
                  minWidth: `${scaledWidth}px`,
                  maxWidth: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }
              : {
                  width: `${A4_WIDTH}px`,
                  minWidth: `${A4_WIDTH}px`,
                  maxWidth: `${A4_WIDTH}px`,
                  margin: '0 auto',
                  position: 'relative',
                }
          }
        >
          <div
            ref={contentRef}
            className="a4-document-content"
            style={
              isFitMode
                ? {
                    width: `${A4_WIDTH}px`,
                    minWidth: `${A4_WIDTH}px`,
                    maxWidth: `${A4_WIDTH}px`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `scale(${currentScale})`,
                    transformOrigin: 'top left',
                  }
                : {
                    width: `${A4_WIDTH}px`,
                    minWidth: `${A4_WIDTH}px`,
                    maxWidth: `${A4_WIDTH}px`,
                    position: 'relative',
                  }
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};