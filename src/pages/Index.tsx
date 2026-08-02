import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PixelGrid, { type RegionHoverPayload } from "@/components/PixelGrid";
import SEO from "@/components/SEO";
import ZoomableContainer from "@/components/ZoomableContainer";
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

  // Hide tooltip on scroll (mobile and desktop)
  useEffect(() => {
    const handleScroll = () => {
      if (lockedTooltip) {
        cancelHideTimeout();
        setLockedTooltip(null);
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lockedTooltip, cancelHideTimeout]);

  // Hide tooltip when clicking/tapping anywhere outside the tooltip
  useEffect(() => {
    if (!lockedTooltip) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        cancelHideTimeout();
        setLockedTooltip(null);
      }
    };

    const timeoutId = setTimeout(() => {
      window.addEventListener("pointerdown", handleOutsideClick, { passive: true });
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [lockedTooltip, cancelHideTimeout]);

  // Handle click on region - different behavior for mobile vs desktop
  const handleRegionClick = useCallback((region: PixelRegion) => {
    if (isMobile) {
      // Mobile: Tap/hold shows tooltip (handled by onRegionHoverChange)
      return;
    }
    // Desktop: Navigate directly to link
    if (region.link) {
      window.open(region.link, "_blank", "noopener,noreferrer");
    }
  }, [isMobile]);
  
  // Handle click on tooltip - opens the link
  const handleTooltipClick = useCallback(() => {
    if (lockedTooltip?.region.link) {
      window.open(lockedTooltip.region.link, "_blank", "noopener,noreferrer");
      cancelHideTimeout();
      setLockedTooltip(null);
    }
  }, [lockedTooltip, cancelHideTimeout]);

  // Handle pan/zoom start on mobile - hide tooltip since grid position changes
  const handleZoomPanStart = useCallback(() => {
    if (lockedTooltip) {
      cancelHideTimeout();
      setLockedTooltip(null);
    }
  }, [lockedTooltip, cancelHideTimeout]);

  // Compute tooltip style - mobile smart positioning above touch point
  const tooltipStyle = useMemo<CSSProperties>(() => {
    if (!lockedTooltip) return { opacity: 0, pointerEvents: "none" as const };
    
    const isMobileViewport = isMobile || (typeof window !== "undefined" && window.innerWidth < 768);

    if (isMobileViewport) {
      const margin = 12;
      const windowWidth = typeof window !== "undefined" ? window.innerWidth : 360;
      const windowHeight = typeof window !== "undefined" ? window.innerHeight : 640;
      const tooltipWidth = Math.min(270, windowWidth - margin * 2);
      const tooltipHeight = 44;

      // Place tooltip slightly above tap point so finger doesn't obscure it
      let y = lockedTooltip.clientY - tooltipHeight - 14;
      if (y < margin) {
        y = lockedTooltip.clientY + 24; // Place below if tap is near top edge
      }

      let x = lockedTooltip.clientX - tooltipWidth / 2;
      x = Math.max(margin, Math.min(x, windowWidth - tooltipWidth - margin));
      y = Math.max(margin, Math.min(y, windowHeight - tooltipHeight - margin));

      return {
        opacity: 1,
        left: x,
        top: y,
        width: tooltipWidth,
        pointerEvents: "auto" as const,
      };
    }

    // Desktop positioning
    const gap = 8;
    const x = lockedTooltip.clientX + gap;
    const y = lockedTooltip.clientY + gap;
    const tooltipWidth = 220;
    const margin = 12;
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const maxX = windowWidth - tooltipWidth - margin;
    const maxY = windowHeight - 40 - margin;

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
          <ZoomableContainer enabled={isMobile} minScale={1} maxScale={8} onPanStart={handleZoomPanStart}>
            <PixelGrid
              interactive={false}
              showLegend={false}
              lockedBlocks={lockedBlocks}
              reservedRects={reservedRects}
              regions={regions}
              onRegionHoverChange={handleGridHoverChange}
              onRegionClick={handleRegionClick}
            />
          </ZoomableContainer>
          <p className="text-center mt-2 text-[10px] text-muted-foreground/70">
            {isMobile ? "Pinch to zoom • Double-tap to zoom • Touch logo to view details" : "Hover over logos to see details • Click to visit"}
          </p>
          <div
            ref={tooltipRef}
            className={`fixed z-50 rounded-xl border border-primary/40 bg-card/95 backdrop-blur-md shadow-xl transition-all duration-150 p-2.5 cursor-pointer ${
              isTooltipActive ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            }`}
            style={tooltipStyle}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            onClick={handleTooltipClick}
          >
            {lockedTooltip && (
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-xs md:text-sm text-foreground truncate">
                    {lockedTooltip.region.title}
                  </span>
                  {lockedTooltip.region.link && (
                    <span className="text-[11px] md:text-xs text-primary font-medium truncate">
                      {(() => {
                        try {
                          return new URL(lockedTooltip.region.link!).hostname;
                        } catch {
                          return lockedTooltip.region.link;
                        }
                      })()}
                    </span>
                  )}
                </div>
                {lockedTooltip.region.link && (
                  <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-semibold px-2 py-1 rounded-md bg-primary text-primary-foreground shrink-0 shadow-sm active:scale-95 transition-transform">
                    Visit ↗
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
