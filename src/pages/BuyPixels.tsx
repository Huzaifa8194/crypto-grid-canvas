import Navigation from "@/components/Navigation";
import { useState, useRef, useEffect } from "react";
import PurchaseModal from "@/components/PurchaseModal";

interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const BuyPixels = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<{ x: number; y: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPixelCount, setSelectedPixelCount] = useState(0);

  const GRID_SIZE = 1000;
  const PIXEL_SIZE = 10;
  const BLOCKS_PER_SIDE = GRID_SIZE / PIXEL_SIZE;

  // Calculate selected area and price
  useEffect(() => {
    if (selection) {
      const width = Math.abs(selection.endX - selection.startX) + 1;
      const height = Math.abs(selection.endY - selection.startY) + 1;
      setSelectedPixelCount(width * height * PIXEL_SIZE * PIXEL_SIZE);
    } else {
      setSelectedPixelCount(0);
    }
  }, [selection]);

  // Draw grid with selection
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

    // Clear canvas
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    // Draw grid cells
    for (let i = 0; i < BLOCKS_PER_SIDE * BLOCKS_PER_SIDE; i++) {
      const x = (i % BLOCKS_PER_SIDE) * PIXEL_SIZE;
      const y = Math.floor(i / BLOCKS_PER_SIDE) * PIXEL_SIZE;
      const blockX = x / PIXEL_SIZE;
      const blockY = y / PIXEL_SIZE;

      // Check if this block is selected
      let isSelected = false;
      if (selection) {
        const minX = Math.min(selection.startX, selection.endX);
        const maxX = Math.max(selection.startX, selection.endX);
        const minY = Math.min(selection.startY, selection.endY);
        const maxY = Math.max(selection.startY, selection.endY);
        
        if (blockX >= minX && blockX <= maxX && blockY >= minY && blockY <= maxY) {
          isSelected = true;
        }
      }

      // Check if this block is hovered
      const isHovered = hoveredBlock && blockX === hoveredBlock.x && blockY === hoveredBlock.y;

      // Fill block
      if (isSelected) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; // Blue for selected
      } else if (isHovered) {
        ctx.fillStyle = "#d0d0d0"; // Slightly darker on hover
      } else {
        ctx.fillStyle = "#e0e0e0"; // Default grey
      }
      ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);

      // Draw border
      ctx.strokeStyle = "#d0d0d0";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    }

    // Draw selection border if exists
    if (selection) {
      const minX = Math.min(selection.startX, selection.endX) * PIXEL_SIZE;
      const maxX = Math.max(selection.startX, selection.endX) * PIXEL_SIZE + PIXEL_SIZE;
      const minY = Math.min(selection.startY, selection.endY) * PIXEL_SIZE;
      const maxY = Math.max(selection.startY, selection.endY) * PIXEL_SIZE + PIXEL_SIZE;
      
      ctx.strokeStyle = "rgb(59, 130, 246)";
      ctx.lineWidth = 3;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  }, [selection, hoveredBlock]);

  const getBlockCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GRID_SIZE / rect.width;
    const scaleY = GRID_SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const blockX = Math.floor(x / PIXEL_SIZE);
    const blockY = Math.floor(y / PIXEL_SIZE);

    return { blockX, blockY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getBlockCoordinates(e);
    if (!coords) return;

    setIsDragging(true);
    setSelection({
      startX: coords.blockX,
      startY: coords.blockY,
      endX: coords.blockX,
      endY: coords.blockY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getBlockCoordinates(e);
    if (!coords) return;

    setHoveredBlock({ x: coords.blockX, y: coords.blockY });

    if (isDragging && selection) {
      setSelection({
        ...selection,
        endX: coords.blockX,
        endY: coords.blockY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Selection remains to show what's selected
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredBlock(null);
  };

  const handleOpenModal = () => {
    if (selectedPixelCount >= 100) {
      setModalOpen(true);
    }
  };

  const handleClearSelection = () => {
    setSelection(null);
    setSelectedPixelCount(0);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="w-full flex flex-col items-center py-4 px-4">
        {/* Instructions */}
        <div className="max-w-[1000px] w-full mb-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Click and drag to select multiple blocks. Minimum purchase: 100 pixels ($100)
          </p>
          
          {/* Price Display */}
          {selectedPixelCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <div className="text-lg font-semibold text-blue-900">
                Selected: {selectedPixelCount.toLocaleString()} pixels
              </div>
              <div className="text-2xl font-bold text-blue-600">
                Total: ${selectedPixelCount.toLocaleString()} USD
              </div>
              {selectedPixelCount >= 100 ? (
                <div className="mt-3 flex gap-2 justify-center">
                  <button
                    onClick={handleOpenModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Continue to Purchase
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              ) : (
                <div className="mt-2 text-sm text-red-600">
                  Select at least {100 - selectedPixelCount} more pixels to proceed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Grid */}
        <div className="max-w-[1000px] w-full">
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              border: "2px solid #ccc",
              cursor: isDragging ? "crosshair" : "pointer",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      </div>

      <PurchaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        blockId=""
        selectedPixelCount={selectedPixelCount}
        totalPrice={selectedPixelCount}
      />
    </div>
  );
};

export default BuyPixels;

