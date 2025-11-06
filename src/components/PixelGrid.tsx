import { useState, useRef, useEffect } from "react";
import PurchaseModal from "./PurchaseModal";

interface PixelBlock {
  id: string;
  x: number;
  y: number;
  sold: boolean;
  logoUrl?: string;
  link?: string;
}

const PixelGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState(800);

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

    // Clear canvas
    ctx.fillStyle = "hsl(217 25% 12%)";
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    // Draw each block
    blocksRef.current.forEach((block) => {
      // Fill block
      if (block.sold) {
        ctx.fillStyle = "hsl(217 32% 17%)";
      } else {
        ctx.fillStyle = "hsl(217 20% 25%)";
      }
      ctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);

      // Draw border
      ctx.strokeStyle = "hsl(217 32% 15%)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);

      // Highlight hovered block
      if (hoveredBlock === block.id && !block.sold) {
        ctx.fillStyle = "rgba(0, 212, 255, 0.3)";
        ctx.fillRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);
        
        // Add glow effect
        ctx.strokeStyle = "rgb(0, 212, 255)";
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x, block.y, PIXEL_SIZE, PIXEL_SIZE);
      }
    });
  }, [hoveredBlock]);

  // Handle mouse move for hover effect
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GRID_SIZE / rect.width;
    const scaleY = GRID_SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find which block is being hovered
    const blockX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE;
    const blockY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE;
    const blockId = `block-${blockX}-${blockY}`;

    const block = blocksRef.current.find((b) => b.id === blockId);
    if (block && !block.sold) {
      setHoveredBlock(blockId);
      canvas.style.cursor = "pointer";
    } else {
      setHoveredBlock(null);
      canvas.style.cursor = block?.sold ? "default" : "pointer";
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredBlock(null);
  };

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GRID_SIZE / rect.width;
    const scaleY = GRID_SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find which block was clicked
    const blockX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE;
    const blockY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE;
    const blockId = `block-${blockX}-${blockY}`;

    const block = blocksRef.current.find((b) => b.id === blockId);
    if (block && !block.sold) {
      setSelectedBlock(blockId);
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="relative w-full border-2 border-grid-border rounded-lg overflow-hidden bg-grid-sold/50">
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className="transition-all duration-200"
          />
        </div>

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
      </div>

      <PurchaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        blockId={selectedBlock || ""}
      />
    </>
  );
};

export default PixelGrid;
