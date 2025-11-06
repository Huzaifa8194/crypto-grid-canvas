import { useState, useRef, useEffect } from "react";
import PurchaseModal from "./PurchaseModal";
import { Button } from "./ui/button";

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
}

const PixelGrid = ({ interactive = false }: PixelGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedPixels, setSelectedPixels] = useState<string[]>([]);

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

  // Draw the grid on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution
    const scale = window.devicePixelRatio || 1;
    canvas.width = GRID_SIZE * scale;
    canvas.height = GRID_SIZE * scale;
    ctx.scale(scale, scale);

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    // Draw each block
    blocksRef.current.forEach((block) => {
      // Fill block
      if (block.sold) {
        ctx.fillStyle = "#d0d0d0"; // Light gray for sold
      } else {
        ctx.fillStyle = "#f5f5f5"; // Very light gray for available
      }
      ctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);

      // Draw border
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);

      // Highlight selected pixels in interactive mode
      if (interactive && selectedPixels.includes(block.id) && !block.sold) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.4)"; // Blue overlay
        ctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);
      }

      // Highlight hovered block in interactive mode
      if (interactive && hoveredBlock === block.id && !block.sold) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
        ctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);
      }
    });

    // Draw selection rectangle while dragging
    if (interactive && isDragging && dragStart && dragEnd) {
      const startX = Math.min(dragStart.x, dragEnd.x);
      const startY = Math.min(dragStart.y, dragEnd.y);
      const width = Math.abs(dragEnd.x - dragStart.x);
      const height = Math.abs(dragEnd.y - dragStart.y);

      ctx.strokeStyle = "rgb(59, 130, 246)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX, startY, width, height);
      ctx.setLineDash([]);
    }
  }, [hoveredBlock, interactive, isDragging, dragStart, dragEnd, selectedPixels]);

  // Convert mouse position to grid coordinates
  const getGridCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GRID_SIZE / rect.width;
    const scaleY = GRID_SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  };

  // Handle mouse move for hover and drag
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const coords = getGridCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update drag position
    if (isDragging && dragStart) {
      setDragEnd(coords);
      
      // Calculate selected blocks in real-time
      const minX = Math.min(dragStart.x, coords.x);
      const maxX = Math.max(dragStart.x, coords.x);
      const minY = Math.min(dragStart.y, coords.y);
      const maxY = Math.max(dragStart.y, coords.y);

      const selected: string[] = [];
      blocksRef.current.forEach((block) => {
        if (
          block.x >= minX &&
          block.x < maxX &&
          block.y >= minY &&
          block.y < maxY &&
          !block.sold
        ) {
          selected.push(block.id);
        }
      });
      setSelectedPixels(selected);
    } else {
      // Hover effect
      const blockX = Math.floor(coords.x / PIXEL_SIZE) * PIXEL_SIZE;
      const blockY = Math.floor(coords.y / PIXEL_SIZE) * PIXEL_SIZE;
      const blockId = `block-${blockX}-${blockY}`;

      const block = blocksRef.current.find((b) => b.id === blockId);
      if (block && !block.sold) {
        setHoveredBlock(blockId);
        canvas.style.cursor = "crosshair";
      } else {
        setHoveredBlock(null);
        canvas.style.cursor = block?.sold ? "not-allowed" : "crosshair";
      }
    }
  };

  // Handle mouse down (start drag)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const coords = getGridCoords(e);
    if (!coords) return;

    setIsDragging(true);
    setDragStart(coords);
    setDragEnd(coords);
    setSelectedPixels([]);
  };

  // Handle mouse up (end drag)
  const handleMouseUp = () => {
    if (!interactive) return;

    setIsDragging(false);
    
    // If we have selected pixels, you can optionally auto-open the modal
    // or wait for the user to click the "Buy Selected Pixels" button
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredBlock(null);
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Handle buy button click
  const handleBuyClick = () => {
    if (selectedPixels.length >= 10) {
      setModalOpen(true);
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedPixels([]);
    setDragStart(null);
    setDragEnd(null);
  };

  const totalPixels = selectedPixels.length * PIXEL_SIZE * PIXEL_SIZE;
  const totalPrice = totalPixels;

  return (
    <>
      <div className="w-full">
        <div className="relative w-full border-2 border-gray-300 rounded overflow-hidden bg-white shadow-md">
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="transition-all duration-200"
          />
        </div>

        {/* Legend and Stats */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded" />
            <span className="text-gray-600">
              Available ({blocksRef.current.filter(b => !b.sold).length * PIXEL_SIZE * PIXEL_SIZE} pixels)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 border border-gray-300 rounded" />
            <span className="text-gray-600">
              Sold ({blocksRef.current.filter(b => b.sold).length * PIXEL_SIZE * PIXEL_SIZE} pixels)
            </span>
          </div>
        </div>

        {/* Interactive controls */}
        {interactive && selectedPixels.length > 0 && (
          <div className="mt-6 p-4 bg-white border-2 border-blue-400 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {totalPixels} pixels selected
                </p>
                <p className="text-sm text-gray-600">
                  Total: ${totalPrice} USD
                </p>
                {totalPixels < 100 && (
                  <p className="text-xs text-red-600 mt-1">
                    Minimum purchase: 100 pixels
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClearSelection}
                  className="text-sm"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleBuyClick}
                  disabled={totalPixels < 100}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Buy Selected Pixels
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PurchaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedPixels={totalPixels}
        totalPrice={totalPrice}
      />
    </>
  );
};

export default PixelGrid;
