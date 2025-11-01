import { useState } from "react";
import PurchaseModal from "./PurchaseModal";

interface PixelBlock {
  id: string;
  sold: boolean;
  logoUrl?: string;
  link?: string;
}

const PixelGrid = () => {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // For demo purposes, create a 100x100 grid (10x10 blocks of 10x10 pixels each)
  // In production, this would be 1000x1000 pixels
  const gridSize = 100;
  const blocks: PixelBlock[] = Array.from({ length: gridSize }, (_, i) => ({
    id: `block-${i}`,
    sold: Math.random() > 0.7, // 30% sold for demo
    logoUrl: undefined,
  }));

  const handleBlockClick = (block: PixelBlock) => {
    if (!block.sold) {
      setSelectedBlock(block.id);
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="relative aspect-square w-full border-2 border-grid-border rounded-lg overflow-hidden bg-grid-sold/50">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${Math.sqrt(gridSize)}, minmax(0, 1fr))`,
            }}
          >
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`
                  aspect-square border border-grid-border cursor-pointer transition-all duration-200
                  ${block.sold ? "bg-grid-sold" : "bg-grid-available"}
                  ${
                    hoveredBlock === block.id && !block.sold
                      ? "glow-hover scale-105 z-10"
                      : ""
                  }
                  ${!block.sold ? "hover:brightness-125" : ""}
                `}
                onClick={() => handleBlockClick(block)}
                onMouseEnter={() => setHoveredBlock(block.id)}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                {block.logoUrl && (
                  <img
                    src={block.logoUrl}
                    alt="Block logo"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-grid-available border border-grid-border rounded" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-grid-sold border border-grid-border rounded" />
            <span className="text-muted-foreground">Sold</span>
          </div>
        </div>
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
