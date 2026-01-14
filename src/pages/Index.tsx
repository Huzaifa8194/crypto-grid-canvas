import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid, { type RegionHoverPayload } from "@/components/PixelGrid";
import SEO from "@/components/SEO";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { type PixelRegion } from "@/types/pixels";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLTIP_HIDE_DELAY = 200; // ms - grace period before hiding tooltip

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
  
  // Mobile-specific: popup state (shown on tap)
  const [mobilePopup, setMobilePopup] = useState<PixelRegion | null>(null);
  
  // Zoom level detection for mobile popup scaling
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Store original viewport meta content to restore later
  const originalViewportRef = useRef<string | null>(null);
  
  // Detect zoom level on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const detectZoom = () => {
      // Use visual viewport if available (more accurate for pinch-zoom)
      if (window.visualViewport) {
        const scale = window.visualViewport.scale;
        setZoomLevel(scale);
      } else {
        // Fallback: use window.devicePixelRatio changes or outerWidth comparison
        const zoom = window.outerWidth / window.innerWidth;
        setZoomLevel(Math.max(1, zoom));
      }
    };
    
    detectZoom();
    
    // Listen for viewport changes (zoom, resize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", detectZoom);
      window.visualViewport.addEventListener("scroll", detectZoom);
    }
    window.addEventListener("resize", detectZoom);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", detectZoom);
        window.visualViewport.removeEventListener("scroll", detectZoom);
      }
      window.removeEventListener("resize", detectZoom);
    };
  }, [isMobile]);

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

  // Handle click on region - different behavior for mobile vs desktop
  const handleRegionClick = useCallback((region: PixelRegion) => {
    if (isMobile) {
      // Mobile: First tap shows popup (don't navigate directly)
      // Auto zoom out the browser to show popup properly
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        // Store original viewport content
        originalViewportRef.current = viewportMeta.getAttribute('content');
        // Set viewport to zoom out to 1.0 scale
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        // Small delay to let the viewport reset, then show popup
        setTimeout(() => {
          setMobilePopup(region);
        }, 50);
      } else {
        setMobilePopup(region);
      }
    } else {
      // Desktop: Navigate directly to link
      if (region.link) {
        window.open(region.link, "_blank", "noopener,noreferrer");
      }
    }
  }, [isMobile]);
  
  // Close mobile popup and restore zoom capabilities
  const closeMobilePopup = useCallback(() => {
    setMobilePopup(null);
    
    // Restore viewport meta to allow zooming again
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      // Restore original or set to default that allows zooming
      const restoreContent = originalViewportRef.current || 'width=device-width, initial-scale=1.0';
      viewportMeta.setAttribute('content', restoreContent);
      originalViewportRef.current = null;
    }
  }, []);
  
  // Handle visit website from mobile popup (second tap)
  const handleVisitWebsite = useCallback(() => {
    if (mobilePopup?.link) {
      window.open(mobilePopup.link, "_blank", "noopener,noreferrer");
    }
    closeMobilePopup();
  }, [mobilePopup, closeMobilePopup]);
  
  // Close popup when clicking outside
  const handlePopupOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeMobilePopup();
    }
  }, [closeMobilePopup]);
  
  // Calculate mobile popup size based on zoom level
  const mobilePopupScale = useMemo(() => {
    // Scale the popup inversely to the zoom so it appears consistent
    // When zoomed in, make the popup smaller to fit; when zoomed out, make it larger
    return Math.min(1.5, Math.max(0.7, 1 / zoomLevel));
  }, [zoomLevel]);

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
            onRegionClick={handleRegionClick}
          />
          <p className="text-center mt-2 text-[10px] text-muted-foreground/70">
            {isMobile ? "Tap on a logo to see details" : "Hover over logos to see details • Click to visit"}
          </p>
          <div
            ref={tooltipRef}
            className={`fixed z-50 max-w-[280px] rounded-md border border-border/80 bg-card/95 backdrop-blur-sm px-2 py-1.5 shadow-xl transition-opacity duration-150 ${
              isTooltipActive ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={tooltipStyle}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {lockedTooltip ? (
              <div className="space-y-0.5">
                <p className="text-[10px] font-medium text-foreground leading-tight text-left whitespace-nowrap overflow-hidden text-ellipsis">
                  {lockedTooltip.region.title}
                </p>
                {lockedTooltip.region.link && (
                  <a
                    href={lockedTooltip.region.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[9px] text-primary hover:text-primary/80 underline underline-offset-2 transition-colors text-left whitespace-nowrap overflow-hidden text-ellipsis"
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
              <p className="text-[9px] text-muted-foreground">Hover over any placement to preview.</p>
            )}
          </div>
          
          {/* Mobile Popup - Shows on first tap, with visit button for second action */}
          {isMobile && mobilePopup && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={handlePopupOverlayClick}
            >
              <div 
                className="relative mx-4 max-w-sm w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                  transform: `scale(${mobilePopupScale})`,
                  transformOrigin: "center center",
                }}
              >
                {/* Close button */}
                <button
                  onClick={closeMobilePopup}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/80 hover:bg-muted transition-colors z-10"
                  aria-label="Close popup"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                
                {/* Content */}
                <div className="p-5 pt-6">
                  {/* Logo/Image preview if available */}
                  {(mobilePopup.imageDataUrl || mobilePopup.imageUrl) && (
                    <div className="w-full h-24 mb-4 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                      <img 
                        src={mobilePopup.imageDataUrl || mobilePopup.imageUrl} 
                        alt={mobilePopup.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 pr-8">
                    {mobilePopup.title}
                  </h3>
                  
                  {/* Website link display */}
                  {mobilePopup.link && (
                    <p className="text-xs text-muted-foreground/70 mb-4 truncate">
                      {(() => {
                        try {
                          return new URL(mobilePopup.link).hostname;
                        } catch {
                          return mobilePopup.link;
                        }
                      })()}
                    </p>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {mobilePopup.link && (
                      <Button 
                        onClick={handleVisitWebsite}
                        className="flex-1 gap-2"
                        size="lg"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit Website
                      </Button>
                    )}
                    <Button 
                      onClick={closeMobilePopup}
                      variant="outline"
                      size="lg"
                      className={mobilePopup.link ? "" : "flex-1"}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
