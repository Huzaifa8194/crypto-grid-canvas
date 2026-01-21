import { useState, useRef, useCallback, useEffect, type ReactNode, type CSSProperties } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface ZoomableGridContainerProps {
  children: ReactNode;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  showControls?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

interface TouchInfo {
  id: number;
  x: number;
  y: number;
}

const ZoomableGridContainer = ({
  children,
  minZoom = 1,
  maxZoom = 10,
  initialZoom = 1,
  showControls = true,
  className = "",
}: ZoomableGridContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Touch tracking refs
  const touchesRef = useRef<TouchInfo[]>([]);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<Point | null>(null);
  const panStartRef = useRef<Point | null>(null);
  const lastPanRef = useRef<Point>({ x: 0, y: 0 });
  const hasPannedRef = useRef(false); // Track if user actually panned (moved finger)
  
  // Mouse drag refs
  const isMouseDraggingRef = useRef(false);
  const mouseStartRef = useRef<Point | null>(null);
  const mousePanStartRef = useRef<Point>({ x: 0, y: 0 });
  
  // Double tap detection
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const DOUBLE_TAP_THRESHOLD = 300; // ms
  const DOUBLE_TAP_DISTANCE = 30; // pixels
  const PAN_THRESHOLD = 5; // pixels - movement needed to start panning

  // Clamp pan to keep content visible
  const clampPan = useCallback((newPan: Point, currentZoom: number): Point => {
    const container = containerRef.current;
    if (!container) return newPan;
    
    const containerRect = container.getBoundingClientRect();
    const contentWidth = containerRect.width * currentZoom;
    const contentHeight = containerRect.height * currentZoom;
    
    // Calculate max pan based on zoom level
    const maxPanX = Math.max(0, (contentWidth - containerRect.width) / 2);
    const maxPanY = Math.max(0, (contentHeight - containerRect.height) / 2);
    
    return {
      x: Math.min(maxPanX, Math.max(-maxPanX, newPan.x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, newPan.y)),
    };
  }, []);

  // Zoom to a specific point (keeps that point centered during zoom)
  const zoomToPoint = useCallback((newZoom: number, clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const clampedZoom = Math.min(maxZoom, Math.max(minZoom, newZoom));
    const containerRect = container.getBoundingClientRect();
    
    // Calculate point relative to container center
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;
    const pointX = clientX - containerCenterX;
    const pointY = clientY - containerCenterY;
    
    // Calculate new pan to keep the point stationary
    const zoomRatio = clampedZoom / zoom;
    const newPan = {
      x: pointX - (pointX - pan.x) * zoomRatio,
      y: pointY - (pointY - pan.y) * zoomRatio,
    };
    
    setZoom(clampedZoom);
    setPan(clampPan(newPan, clampedZoom));
  }, [zoom, pan, minZoom, maxZoom, clampPan]);

  // Handle wheel zoom (desktop)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.01;
      const newZoom = zoom * (1 + delta);
      zoomToPoint(newZoom, e.clientX, e.clientY);
    }
  }, [zoom, zoomToPoint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = Array.from(e.touches).map(t => ({
      id: t.identifier,
      x: t.clientX,
      y: t.clientY,
    }));
    touchesRef.current = touches;
    
    if (touches.length === 1) {
      const touch = touches[0];
      const now = Date.now();
      const lastTap = lastTapRef.current;
      
      // Check for double tap
      if (lastTap) {
        const timeDiff = now - lastTap.time;
        const distance = Math.sqrt(
          Math.pow(touch.x - lastTap.x, 2) + Math.pow(touch.y - lastTap.y, 2)
        );
        
        if (timeDiff < DOUBLE_TAP_THRESHOLD && distance < DOUBLE_TAP_DISTANCE) {
          // Double tap detected - toggle between 1x and 3x zoom
          e.preventDefault();
          const targetZoom = zoom < 2 ? 3 : 1;
          if (targetZoom === 1) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          } else {
            zoomToPoint(targetZoom, touch.x, touch.y);
          }
          lastTapRef.current = null;
          return;
        }
      }
      
      lastTapRef.current = { time: now, x: touch.x, y: touch.y };
      
      // Prepare for potential panning if zoomed in (but don't start yet - wait for movement)
      if (zoom > 1) {
        panStartRef.current = { x: touch.x, y: touch.y };
        lastPanRef.current = { ...pan };
        hasPannedRef.current = false;
        // Don't set isPanning yet - wait for movement threshold
      }
    } else if (touches.length === 2) {
      // Start pinch zoom
      e.preventDefault();
      const dx = touches[1].x - touches[0].x;
      const dy = touches[1].y - touches[0].y;
      lastPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      lastPinchCenterRef.current = {
        x: (touches[0].x + touches[1].x) / 2,
        y: (touches[0].y + touches[1].y) / 2,
      };
      setIsPanning(false);
      hasPannedRef.current = false;
    }
  }, [zoom, pan, zoomToPoint]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = Array.from(e.touches).map(t => ({
      id: t.identifier,
      x: t.clientX,
      y: t.clientY,
    }));
    
    if (touches.length === 2 && lastPinchDistanceRef.current !== null) {
      // Pinch zoom
      e.preventDefault();
      const dx = touches[1].x - touches[0].x;
      const dy = touches[1].y - touches[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const center = {
        x: (touches[0].x + touches[1].x) / 2,
        y: (touches[0].y + touches[1].y) / 2,
      };
      
      const scale = distance / lastPinchDistanceRef.current;
      const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * scale));
      
      // Calculate pan adjustment to zoom toward pinch center
      if (lastPinchCenterRef.current) {
        const container = containerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const containerCenterX = containerRect.left + containerRect.width / 2;
          const containerCenterY = containerRect.top + containerRect.height / 2;
          
          const pointX = center.x - containerCenterX;
          const pointY = center.y - containerCenterY;
          
          const zoomRatio = newZoom / zoom;
          const newPan = {
            x: pointX - (pointX - pan.x) * zoomRatio,
            y: pointY - (pointY - pan.y) * zoomRatio,
          };
          
          setPan(clampPan(newPan, newZoom));
        }
      }
      
      setZoom(newZoom);
      lastPinchDistanceRef.current = distance;
      lastPinchCenterRef.current = center;
      hasPannedRef.current = true;
    } else if (touches.length === 1 && panStartRef.current && zoom > 1) {
      // Check if we should start panning (movement exceeds threshold)
      const touch = touches[0];
      const dx = touch.x - panStartRef.current.x;
      const dy = touch.y - panStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > PAN_THRESHOLD || isPanning) {
        // Start or continue panning
        if (!isPanning) {
          setIsPanning(true);
        }
        hasPannedRef.current = true;
        
        const newPan = {
          x: lastPanRef.current.x + dx,
          y: lastPanRef.current.y + dy,
        };
        
        setPan(clampPan(newPan, zoom));
      }
    }
    
    touchesRef.current = touches;
  }, [zoom, pan, isPanning, minZoom, maxZoom, clampPan]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const remainingTouches = Array.from(e.touches).map(t => ({
      id: t.identifier,
      x: t.clientX,
      y: t.clientY,
    }));
    
    if (remainingTouches.length < 2) {
      lastPinchDistanceRef.current = null;
      lastPinchCenterRef.current = null;
    }
    
    if (remainingTouches.length === 0) {
      setIsPanning(false);
      panStartRef.current = null;
      hasPannedRef.current = false;
    }
    
    touchesRef.current = remainingTouches;
  }, []);

  // Mouse drag handlers for desktop panning when zoomed
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    // Only pan with left mouse button
    if (e.button !== 0) return;
    
    isMouseDraggingRef.current = true;
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
    mousePanStartRef.current = { ...pan };
    setIsPanning(true);
    e.preventDefault();
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDraggingRef.current || !mouseStartRef.current) return;
    
    const dx = e.clientX - mouseStartRef.current.x;
    const dy = e.clientY - mouseStartRef.current.y;
    
    const newPan = {
      x: mousePanStartRef.current.x + dx,
      y: mousePanStartRef.current.y + dy,
    };
    
    setPan(clampPan(newPan, zoom));
  }, [zoom, clampPan]);

  const handleMouseUp = useCallback(() => {
    isMouseDraggingRef.current = false;
    mouseStartRef.current = null;
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isMouseDraggingRef.current) {
      isMouseDraggingRef.current = false;
      mouseStartRef.current = null;
      setIsPanning(false);
    }
  }, []);

  // Control button handlers
  const handleZoomIn = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomToPoint(zoom * 1.5, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [zoom, zoomToPoint]);

  const handleZoomOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomToPoint(zoom / 1.5, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [zoom, zoomToPoint]);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Transform style for the content
  const contentStyle: CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: "center center",
    transition: isPanning ? "none" : "transform 0.15s ease-out",
    willChange: "transform",
  };

  const isZoomed = zoom > 1.05;
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className={`relative ${className}`}>
      {/* Zoom controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            disabled={zoom >= maxZoom}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-card/90 border border-border/60 text-foreground/80 hover:bg-card hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm backdrop-blur-sm"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= minZoom}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-card/90 border border-border/60 text-foreground/80 hover:bg-card hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm backdrop-blur-sm"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          {isZoomed && (
            <button
              onClick={handleReset}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-card/90 border border-border/60 text-foreground/80 hover:bg-card hover:text-foreground transition-colors shadow-sm backdrop-blur-sm"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="absolute bottom-2 left-2 z-20 px-2 py-1 rounded-md bg-card/90 border border-border/60 text-[10px] text-muted-foreground backdrop-blur-sm shadow-sm">
          {zoomPercent}%
        </div>
      )}

      {/* Mobile zoom hint */}
      {showControls && !isZoomed && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-2 py-1 rounded-md bg-card/80 border border-border/40 text-[9px] text-muted-foreground/70 backdrop-blur-sm md:hidden pointer-events-none">
          Pinch to zoom • Double-tap to magnify
        </div>
      )}

      {/* Zoomable container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isZoomed ? (isPanning ? "grabbing" : "grab") : "default" }}
      >
        <div ref={contentRef} style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ZoomableGridContainer;

