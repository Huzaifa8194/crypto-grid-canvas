import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { type BlockCoordinate, type PixelRegion, type SelectionRect } from "@/types/pixels";
import { BLOCKS_PER_SIDE, PIXELS_PER_BLOCK, buildSelectionRect, rectToBlocks } from "@/lib/pixelMath";

export interface RegionHoverPayload {
  region: PixelRegion;
  canvasX: number;
  canvasY: number;
  clientX: number;
  clientY: number;
}

interface PixelBlock {
  id: string;
  x: number;
  y: number;
  sold: boolean;
  logoUrl?: string;
  link?: string;
}

interface PixelGridProps {
  interactive?: boolean;
  showLegend?: boolean;
  onSelectionChange?: (count: number) => void;
  onSelectionRectChange?: (rect: SelectionRect | null) => void;
  onSelectionComplete?: (rect: SelectionRect | null, availablePixels: number) => void;
  onAreaClick?: () => void;
  lockedBlocks?: BlockCoordinate[];
  regions?: PixelRegion[];
  reservedRects?: SelectionRect[];
  highlightRect?: SelectionRect | null;
  onRegionHoverChange?: (payload: RegionHoverPayload | null) => void;
  onRegionClick?: (region: PixelRegion) => void;
}

const PixelGrid = ({
  interactive = true,
  showLegend = true,
  onSelectionChange,
  onSelectionRectChange,
  onSelectionComplete,
  onAreaClick,
  lockedBlocks = [],
  regions = [],
  reservedRects = [],
  highlightRect = null,
  onRegionHoverChange,
  onRegionClick,
}: PixelGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState(800);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredBlockRef = useRef<{ x: number; y: number } | null>(null);
  const needsRedrawRef = useRef(true);
  const baseBitmapRef = useRef<CanvasImageSource | null>(null);
  const soldGridRef = useRef<boolean[][] | null>(null);
  const soldSATRef = useRef<number[][] | null>(null);
  const regionImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const hoveredRegionRef = useRef<RegionHoverPayload | null>(null);
  const regionLookup = useMemo(() => {
    const map = new Map<string, PixelRegion>();
    regions?.forEach((region) => {
      for (let j = region.bounds.j0; j <= region.bounds.j1; j++) {
        for (let i = region.bounds.i0; i <= region.bounds.i1; i++) {
          map.set(`${i}:${j}`, region);
        }
      }
    });
    return map;
  }, [regions]);

  // Full 1000x1000 pixel grid
  const GRID_SIZE = 1000;
  const PIXEL_SIZE = GRID_SIZE / BLOCKS_PER_SIDE; // Each "block" is 10x10 pixels for easier interaction
  const TOTAL_BLOCK_COUNT = BLOCKS_PER_SIDE * BLOCKS_PER_SIDE; // 10,000
  const TOTAL_PIXEL_COUNT = TOTAL_BLOCK_COUNT * PIXELS_PER_BLOCK; // 1,000,000
  const SUB_PIXELS_PER_SIDE = Math.round(Math.sqrt(PIXELS_PER_BLOCK)); // 10
  const SUB_PIXEL_SIZE = PIXEL_SIZE / SUB_PIXELS_PER_SIDE; // 1

  const lockedBlockSet = useMemo(() => {
    const set = new Set<string>();
    lockedBlocks?.forEach((block) => {
      set.add(`${block.i}:${block.j}`);
    });
    return set;
  }, [lockedBlocks]);

  const reservedBlockSet = useMemo(() => {
    const set = new Set<string>();
    reservedRects?.forEach((rect) => {
      rectToBlocks(rect).forEach((block) => {
        set.add(`${block.i}:${block.j}`);
      });
    });
    return set;
  }, [reservedRects]);

  useEffect(() => {
    const cache = regionImageCacheRef.current;
    const ids = new Set(regions?.map((region) => region.id));
    // Remove stale entries
    Array.from(cache.keys()).forEach((key) => {
      if (!ids.has(key)) {
        cache.delete(key);
      }
    });

    if (!regions?.length) {
      needsRedrawRef.current = true;
      return;
    }

    regions.forEach((region) => {
      const src = region.imageDataUrl ?? region.imageUrl;
      if (!src || cache.has(region.id)) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        cache.set(region.id, img);
        needsRedrawRef.current = true;
      };
      img.onerror = () => {
        cache.delete(region.id);
      };
      img.src = src;
    });
  }, [regions]);

  // Generate pixel blocks (100x100 = 10,000 blocks), mark reserved/sold in organized rectangles
  const blocksRef = useRef<PixelBlock[]>(
    Array.from({ length: BLOCKS_PER_SIDE * BLOCKS_PER_SIDE }, (_, i) => {
      const x = (i % BLOCKS_PER_SIDE) * PIXEL_SIZE;
      const y = Math.floor(i / BLOCKS_PER_SIDE) * PIXEL_SIZE;
      const bi = x / PIXEL_SIZE;
      const bj = y / PIXEL_SIZE;
      return {
        id: `block-${x}-${y}`,
        x,
        y,
        sold: false,
        logoUrl: undefined,
      };
    })
  );

  // Update canvas size on window resize
  useEffect(() => {
    const updateSize = () => {
      const maxSize = Math.min(window.innerWidth - 32, 800);
      setCanvasSize(maxSize);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Global rAF-driven draw loop helper
  const drawFrame = useCallback(() => {
    if (!needsRedrawRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset transform to devicePixelRatio
    const scale = window.devicePixelRatio || 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Draw base
    if (baseBitmapRef.current) {
      ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
      ctx.drawImage(baseBitmapRef.current, 0, 0);
    } else {
      // Extremely rare fallback
      ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    }

    // Draw assigned region imagery
    regions?.forEach((region) => {
      const img = regionImageCacheRef.current.get(region.id);
      if (!img) return;
      const x = region.bounds.i0 * PIXEL_SIZE;
      const y = region.bounds.j0 * PIXEL_SIZE;
      const width = region.bounds.width * PIXEL_SIZE;
      const height = region.bounds.height * PIXEL_SIZE;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      ctx.drawImage(img, x, y, width, height);
      ctx.restore();
      if (interactive) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
      }
    });

    if (highlightRect) {
      const hx = highlightRect.i0 * PIXEL_SIZE;
      const hy = highlightRect.j0 * PIXEL_SIZE;
      const hw = highlightRect.width * PIXEL_SIZE;
      const hh = highlightRect.height * PIXEL_SIZE;
      ctx.save();
      ctx.fillStyle = "rgba(255, 214, 10, 0.2)";
      ctx.strokeStyle = "rgba(255, 214, 10, 0.9)";
      ctx.lineWidth = 2;
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeRect(hx + 0.5, hy + 0.5, hw - 1, hh - 1);
      ctx.restore();
    }

    // Selection overlay: highlight only available (non-sold) blocks, no blue over sold/reserved
    if (interactive && dragStartRef.current && dragEndRef.current) {
      const x1 = Math.min(dragStartRef.current.x, dragEndRef.current.x);
      const y1 = Math.min(dragStartRef.current.y, dragEndRef.current.y);
      const x2 = Math.max(dragStartRef.current.x, dragEndRef.current.x);
      const y2 = Math.max(dragStartRef.current.y, dragEndRef.current.y);
      // Determine inclusive block indices for selection
      let i0 = Math.floor(Math.min(x1, x2) / PIXEL_SIZE);
      let j0 = Math.floor(Math.min(y1, y2) / PIXEL_SIZE);
      let i1 = Math.ceil(Math.max(x1, x2) / PIXEL_SIZE) - 1;
      let j1 = Math.ceil(Math.max(y1, y2) / PIXEL_SIZE) - 1;
      i0 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, i0));
      j0 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, j0));
      i1 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, i1));
      j1 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, j1));

      ctx.fillStyle = "rgba(0, 212, 255, 0.2)";
      ctx.strokeStyle = "rgba(0, 212, 255, 0.9)";
      ctx.lineWidth = 1.5;

      for (let jj = j0; jj <= j1; jj++) {
        for (let ii = i0; ii <= i1; ii++) {
          const blockSold = soldGridRef.current?.[jj]?.[ii] ?? false;
          if (blockSold) continue; // do not tint reserved/bought blocks
          const bx = ii * PIXEL_SIZE;
          const by = jj * PIXEL_SIZE;
          ctx.fillRect(bx, by, PIXEL_SIZE, PIXEL_SIZE);
          ctx.strokeRect(bx + 0.5, by + 0.5, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
        }
      }
    }

    // Hover highlight (only current cell and only if available)
    if (interactive && hoveredBlockRef.current) {
      const bx = hoveredBlockRef.current.x * PIXEL_SIZE;
      const by = hoveredBlockRef.current.y * PIXEL_SIZE;
      const idxSold = soldGridRef.current?.[by / PIXEL_SIZE]?.[bx / PIXEL_SIZE] ?? false;
      if (!idxSold) {
        ctx.fillStyle = "rgba(0, 212, 255, 0.3)";
        ctx.fillRect(bx, by, PIXEL_SIZE, PIXEL_SIZE);
        ctx.strokeStyle = "rgb(0, 212, 255)";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, PIXEL_SIZE, PIXEL_SIZE);
      }
    }

    needsRedrawRef.current = false;
  }, [interactive, PIXEL_SIZE, GRID_SIZE, regions, highlightRect]);

  // Build sold grid and prefix sums, pre-render base and mask once (or on resize)
  useEffect(() => {
    const sold: boolean[][] = Array.from({ length: BLOCKS_PER_SIDE }, () => Array<boolean>(BLOCKS_PER_SIDE).fill(false));
    blocksRef.current.forEach((b) => {
      const i = b.x / PIXEL_SIZE;
      const j = b.y / PIXEL_SIZE;
      const key = `${i}:${j}`;
      const isSold = lockedBlockSet.has(key) || reservedBlockSet.has(key);
      b.sold = isSold;
      sold[j][i] = isSold;
    });
    soldGridRef.current = sold;

    const sat: number[][] = Array.from({ length: BLOCKS_PER_SIDE + 1 }, () => Array<number>(BLOCKS_PER_SIDE + 1).fill(0));
    for (let y = 1; y <= BLOCKS_PER_SIDE; y++) {
      let rowSum = 0;
      for (let x = 1; x <= BLOCKS_PER_SIDE; x++) {
        rowSum += sold[y - 1][x - 1] ? 1 : 0;
        sat[y][x] = sat[y - 1][x] + rowSum;
      }
    }
    soldSATRef.current = sat;
    needsRedrawRef.current = true;
  }, [lockedBlockSet, reservedBlockSet, PIXEL_SIZE]);

  // Pre-render base layer and available mask when size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = GRID_SIZE * scale;
    canvas.height = GRID_SIZE * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Base offscreen canvas
    const base = document.createElement("canvas");
    base.width = GRID_SIZE;
    base.height = GRID_SIZE;
    const bctx = base.getContext("2d");
    if (!bctx) return;
    // Background
    bctx.fillStyle = "hsl(217 25% 12%)";
    bctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    // Create subtle 10x10 sub-pixel grid texture
    const createBlockTexture = (isAvailable: boolean) => {
      const blockCanvas = document.createElement("canvas");
      blockCanvas.width = PIXEL_SIZE;
      blockCanvas.height = PIXEL_SIZE;
      const blockCtx = blockCanvas.getContext("2d");
      if (!blockCtx) return null;

      // Original grayish colors
      const baseColor = isAvailable ? "hsl(217 20% 25%)" : "hsl(217 32% 17%)";
      blockCtx.fillStyle = baseColor;
      blockCtx.fillRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);

      // Very subtle 10x10 grid lines - barely visible
      const cellSize = PIXEL_SIZE / SUB_PIXELS_PER_SIDE;
      blockCtx.strokeStyle = isAvailable 
        ? "hsla(217, 20%, 35%, 0.25)" 
        : "hsla(217, 25%, 22%, 0.2)";
      blockCtx.lineWidth = 0.15;
      
      for (let i = 1; i < SUB_PIXELS_PER_SIDE; i++) {
        const pos = i * cellSize;
        blockCtx.beginPath();
        blockCtx.moveTo(pos, 0);
        blockCtx.lineTo(pos, PIXEL_SIZE);
        blockCtx.stroke();
        blockCtx.beginPath();
        blockCtx.moveTo(0, pos);
        blockCtx.lineTo(PIXEL_SIZE, pos);
        blockCtx.stroke();
      }

      return blockCanvas;
    };

    const availableTexture = createBlockTexture(true);
    const soldTexture = createBlockTexture(false);

    // Blocks (each block visually shows 100 subdivided pixels)
    blocksRef.current.forEach((block) => {
      const i = block.x / PIXEL_SIZE;
      const j = block.y / PIXEL_SIZE;
      const key = `${i}:${j}`;
      const sold = lockedBlockSet.has(key) || reservedBlockSet.has(key);
      block.sold = sold;
      const texture = sold ? soldTexture : availableTexture;
      if (texture) {
        bctx.drawImage(texture, block.x, block.y);
      } else {
        bctx.fillStyle = block.sold ? "hsl(217 32% 17%)" : "hsl(217 20% 25%)";
        bctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);
      }
    });
    // Single stroke pass for grid lines
    bctx.strokeStyle = "hsl(217 32% 15%)";
    bctx.lineWidth = 0.5;
    for (let i = 0; i <= BLOCKS_PER_SIDE; i++) {
      const pos = i * PIXEL_SIZE;
      bctx.beginPath();
      bctx.moveTo(0, pos);
      bctx.lineTo(GRID_SIZE, pos);
      bctx.stroke();
      bctx.beginPath();
      bctx.moveTo(pos, 0);
      bctx.lineTo(pos, GRID_SIZE);
      bctx.stroke();
    }

    // Create ImageBitmap for fast draw
    if ("createImageBitmap" in window) {
      createImageBitmap(base).then((bmp) => {
        baseBitmapRef.current = bmp;
        needsRedrawRef.current = true;
        requestAnimationFrame(drawFrame);
      });
    } else {
      // Fallback: use canvas directly
      baseBitmapRef.current = base;
      needsRedrawRef.current = true;
      requestAnimationFrame(drawFrame);
    }
  }, [canvasSize, lockedBlockSet, reservedBlockSet, PIXEL_SIZE, SUB_PIXELS_PER_SIDE, SUB_PIXEL_SIZE, drawFrame]);

  // rAF ticker to draw frames when needed
  useEffect(() => {
    let rafId = 0;
    const loop = () => {
      if (needsRedrawRef.current) {
        drawFrame();
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [interactive, drawFrame]);

  useEffect(() => {
    needsRedrawRef.current = true;
  }, [highlightRect]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GRID_SIZE / rect.width;
    const scaleY = GRID_SIZE / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
  };

  const getSelectionSummary = (): { rect: SelectionRect; availablePixels: number } | null => {
    if (!dragStartRef.current || !dragEndRef.current) return null;
    let i0 = Math.floor(Math.min(dragStartRef.current.x, dragEndRef.current.x) / PIXEL_SIZE);
    let j0 = Math.floor(Math.min(dragStartRef.current.y, dragEndRef.current.y) / PIXEL_SIZE);
    let i1 = Math.ceil(Math.max(dragStartRef.current.x, dragEndRef.current.x) / PIXEL_SIZE) - 1;
    let j1 = Math.ceil(Math.max(dragStartRef.current.y, dragEndRef.current.y) / PIXEL_SIZE) - 1;
    i0 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, i0));
    j0 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, j0));
    i1 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, i1));
    j1 = Math.max(0, Math.min(BLOCKS_PER_SIDE - 1, j1));
    if (i1 < i0 || j1 < j0) return null;

    const width = i1 - i0 + 1;
    const height = j1 - j0 + 1;
    if (width <= 0 || height <= 0) return null;

    const sat = soldSATRef.current;
    let hasConflicts = false;
    if (sat) {
      const A = sat[j0][i0];
      const B = sat[j0][i1 + 1];
      const C = sat[j1 + 1][i0];
      const D = sat[j1 + 1][i1 + 1];
      const soldBlocks = D - B - C + A;
      hasConflicts = soldBlocks > 0;
    } else {
      for (let jj = j0; jj <= j1 && !hasConflicts; jj++) {
        for (let ii = i0; ii <= i1; ii++) {
          const key = `${ii}:${jj}`;
          if (lockedBlockSet.has(key) || reservedBlockSet.has(key)) {
            hasConflicts = true;
            break;
          }
        }
      }
    }
    if (hasConflicts) return null;

    const rect = buildSelectionRect(i0, j0, i1, j1);
    const availablePixels = rect.blockCount * PIXELS_PER_BLOCK;
    return {
      rect,
      availablePixels,
    };
  };

  const updateSelectionCount = () => {
    const summary = getSelectionSummary();
    onSelectionChange?.(summary?.availablePixels ?? 0);
    onSelectionRectChange?.(summary?.rect ?? null);
  };

  // Handle pointer move for hover effect and drag
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "touch") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    // Hover cell indices
    const cellX = Math.floor(coords.x / PIXEL_SIZE);
    const cellY = Math.floor(coords.y / PIXEL_SIZE);
    hoveredBlockRef.current = { x: cellX, y: cellY };
    canvas.style.cursor = "pointer";
    needsRedrawRef.current = true;

    const region = regionLookup.get(`${cellX}:${cellY}`) ?? null;
    const payload = region
      ? {
          region,
          canvasX: coords.x,
          canvasY: coords.y,
          clientX: e.clientX,
          clientY: e.clientY,
        }
      : null;
    const previousRegionId = hoveredRegionRef.current?.region.id;
    if (!payload || previousRegionId !== region?.id) {
      hoveredRegionRef.current = payload;
      onRegionHoverChange?.(payload);
    }

    if (!interactive) return;
    if (isDraggingRef.current && dragStartRef.current) {
      dragEndRef.current = { x: coords.x, y: coords.y };
      updateSelectionCount();
      needsRedrawRef.current = true;
    }
  };

  // Handle pointer leave
  const handlePointerLeave = () => {
    hoveredBlockRef.current = null;
    needsRedrawRef.current = true;
    hoveredRegionRef.current = null;
    onRegionHoverChange?.(null);
    if (!interactive) return;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  };

  // Handle pointer down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    if (e.pointerType === "touch") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;
    dragStartRef.current = { x: coords.x, y: coords.y };
    dragEndRef.current = { x: coords.x, y: coords.y };
    isDraggingRef.current = true;
    needsRedrawRef.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    if (e.pointerType === "touch") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      const summary = getSelectionSummary();
      const availablePixels = summary?.availablePixels ?? 0;
      onSelectionChange?.(availablePixels);
      onSelectionRectChange?.(summary?.rect ?? null);
      onSelectionComplete?.(summary?.rect ?? null, availablePixels);
        if (availablePixels > 0) {
          onAreaClick?.();
      }
    }
    needsRedrawRef.current = true;
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragEndRef.current = null;
    onSelectionChange?.(0);
    onSelectionRectChange?.(null);
    onSelectionComplete?.(null, 0);
    needsRedrawRef.current = true;
  };

  // Handle click on region (for non-interactive mode to navigate to links)
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (interactive) return; // Let pointer handlers deal with interactive mode
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;
    const cellX = Math.floor(coords.x / PIXEL_SIZE);
    const cellY = Math.floor(coords.y / PIXEL_SIZE);
    const region = regionLookup.get(`${cellX}:${cellY}`);
    if (region) {
      onRegionClick?.(region);
    }
  };

  const availableBlockCount = blocksRef.current.filter((b) => !b.sold).length;
  const soldBlockCount = TOTAL_BLOCK_COUNT - availableBlockCount;
  const availablePixelCount = availableBlockCount * PIXELS_PER_BLOCK;
  const soldPixelCount = soldBlockCount * PIXELS_PER_BLOCK;

  return (
    <>
      <div className="w-full mx-auto p-0">
        <div className="relative w-full border-2 border-grid-border rounded-lg overflow-hidden bg-grid-sold/50">
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              touchAction: interactive ? "none" : "manipulation",
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={interactive ? handlePointerDown : undefined}
            onPointerUp={interactive ? handlePointerUp : undefined}
            onPointerCancel={interactive ? handlePointerCancel : undefined}
            onClick={!interactive ? handleClick : undefined}
            className="transition-all duration-200"
          />
        </div>
        {showLegend && (
          <>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-grid-available border border-grid-border rounded" />
                <span className="text-muted-foreground">
                  Available ({availableBlockCount.toLocaleString()} blocks • {availablePixelCount.toLocaleString()} pixels)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-grid-sold border border-grid-border rounded" />
                <span className="text-muted-foreground">
                  Sold ({soldBlockCount.toLocaleString()} blocks • {soldPixelCount.toLocaleString()} pixels)
                </span>
              </div>
            </div>

            <p className="text-center mt-4 text-sm text-muted-foreground">
              1,000 x 1,000 pixel grid ({TOTAL_PIXEL_COUNT.toLocaleString()} pixels) • {TOTAL_BLOCK_COUNT.toLocaleString()} purchasable blocks
            </p>
          </>
        )}
      </div>
    </>
  );
};

export default PixelGrid;
