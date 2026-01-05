import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid, { type RegionHoverPayload } from "@/components/PixelGrid";
import SEO from "@/components/SEO";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";

const TOOLTIP_HIDE_DELAY = 200; // ms - grace period before hiding tooltip

const Index = () => {
  const { lockedBlocks, regions } = usePixelMetadata();
  const { reservedRects } = useReservations();
  
  // Current hover from grid
  const [gridHover, setGridHover] = useState<RegionHoverPayload | null>(null);
  // Locked tooltip data (what's actually displayed)
  const [lockedTooltip, setLockedTooltip] = useState<RegionHoverPayload | null>(null);
  // Whether mouse is over the tooltip itself
  const [isOverTooltip, setIsOverTooltip] = useState(false);
  
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Clear any pending hide timeout
  const cancelHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Schedule tooltip hide with delay
  const scheduleHide = useCallback(() => {
    cancelHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setLockedTooltip(null);
    }, TOOLTIP_HIDE_DELAY);
  }, [cancelHideTimeout]);

  // Handle grid hover changes
  const handleGridHoverChange = useCallback((payload: RegionHoverPayload | null) => {
    setGridHover(payload);
    
    if (payload) {
      // Mouse entered a region - cancel any pending hide
      cancelHideTimeout();
      
      // Only update tooltip if hovering a DIFFERENT region (or no tooltip yet)
      // This "locks" the tooltip position so it doesn't follow the cursor
      setLockedTooltip((prev) => {
        if (!prev || prev.region.id !== payload.region.id) {
          return payload; // New region - update position and content
        }
        return prev; // Same region - keep existing position
      });
    } else {
      // Mouse left the grid - schedule hide (unless over tooltip)
      if (!isOverTooltip) {
        scheduleHide();
      }
    }
  }, [cancelHideTimeout, scheduleHide, isOverTooltip]);

  // Handle tooltip mouse enter
  const handleTooltipMouseEnter = useCallback(() => {
    setIsOverTooltip(true);
    cancelHideTimeout();
  }, [cancelHideTimeout]);

  // Handle tooltip mouse leave
  const handleTooltipMouseLeave = useCallback(() => {
    setIsOverTooltip(false);
    // Only hide if we're also not hovering the grid
    if (!gridHover) {
      scheduleHide();
    }
  }, [gridHover, scheduleHide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Compute tooltip style - position slightly closer to reduce dead zone
  const tooltipStyle = useMemo<CSSProperties>(() => {
    if (!lockedTooltip) return { opacity: 0, pointerEvents: "none" as const };
    
    // Position tooltip closer (8px instead of 16px) to reduce gap
    const x = lockedTooltip.clientX + 8;
    const y = lockedTooltip.clientY + 8;
    
    // Keep tooltip on screen
    const tooltipWidth = 200;
    const tooltipHeight = 80; // approximate
    const maxX = window.innerWidth - tooltipWidth - 12;
    const maxY = window.innerHeight - tooltipHeight - 12;
    
    return {
      opacity: 1,
      left: Math.min(x, maxX),
      top: Math.min(y, maxY),
      pointerEvents: "auto" as const,
    };
  }, [lockedTooltip]);

  // Determine if tooltip is "active" (visible and interactive)
  const isTooltipActive = Boolean(lockedTooltip);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Home"
        description="The Million Dollar Crypto Page - The definitive community-owned snapshot of the 2026 crypto ecosystem. 1,000,000 pixels at $1 each. Own your piece of Web3 history."
        url="/"
        keywords="crypto homepage, pixel grid, blockchain advertising, web3 marketing"
      />
      <Navigation />

      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl">
          <PixelGrid
            interactive={false}
            showLegend={false}
            lockedBlocks={lockedBlocks}
            reservedRects={reservedRects}
            regions={regions}
            onRegionHoverChange={handleGridHoverChange}
          />
          <div
            ref={tooltipRef}
            className={`fixed z-50 w-[200px] rounded-lg border border-border/80 bg-card/95 backdrop-blur-sm p-2 text-sm shadow-xl transition-opacity duration-150 ${
              isTooltipActive ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={tooltipStyle}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {lockedTooltip ? (
              <div className="space-y-2">
                {lockedTooltip.region.imageUrl && (
                  <div className="flex justify-center">
                    <a
                      href={lockedTooltip.region.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={lockedTooltip.region.imageUrl}
                        alt={lockedTooltip.region.title}
                        className="w-12 h-12 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </a>
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground leading-tight text-center">
                  {lockedTooltip.region.title}
                </p>
                {lockedTooltip.region.link && (
                  <a
                    href={lockedTooltip.region.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-primary hover:text-primary/80 underline underline-offset-2 break-all transition-colors text-center"
                  >
                    {(() => {
                      try {
                        return new URL(lockedTooltip.region.link!).hostname;
                      } catch {
                        return lockedTooltip.region.link;
                      }
                    })()}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Hover over any placement to preview.</p>
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
