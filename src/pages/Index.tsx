import { useMemo, useState, type CSSProperties } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid, { type RegionHoverPayload } from "@/components/PixelGrid";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";

const Index = () => {
  const { lockedBlocks, regions } = usePixelMetadata();
  const { reservedRects } = useReservations();
  const [hoveredRegion, setHoveredRegion] = useState<RegionHoverPayload | null>(null);
  const tooltipStyle = useMemo<CSSProperties>(() => {
    if (!hoveredRegion) return { opacity: 0 };
    return {
      opacity: 1,
      left: hoveredRegion.clientX + 16,
      top: hoveredRegion.clientY + 16,
    };
  }, [hoveredRegion]);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="px-5 md:px-10 pt-16 md:pt-12 pb-12">
        <div className="mx-auto w-full max-w-5xl">
          <PixelGrid
            interactive={false}
            showLegend={false}
            lockedBlocks={lockedBlocks}
            reservedRects={reservedRects}
            regions={regions}
            onRegionHoverChange={setHoveredRegion}
          />
          <div
            className="pointer-events-none fixed z-50 w-[260px] rounded border border-border/80 bg-card/95 p-3 text-sm shadow-lg transition-opacity"
            style={tooltipStyle}
          >
            {hoveredRegion ? (
              <>
                <p className="text-base font-semibold text-foreground">{hoveredRegion.region.title}</p>
                {hoveredRegion.region.link && (
                  <a
                    href={hoveredRegion.region.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex text-xs text-primary underline break-all"
                  >
                    {hoveredRegion.region.link}
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Hover over any placement to preview its metadata.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
