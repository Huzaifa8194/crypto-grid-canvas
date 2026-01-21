import { useCallback, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ZoomableContainerProps {
  children: ReactNode;
  enabled?: boolean;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

interface TouchPoint {
  x: number;
  y: number;
}

const ZoomableContainer = ({
  children,
  enabled = true,
  minScale = 1,
  maxScale = 8,
  initialScale = 1,
}: ZoomableContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Transform state
  const [scale, setScale] = useState(initialScale);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  
  // Touch tracking refs
  const lastTouchesRef = useRef<TouchPoint[]>([]);
  const lastScaleRef = useRef(initialScale);
  const lastTranslateRef = useRef({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);
  const isPanningRef = useRef(false);
  
  // Double-tap detection
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const DOUBLE_TAP_DELAY = 300;
  const DOUBLE_TAP_DISTANCE = 50;

  // Get distance between two touch points
  const getDistance = (touches: TouchPoint[]): number => {
    if (touches.length < 2) return 0;
    const dx = touches[1].x - touches[0].x;
    const dy = touches[1].y - touches[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get center point between touches
  const getCenter = (touches: TouchPoint[]): TouchPoint => {
    if (touches.length === 1) return touches[0];
    return {
      x: (touches[0].x + touches[1].x) / 2,
      y: (touches[0].y + touches[1].y) / 2,
    };
  };

  // Convert touch list to array of points
  const touchListToPoints = (touchList: TouchList): TouchPoint[] => {
    return Array.from(touchList).map((t) => ({ x: t.clientX, y: t.clientY }));
  };

  // Clamp scale within bounds
  const clampScale = (s: number): number => {
    return Math.min(maxScale, Math.max(minScale, s));
  };

  // Constrain translation to keep content in view
  const constrainTranslate = (
    tx: number,
    ty: number,
    currentScale: number
  ): { x: number; y: number } => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return { x: tx, y: ty };

    const containerRect = container.getBoundingClientRect();
    const contentWidth = content.offsetWidth * currentScale;
    const contentHeight = content.offsetHeight * currentScale;

    // If content is smaller than container, center it
    if (contentWidth <= containerRect.width) {
      tx = 0;
    } else {
      // Limit panning so content edge doesn't go past container edge
      const maxX = (contentWidth - containerRect.width) / 2;
      tx = Math.min(maxX, Math.max(-maxX, tx));
    }

    if (contentHeight <= containerRect.height) {
      ty = 0;
    } else {
      const maxY = (contentHeight - containerRect.height) / 2;
      ty = Math.min(maxY, Math.max(-maxY, ty));
    }

    return { x: tx, y: ty };
  };

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touches = touchListToPoints(e.touches);
      lastTouchesRef.current = touches;
      lastScaleRef.current = scale;
      lastTranslateRef.current = translate;

      if (touches.length === 2) {
        isPinchingRef.current = true;
        isPanningRef.current = false;
      } else if (touches.length === 1) {
        // Check for double-tap
        const now = Date.now();
        const tap = touches[0];
        const lastTap = lastTapRef.current;

        if (lastTap) {
          const timeDiff = now - lastTap.time;
          const dx = tap.x - lastTap.x;
          const dy = tap.y - lastTap.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (timeDiff < DOUBLE_TAP_DELAY && distance < DOUBLE_TAP_DISTANCE) {
            // Double tap detected - toggle zoom
            e.preventDefault();
            
            if (scale > minScale + 0.1) {
              // Zoom out to min
              setScale(minScale);
              setTranslate({ x: 0, y: 0 });
              lastScaleRef.current = minScale;
              lastTranslateRef.current = { x: 0, y: 0 };
            } else {
              // Zoom in to 3x centered on tap point
              const container = containerRef.current;
              if (container) {
                const rect = container.getBoundingClientRect();
                const tapX = tap.x - rect.left - rect.width / 2;
                const tapY = tap.y - rect.top - rect.height / 2;
                const newScale = 3;
                // Center the zoom on tap point
                const newTranslate = constrainTranslate(
                  -tapX * (newScale - 1),
                  -tapY * (newScale - 1),
                  newScale
                );
                setScale(newScale);
                setTranslate(newTranslate);
                lastScaleRef.current = newScale;
                lastTranslateRef.current = newTranslate;
              }
            }
            lastTapRef.current = null;
            return;
          }
        }

        lastTapRef.current = { time: now, x: tap.x, y: tap.y };
        
        // Only enable panning if already zoomed in
        if (scale > minScale) {
          isPanningRef.current = true;
        }
      }
    },
    [enabled, scale, translate, minScale]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touches = touchListToPoints(e.touches);

      if (touches.length === 2 && lastTouchesRef.current.length === 2 && isPinchingRef.current) {
        e.preventDefault();

        // Calculate new scale
        const oldDistance = getDistance(lastTouchesRef.current);
        const newDistance = getDistance(touches);
        const scaleChange = newDistance / oldDistance;
        const newScale = clampScale(lastScaleRef.current * scaleChange);

        // Calculate pan during pinch
        const oldCenter = getCenter(lastTouchesRef.current);
        const newCenter = getCenter(touches);
        const dx = newCenter.x - oldCenter.x;
        const dy = newCenter.y - oldCenter.y;

        // Apply scale around pinch center
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const centerX = oldCenter.x - rect.left - rect.width / 2;
          const centerY = oldCenter.y - rect.top - rect.height / 2;

          // Scale translation
          const scaleRatio = newScale / lastScaleRef.current;
          const newTx = lastTranslateRef.current.x * scaleRatio + dx - centerX * (scaleRatio - 1);
          const newTy = lastTranslateRef.current.y * scaleRatio + dy - centerY * (scaleRatio - 1);

          const constrained = constrainTranslate(newTx, newTy, newScale);
          setScale(newScale);
          setTranslate(constrained);
        }
      } else if (touches.length === 1 && isPanningRef.current && scale > minScale) {
        e.preventDefault();

        const dx = touches[0].x - lastTouchesRef.current[0].x;
        const dy = touches[0].y - lastTouchesRef.current[0].y;

        const newTranslate = constrainTranslate(
          lastTranslateRef.current.x + dx,
          lastTranslateRef.current.y + dy,
          scale
        );

        setTranslate(newTranslate);
        lastTranslateRef.current = newTranslate;
        lastTouchesRef.current = touches;
      }
    },
    [enabled, scale, minScale]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touches = touchListToPoints(e.touches);

      if (touches.length < 2) {
        isPinchingRef.current = false;
        lastScaleRef.current = scale;
        lastTranslateRef.current = translate;
      }

      if (touches.length === 0) {
        isPanningRef.current = false;
      }

      lastTouchesRef.current = touches;
    },
    [enabled, scale, translate]
  );

  // Button handlers
  const handleZoomIn = useCallback(() => {
    const newScale = clampScale(scale * 1.5);
    const newTranslate = constrainTranslate(
      translate.x * (newScale / scale),
      translate.y * (newScale / scale),
      newScale
    );
    setScale(newScale);
    setTranslate(newTranslate);
    lastScaleRef.current = newScale;
    lastTranslateRef.current = newTranslate;
  }, [scale, translate]);

  const handleZoomOut = useCallback(() => {
    const newScale = clampScale(scale / 1.5);
    const newTranslate = constrainTranslate(
      translate.x * (newScale / scale),
      translate.y * (newScale / scale),
      newScale
    );
    setScale(newScale);
    setTranslate(newTranslate);
    lastScaleRef.current = newScale;
    lastTranslateRef.current = newTranslate;
  }, [scale, translate]);

  const handleReset = useCallback(() => {
    setScale(minScale);
    setTranslate({ x: 0, y: 0 });
    lastScaleRef.current = minScale;
    lastTranslateRef.current = { x: 0, y: 0 };
  }, [minScale]);

  // Content transform style
  const contentStyle: CSSProperties = enabled
    ? {
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: "center center",
        transition: isPinchingRef.current || isPanningRef.current ? "none" : "transform 0.2s ease-out",
      }
    : {};

  const isZoomed = scale > minScale + 0.05;

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-background/90 border border-border/60 shadow-sm backdrop-blur-sm active:bg-accent transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-foreground/80" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-background/90 border border-border/60 shadow-sm backdrop-blur-sm active:bg-accent transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-foreground/80" />
        </button>
        {isZoomed && (
          <button
            onClick={handleReset}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-background/90 border border-border/60 shadow-sm backdrop-blur-sm active:bg-accent transition-colors"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-4 h-4 text-foreground/80" />
          </button>
        )}
      </div>

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded bg-background/90 border border-border/60 shadow-sm backdrop-blur-sm">
          <span className="text-xs font-medium text-foreground/80">
            {Math.round(scale * 100)}%
          </span>
        </div>
      )}

      {/* Zoomable container */}
      <div
        ref={containerRef}
        className="overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={contentRef} style={contentStyle}>
          {children}
        </div>
      </div>

      {/* Helper text when zoomed */}
      {isZoomed && (
        <p className="text-center mt-1 text-[9px] text-muted-foreground/60">
          Drag to pan • Double-tap to reset
        </p>
      )}
    </div>
  );
};

export default ZoomableContainer;

