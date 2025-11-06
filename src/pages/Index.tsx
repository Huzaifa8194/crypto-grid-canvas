import Navigation from "@/components/Navigation";
import { useRef, useEffect } from "react";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const GRID_SIZE = 1000;
  const PIXEL_SIZE = 10;
  const BLOCKS_PER_SIDE = GRID_SIZE / PIXEL_SIZE;

  // Draw static (non-interactive) grid
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

    // Clear canvas with background
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    // Draw grid cells
    for (let i = 0; i < BLOCKS_PER_SIDE * BLOCKS_PER_SIDE; i++) {
      const x = (i % BLOCKS_PER_SIDE) * PIXEL_SIZE;
      const y = Math.floor(i / BLOCKS_PER_SIDE) * PIXEL_SIZE;
      
      // Fill with light grey
      ctx.fillStyle = "#e0e0e0";
      ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);

      // Draw border
      ctx.strokeStyle = "#d0d0d0";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Grid Section - Compact like original */}
      <div className="w-full flex justify-center py-4 px-4">
        <div className="max-w-[1000px] w-full">
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              border: "2px solid #ccc",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
