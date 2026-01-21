import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid, { type RegionHoverPayload } from "@/components/PixelGrid";
import ZoomableGridContainer from "@/components/ZoomableGridContainer";
import SEO from "@/components/SEO";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { type PixelRegion } from "@/types/pixels";

const TOOLTIP_HIDE_DELAY = 15000; // ms - auto-hide tooltip after 15 seconds if no new tooltip opened

const Index = () => {
  const { lockedBlocks, regions } = usePixelMetadata();
  const { reservedRects } = useReservations();
  const isMobile = useIsMobile();
  
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
      // Cancel any pending hide timeout when entering a new region
      cancelHideTimeout();
      
      // Only update tooltip if hovering a DIFFERENT region (or no tooltip yet)
      // This "locks" the tooltip position so it doesn't follow the cursor
      setLockedTooltip((prev) => {
        if (!prev || prev.region.id !== payload.region.id) {
          // New region - start 5 second auto-hide timer
          scheduleHide();
          return payload; // New region - update position and content
        }
        return prev; // Same region - keep existing position
      });
    }
    // Don't hide immediately when leaving a region - let the 5 second timer run
  }, [cancelHideTimeout, scheduleHide]);

  // Handle tooltip mouse enter
  const handleTooltipMouseEnter = useCallback(() => {
    setIsOverTooltip(true);
    cancelHideTimeout();
  }, [cancelHideTimeout]);

  // Handle tooltip mouse leave
  const handleTooltipMouseLeave = useCallback(() => {
    setIsOverTooltip(false);
    // Don't hide immediately - let the 5 second timer continue
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Hide tooltip on scroll (desktop only) - tooltip position is viewport-relative
  // so it would float away from the region when scrolling
  useEffect(() => {
    if (isMobile) return; // Don't apply to mobile
    
    const handleScroll = () => {
      if (lockedTooltip) {
        cancelHideTimeout();
        setLockedTooltip(null);
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, lockedTooltip, cancelHideTimeout]);

  // Handle click on region - different behavior for mobile vs desktop
  const handleRegionClick = useCallback((region: PixelRegion) => {
    if (isMobile) {
      // Mobile: Tap/hold shows tooltip (handled by onRegionHoverChange)
      // Do nothing here - clicking on the tooltip will open the link
      return;
    }
    // Desktop: Navigate directly to link
    if (region.link) {
      window.open(region.link, "_blank", "noopener,noreferrer");
    }
  }, [isMobile]);
  
  // Handle click on tooltip - opens the link (especially for mobile)
  const handleTooltipClick = useCallback(() => {
    if (lockedTooltip?.region.link) {
      window.open(lockedTooltip.region.link, "_blank", "noopener,noreferrer");
      // Hide tooltip after clicking
      cancelHideTimeout();
      setLockedTooltip(null);
    }
  }, [lockedTooltip, cancelHideTimeout]);

  // Compute tooltip style - position slightly closer to reduce dead zone
  const tooltipStyle = useMemo<CSSProperties>(() => {
    if (!lockedTooltip) return { opacity: 0, pointerEvents: "none" as const };
    
    // Position tooltip closer to the cursor
    const gap = isMobile ? 4 : 6;
    const x = lockedTooltip.clientX + gap;
    const y = lockedTooltip.clientY + gap;
    
    // Different sizes for mobile vs desktop
    const tooltipWidth = isMobile ? 120 : 200;
    const tooltipHeight = isMobile ? 12 : 20;
    const margin = isMobile ? 4 : 8;
    const maxX = window.innerWidth - tooltipWidth - margin;
    const maxY = window.innerHeight - tooltipHeight - margin;
    
    return {
      opacity: 1,
      left: Math.min(x, maxX),
      top: Math.min(y, maxY),
      pointerEvents: "auto" as const,
    };
  }, [lockedTooltip, isMobile]);

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
          <ZoomableGridContainer
            minZoom={1}
            maxZoom={10}
            showControls={true}
          >
            <PixelGrid
              interactive={false}
              showLegend={false}
              lockedBlocks={lockedBlocks}
              reservedRects={reservedRects}
              regions={regions}
              onRegionHoverChange={handleGridHoverChange}
              onRegionClick={handleRegionClick}
            />
          </ZoomableGridContainer>
          <p className="text-center mt-2 text-[10px] text-muted-foreground/70">
            {isMobile ? "Pinch to zoom • Double-tap to magnify • Tap logos for details" : "Hover over logos to see details • Click to visit • Ctrl+scroll to zoom"}
          <div
            ref={tooltipRef}
            className={`fixed z-50 rounded border border-border/60 bg-card/95 backdrop-blur-sm shadow-md transition-opacity duration-150 ${
              isMobile ? "px-0.5 py-px cursor-pointer active:bg-card" : "px-1.5 py-0.5"
            } ${
              isTooltipActive ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={tooltipStyle}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            onClick={isMobile ? handleTooltipClick : undefined}
          >
            {lockedTooltip && (
              <div className={`flex items-center leading-none whitespace-nowrap ${
                isMobile ? "gap-1 h-[8px]" : "gap-1.5 h-[14px]"
              }`}>
                <span className={`font-medium text-foreground leading-none whitespace-nowrap ${
                  isMobile ? "text-[5px]" : "text-[9px]"
                }`}>
                  {lockedTooltip.region.title}
                </span>
                {lockedTooltip.region.link && (
                  <>
                    <span className={`text-muted-foreground/50 ${isMobile ? "text-[4px]" : "text-[7px]"}`}>•</span>
                    <span className={`text-primary/80 leading-none whitespace-nowrap ${
                      isMobile ? "text-[4px]" : "text-[8px]"
                    }`}>
                      {(() => {
                        try {
                          return new URL(lockedTooltip.region.link!).hostname;
                        } catch {
                          return lockedTooltip.region.link;
                        }
                      })()}
                    </span>
                  </>
                )}
              </div>
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
