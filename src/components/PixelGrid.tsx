import { useState, useRef, useEffect } from "react";

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
  onAreaClick?: () => void;
}

const PixelGrid = ({
  interactive = true,
  showLegend = true,
  onSelectionChange,
  onAreaClick,
}: PixelGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState(800);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredBlockRef = useRef<{ x: number; y: number } | null>(null);
  const needsRedrawRef = useRef(true);
  const baseBitmapRef = useRef<ImageBitmap | null>(null);
  const availableMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const soldGridRef = useRef<boolean[][] | null>(null);
  const soldSATRef = useRef<number[][] | null>(null);

  // Full 1000x1000 pixel grid
  const GRID_SIZE = 1000;
  const PIXEL_SIZE = 10; // Each "block" is 10x10 pixels for easier interaction
  const BLOCKS_PER_SIDE = GRID_SIZE / PIXEL_SIZE; // 100x100 blocks of 10x10 pixels each

  // Generate pixel blocks (100x100 = 10,000 blocks)
  const blocksRef = useRef<PixelBlock[]>(
    Array.from({ length: BLOCKS_PER_SIDE * BLOCKS_PER_SIDE }, (_, i) => {
      const x = (i % BLOCKS_PER_SIDE) * PIXEL_SIZE;
      const y = Math.floor(i / BLOCKS_PER_SIDE) * PIXEL_SIZE;
      return {
        id: `block-${x}-${y}`,
        x,
        y,
        sold: Math.random() > 0.7, // 30% sold for demo
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

  // Build sold grid and prefix sums, pre-render base and mask once (or on resize)
  useEffect(() => {
    // Build sold grid 100x100
    const sold: boolean[][] = Array.from({ length: BLOCKS_PER_SIDE }, () => Array<boolean>(BLOCKS_PER_SIDE).fill(false));
    blocksRef.current.forEach((b) => {
      const i = b.x / PIXEL_SIZE; // 0..99
      const j = b.y / PIXEL_SIZE; // 0..99
      sold[j][i] = b.sold;
    });
    soldGridRef.current = sold;

    // Prefix sum (SAT) over sold for O(1) rectangle sum
    const sat: number[][] = Array.from({ length: BLOCKS_PER_SIDE + 1 }, () => Array<number>(BLOCKS_PER_SIDE + 1).fill(0));
    for (let y = 1; y <= BLOCKS_PER_SIDE; y++) {
      let rowSum = 0;
      for (let x = 1; x <= BLOCKS_PER_SIDE; x++) {
        rowSum += sold[y - 1][x - 1] ? 1 : 0;
        sat[y][x] = sat[y - 1][x] + rowSum;
      }
    }
    soldSATRef.current = sat;
  }, []);

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
    // Blocks and borders
    blocksRef.current.forEach((block) => {
      bctx.fillStyle = block.sold ? "hsl(217 32% 17%)" : "hsl(217 20% 25%)";
      bctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);
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

    // Available mask (white where available)
    const mask = document.createElement("canvas");
    mask.width = GRID_SIZE;
    mask.height = GRID_SIZE;
    const mctx = mask.getContext("2d");
    if (!mctx) return;
    mctx.fillStyle = "#fff";
    blocksRef.current.forEach((block) => {
      if (!block.sold) {
        mctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);
      }
    });
    availableMaskCanvasRef.current = mask;

    // Create ImageBitmap for fast draw
    if ("createImageBitmap" in window) {
      createImageBitmap(base).then((bmp) => {
        baseBitmapRef.current = bmp;
        needsRedrawRef.current = true;
        requestAnimationFrame(drawFrame);
      });
    } else {
      // Fallback: use canvas directly
      baseBitmapRef.current = null;
      (overlayCanvasRef.current as any) = base; // not used directly; we'll draw base via drawImage(base)
      needsRedrawRef.current = true;
      requestAnimationFrame(drawFrame);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  // Global rAF-driven draw loop
  const drawFrame = () => {
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

    // Selection overlay using mask
    if (interactive && dragStartRef.current && dragEndRef.current) {
      const x1 = Math.min(dragStartRef.current.x, dragEndRef.current.x);
      const y1 = Math.min(dragStartRef.current.y, dragEndRef.current.y);
      const x2 = Math.max(dragStartRef.current.x, dragEndRef.current.x);
      const y2 = Math.max(dragStartRef.current.y, dragEndRef.current.y);
      const sel = {
        x: Math.floor(x1 / PIXEL_SIZE) * PIXEL_SIZE,
        y: Math.floor(y1 / PIXEL_SIZE) * PIXEL_SIZE,
        w: Math.ceil((x2 - x1) / PIXEL_SIZE) * PIXEL_SIZE,
        h: Math.ceil((y2 - y1) / PIXEL_SIZE) * PIXEL_SIZE,
      };

      const overlay = overlayCanvasRef.current || document.createElement("canvas");
      overlay.width = GRID_SIZE;
      overlay.height = GRID_SIZE;
      const octx = overlay.getContext("2d");
      if (octx) {
        octx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
        octx.fillStyle = "rgba(0, 212, 255, 0.2)";
        octx.fillRect(sel.x, sel.y, sel.w, sel.h);
        // mask to available
        if (availableMaskCanvasRef.current) {
          octx.globalCompositeOperation = "destination-in";
          octx.drawImage(availableMaskCanvasRef.current, 0, 0);
          octx.globalCompositeOperation = "source-over";
        }
        // outline
        octx.strokeStyle = "rgba(0, 212, 255, 0.9)";
        octx.lineWidth = 2;
        octx.strokeRect(sel.x, sel.y, sel.w, sel.h);
        overlayCanvasRef.current = overlay;
        ctx.drawImage(overlay, 0, 0);
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
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // Handle mouse move for hover effect
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GRID_SIZE / rect.width;
    const scaleY = GRID_SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Hover cell indices
    const cellX = Math.floor(x / PIXEL_SIZE);
    const cellY = Math.floor(y / PIXEL_SIZE);
    hoveredBlockRef.current = { x: cellX, y: cellY };
    canvas.style.cursor = "pointer";
    needsRedrawRef.current = true;

    if (!interactive) return;
    if (isDraggingRef.current && dragStartRef.current) {
      dragEndRef.current = { x, y };
      // update count via SAT
      const i0 = Math.min(Math.floor(dragStartRef.current.x / PIXEL_SIZE), Math.floor(dragEndRef.current.x / PIXEL_SIZE));
      const j0 = Math.min(Math.floor(dragStartRef.current.y / PIXEL_SIZE), Math.floor(dragEndRef.current.y / PIXEL_SIZE));
      const i1 = Math.max(Math.floor(dragStartRef.current.x / PIXEL_SIZE), Math.floor(dragEndRef.current.x / PIXEL_SIZE));
      const j1 = Math.max(Math.floor(dragStartRef.current.y / PIXEL_SIZE), Math.floor(dragEndRef.current.y / PIXEL_SIZE));
      const width = i1 - i0 + 1;
      const height = j1 - j0 + 1;
      const totalBlocks = width * height;
      const sat = soldSATRef.current;
      let soldBlocks = 0;
      if (sat) {
        // SAT indices are +1
        const A = sat[j0][i0];
        const B = sat[j0][i1 + 1];
        const C = sat[j1 + 1][i0];
        const D = sat[j1 + 1][i1 + 1];
        soldBlocks = D - B - C + A;
      }
      const availableBlocks = Math.max(0, totalBlocks - soldBlocks);
      const pixels = availableBlocks * (PIXEL_SIZE * PIXEL_SIZE);
      onSelectionChange?.(pixels);
      needsRedrawRef.current = true;
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    hoveredBlockRef.current = null as any;
    needsRedrawRef.current = true;
    if (!interactive) return;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  };

  // Handle click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GRID_SIZE / rect.width;
    const scaleY = GRID_SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    dragStartRef.current = { x, y };
    dragEndRef.current = { x, y };
    isDraggingRef.current = true;
    needsRedrawRef.current = true;
  };

  const handleMouseUp = () => {
    if (!interactive) return;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      // Determine selected available pixels using SAT
      if (dragStartRef.current && dragEndRef.current) {
        const i0 = Math.min(Math.floor(dragStartRef.current.x / PIXEL_SIZE), Math.floor(dragEndRef.current.x / PIXEL_SIZE));
        const j0 = Math.min(Math.floor(dragStartRef.current.y / PIXEL_SIZE), Math.floor(dragEndRef.current.y / PIXEL_SIZE));
        const i1 = Math.max(Math.floor(dragStartRef.current.x / PIXEL_SIZE), Math.floor(dragEndRef.current.x / PIXEL_SIZE));
        const j1 = Math.max(Math.floor(dragStartRef.current.y / PIXEL_SIZE), Math.floor(dragEndRef.current.y / PIXEL_SIZE));
        const width = i1 - i0 + 1;
        const height = j1 - j0 + 1;
        const totalBlocks = width * height;
        const sat = soldSATRef.current;
        let soldBlocks = 0;
        if (sat) {
          const A = sat[j0][i0];
          const B = sat[j0][i1 + 1];
          const C = sat[j1 + 1][i0];
          const D = sat[j1 + 1][i1 + 1];
          soldBlocks = D - B - C + A;
        }
        const availableBlocks = Math.max(0, totalBlocks - soldBlocks);
        const pixels = availableBlocks * (PIXEL_SIZE * PIXEL_SIZE);
        if (pixels > 0) onAreaClick?.();
      }
    }
    needsRedrawRef.current = true;
  };

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
            }}
            onMouseMove={interactive ? handleMouseMove : undefined}
            onMouseLeave={interactive ? handleMouseLeave : undefined}
            onMouseDown={interactive ? handleMouseDown : undefined}
            onMouseUp={interactive ? handleMouseUp : undefined}
            className="transition-all duration-200"
          />
        </div>
        {showLegend && (
          <>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-grid-available border border-grid-border rounded" />
                <span className="text-muted-foreground">Available ({blocksRef.current.filter(b => !b.sold).length.toLocaleString()} pixels)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-grid-sold border border-grid-border rounded" />
                <span className="text-muted-foreground">Sold ({blocksRef.current.filter(b => b.sold).length.toLocaleString()} pixels)</span>
              </div>
            </div>

            <p className="text-center mt-4 text-sm text-muted-foreground">
              1,000 × 1,000 pixel grid • {BLOCKS_PER_SIDE * BLOCKS_PER_SIDE} purchasable blocks
            </p>
          </>
        )}
      </div>
    </>
  );
};

export default PixelGrid;
