import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid, { type RegionHoverPayload } from "@/components/PixelGrid";
import SEO from "@/components/SEO";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { type PixelRegion } from "@/types/pixels";
import { X, ExternalLink } from "lucide-react";

const TOOLTIP_HIDE_DELAY = 200; // ms - grace period before hiding tooltip (desktop)
const MOBILE_POPUP_TIMEOUT = 1000; // ms - auto-close mobile popup after this time

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
  
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobilePopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Cancel mobile popup auto-close timeout
  const cancelMobilePopupTimeout = useCallback(() => {
    if (mobilePopupTimeoutRef.current) {
      clearTimeout(mobilePopupTimeoutRef.current);
      mobilePopupTimeoutRef.current = null;
    }
  }, []);
  
  // Schedule mobile popup auto-close
  const scheduleMobilePopupClose = useCallback(() => {
    cancelMobilePopupTimeout();
    mobilePopupTimeoutRef.current = setTimeout(() => {
      setMobilePopup(null);
    }, MOBILE_POPUP_TIMEOUT);
  }, [cancelMobilePopupTimeout]);

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (mobilePopupTimeoutRef.current) {
        clearTimeout(mobilePopupTimeoutRef.current);
      }
    };
  }, []);

  // Handle click on region - different behavior for mobile vs desktop
  const handleRegionClick = useCallback((region: PixelRegion) => {
    if (isMobile) {
      // Mobile: First tap shows popup (don't navigate directly)
      // Cancel any existing timeout (user tapped another image)
      cancelMobilePopupTimeout();
      
      // Auto zoom out the browser to show popup properly
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        // Store original viewport content (only if not already stored)
        if (!originalViewportRef.current) {
          originalViewportRef.current = viewportMeta.getAttribute('content');
        }
        // Set viewport to zoom out to 1.0 scale
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        // Small delay to let the viewport reset, then show popup
        setTimeout(() => {
          setMobilePopup(region);
          scheduleMobilePopupClose();
        }, 50);
      } else {
        setMobilePopup(region);
        scheduleMobilePopupClose();
      }
    } else {
      // Desktop: Navigate directly to link
      if (region.link) {
        window.open(region.link, "_blank", "noopener,noreferrer");
      }
    }
  }, [isMobile, cancelMobilePopupTimeout, scheduleMobilePopupClose]);
  
  // Store original viewport meta content to restore later
  const originalViewportRef = useRef<string | null>(null);
  
  // Close mobile popup and restore zoom capabilities
  const closeMobilePopup = useCallback(() => {
    cancelMobilePopupTimeout();
    setMobilePopup(null);
    
    // Restore viewport meta to allow zooming again
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      // Restore original or set to default that allows zooming
      const restoreContent = originalViewportRef.current || 'width=device-width, initial-scale=1.0';
      viewportMeta.setAttribute('content', restoreContent);
      originalViewportRef.current = null;
    }
  }, [cancelMobilePopupTimeout]);
  
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
          
          {/* Mobile Popup - Compact tooltip-style, auto-closes after 1 second */}
          {isMobile && mobilePopup && (
            <div 
              className="fixed inset-0 z-[100] flex items-end justify-center pb-6 pointer-events-none"
              onClick={handlePopupOverlayClick}
            >
              <div 
                className="pointer-events-auto mx-2 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
                style={{ maxWidth: 'calc(100vw - 16px)' }}
                onTouchStart={cancelMobilePopupTimeout}
                onTouchEnd={scheduleMobilePopupClose}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  {/* Company name - 1rem, grows horizontally */}
                  <span 
                    className="text-[1rem] font-medium text-foreground whitespace-nowrap"
                    style={{ fontSize: '1rem' }}
                  >
                    {mobilePopup.title}
                  </span>
                  
                  {/* Visit button */}
                  {mobilePopup.link && (
                    <button
                      onClick={handleVisitWebsite}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit
                    </button>
                  )}
                  
                  {/* Close button */}
                  <button
                    onClick={closeMobilePopup}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-muted/80 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
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
