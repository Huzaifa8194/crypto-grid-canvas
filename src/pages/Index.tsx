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
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
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

      <footer className="py-1.5 px-3 text-center border-t border-border/50">
        <p className="text-[0.5rem] sm:text-[0.55rem] text-muted-foreground/70 whitespace-nowrap overflow-hidden text-ellipsis">
          The Million Dollar Crypto Page © 2026. All rights reserved. Logos displayed are property of their respective owners. We are not responsible for content on external linked sites.
        </p>
      </footer>
    </div>
  );
};

export default Index;
