import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { validatePromoCode } from "@/lib/promo";
import { toast } from "sonner";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";
import { type SelectionRect } from "@/types/pixels";
import { submitBuyRequest } from "@/lib/buyRequests";

const PIXELS_PER_BLOCK = 100;
const BLOCKS_PER_SIDE = 100;
const SUB_PIXELS_PER_SIDE = Math.round(Math.sqrt(PIXELS_PER_BLOCK)); // 10
const displayPixelSize = Math.sqrt(PIXELS_PER_BLOCK);
const baseExportScale = 2;
const exportPixelSize = displayPixelSize * baseExportScale;

const Buy = () => {
  const [selectedPixels, setSelectedPixels] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const blockDimensionGuide = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const size = index + 1;
        return {
          size,
          label: `${size} x ${size}`,
          pixelDimensions: `${size * exportPixelSize}px × ${size * exportPixelSize}px`,
          totalPixels: (size * size * PIXELS_PER_BLOCK).toLocaleString(),
        };
      }),
    []
  );
  const exampleBlockGuide = { width: 4, height: 8 };
  const exampleWidthPx = exampleBlockGuide.width * exportPixelSize;
  const exampleHeightPx = exampleBlockGuide.height * exportPixelSize;

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    logoUrl: "",
    targetUrl: "",
    logoFile: null as File | null,
    telegram: "",
  });

  const selectedBlocks = useMemo(() => {
    if (selectionRect) {
      return selectionRect.blockCount;
    }
    return Math.floor(selectedPixels / PIXELS_PER_BLOCK);
  }, [selectionRect, selectedPixels]);
  const pixelsTowardsNextBlock = selectedPixels % PIXELS_PER_BLOCK;
  const pixelsNeededForFirstBlock = Math.max(0, PIXELS_PER_BLOCK - selectedPixels);
  const pixelsNeededForNextBlock =
    selectedBlocks > 0 && pixelsTowardsNextBlock !== 0 ? PIXELS_PER_BLOCK - pixelsTowardsNextBlock : PIXELS_PER_BLOCK;

  const { lockedBlocks, regions } = usePixelMetadata();
  const { reservedRects, addPendingReservation } = useReservations();

  // Pricing: 1 Block = 100 Pixels = 100 USD
  const subtotal = useMemo(() => selectedBlocks * 100, [selectedBlocks]);
  const discountAmount = useMemo(() => Math.round((subtotal * discountPercent) / 100), [subtotal, discountPercent]);
  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const onApplyPromo = () => {
    const result = validatePromoCode(promoInput.trim());
    if (!result.valid) {
      setAppliedCode(null);
      setDiscountPercent(0);
      return;
    }
    setAppliedCode(result.code);
    setDiscountPercent(result.percent);
  };

  const openForm = () => {
    setFormOpen(true);
    setSubmissionSuccess(false);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSubmissionSuccess(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBlocks < 1) {
      toast.error("Minimum purchase is 1 block (100 pixels)");
      return;
    }
    if (!selectionRect) {
      toast.error("Please select an available area on the grid before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await submitBuyRequest({
        companyName: formData.companyName.trim(),
        email: formData.email.trim(),
        telegram: formData.telegram.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
        targetUrl: formData.targetUrl.trim() || undefined,
        promoCode: appliedCode,
        selectionRect,
        selectedPixels,
        selectedBlocks,
        file: formData.logoFile,
      });
      addPendingReservation(selectionRect);
      toast.success("Thank you for your application! Our team will review it within 24 hours and contact you with next steps.");
      toast.info("Your selected area is now temporarily reserved while we review.");
      setSubmissionSuccess(true);
      setFormData({ companyName: "", email: "", logoUrl: "", targetUrl: "", logoFile: null, telegram: "" });
      setPromoInput("");
      setAppliedCode(null);
      setDiscountPercent(0);
      setSelectedPixels(0);
      setSelectionRect(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Buy Pixels"
        description="Secure your block on The Million Dollar Crypto Page. Select pixels, upload your logo, and claim your permanent spot in Web3 history. $1 per pixel, 100 pixels per block."
        url="/buy"
        keywords="buy pixels, crypto advertising, blockchain marketing, pixel purchase, web3 ads"
      />
      <Navigation />
      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto mb-4 w-full max-w-3xl">
            <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card/40 p-3 text-left hover:bg-card/60 transition-colors">
                <h2 className="text-lg font-semibold">How It Works</h2>
                {howItWorksOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-3">
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    <span><strong className="text-foreground">Select Your Block(s):</strong> Click and drag on the grid to choose your pixel space. The price updates in real-time.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    <span><strong className="text-foreground">Submit the Form:</strong> Fill out the simple form with your company details.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    <span><strong className="text-foreground">Get Approved & Pay:</strong> We'll review and email you within 24 hours. If approved, you'll receive a simple invoice with secure USDT payment instructions.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">4.</span>
                    <span><strong className="text-foreground">Go Live:</strong> Once payment is confirmed, we will activate your logo and link on the grid.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">5.</span>
                    <span><strong className="text-foreground">Become Part of History:</strong> Your project is now a permanent part of the 2026 crypto snapshot.</span>
                  </li>
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="mx-auto mb-6 w-full max-w-3xl rounded-lg border border-border bg-card/40 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Pixels Selected</div>
                <div className="text-xl font-semibold">{selectedPixels.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Blocks (100 px)</div>
                <div className="text-xl font-semibold">{selectedBlocks.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Selection</div>
                <div className="text-xl font-semibold">{selectionRect ? `${selectionRect.width}x${selectionRect.height}` : "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Subtotal</div>
                <div className="text-xl font-semibold">${subtotal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">${total.toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>1 Block = 100 Pixels = 100 USD</p>
                {selectedBlocks < 1 ? (
                  <p className="text-amber-400">
                    Select {pixelsNeededForFirstBlock.toLocaleString()} more pixels to unlock your first block (minimum purchase).
                  </p>
                ) : pixelsTowardsNextBlock > 0 ? (
                  <p className="text-muted-foreground">
                    {pixelsNeededForNextBlock.toLocaleString()} more pixels will add another full block.
                  </p>
                ) : (
                  <p className="text-emerald-400">Great! You have {selectedBlocks.toLocaleString()} block(s) ready to purchase.</p>
                )}
              </div>
              <Button type="button" className="sm:justify-self-end" disabled={selectedBlocks < 1} onClick={openForm}>
                Open Purchase Form
              </Button>
            </div>
          </div>

          <PixelGrid
            interactive
            showLegend
            lockedBlocks={lockedBlocks}
            reservedRects={reservedRects}
            regions={regions}
            onSelectionChange={setSelectedPixels}
            onSelectionComplete={(rect, pixels) => {
              setSelectionRect(rect);
              setSelectedPixels(pixels);
            }}
          />
        </div>
      </main>

      <Dialog open={formOpen} onOpenChange={closeForm}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{submissionSuccess ? "Application Submitted" : "Purchase Pixels"}</DialogTitle>
            <DialogDescription>
              {submissionSuccess
                ? "Your application has been received and is being processed."
                : "Complete the form below and our team will review your placement within 24 hours."
              }
            </DialogDescription>
          </DialogHeader>
          {submissionSuccess ? (
            <div className="space-y-4 py-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Thank you for your submission.</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your application will be manually reviewed. You will receive an email from{" "}
                    <span className="font-medium text-primary">hello@themilliondollarcryptopage.com</span>{" "}
                    within 24 hours.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If approved, your email will contain secure USDT payment instructions to complete your purchase and secure your block.
                  </p>
                </div>
                <Button onClick={closeForm} className="mt-6">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input id="company" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (Optional)</Label>
              <Input
                id="telegram"
                placeholder="@username or https://t.me/username"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Target Website URL</Label>
              <Input id="url" placeholder="https://example.com or any link" value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-section">Logo/Image</Label>
                <p className="text-xs text-muted-foreground">
                  You must provide either a logo URL or upload an image file. We recommend square images for best display.
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="logo" className="text-xs text-muted-foreground">Logo/Image URL (paste link)</Label>
                    <Input id="logo" type="url" placeholder="https://..." value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoFile" className="text-xs text-muted-foreground">Or upload image file</Label>
                    <Input
                      id="logoFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, logoFile: e.target.files?.[0] ?? null })}
                    />
                  </div>
                </div>
              </div>

              <Collapsible open={dimensionsOpen} onOpenChange={setDimensionsOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-left text-sm hover:bg-secondary/60 transition-colors">
                  <span className="font-medium">Image Dimensions Guide</span>
                  <span className="text-xs text-muted-foreground">
                    {dimensionsOpen ? "Click to collapse" : "Click for size specs"}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <p className="text-xs text-muted-foreground">
                    Each grid block renders at {displayPixelSize.toFixed(1)}px × {displayPixelSize.toFixed(1)}px ({PIXELS_PER_BLOCK.toLocaleString()} pixels), but for crisp display we use 2× exports. Use the table below for perfectly sized assets.
                  </p>
                  <div className="overflow-x-auto rounded border border-border/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-background/60 text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1 font-semibold uppercase tracking-[0.2em]">Blocks</th>
                          <th className="px-2 py-1 font-semibold uppercase tracking-[0.2em]">Pixel Size</th>
                          <th className="px-2 py-1 font-semibold uppercase tracking-[0.2em]">Total Pixels</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockDimensionGuide.slice(0, 5).map((entry) => (
                          <tr key={entry.label} className="odd:bg-background/40">
                            <td className="px-2 py-1 font-semibold text-foreground">{entry.label}</td>
                            <td className="px-2 py-1">{entry.pixelDimensions}</td>
                            <td className="px-2 py-1">{entry.totalPixels}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For rectangles, multiply width × height (in blocks) by {exportPixelSize}px. Example: a {exampleBlockGuide.width} × {exampleBlockGuide.height} block area needs {exampleWidthPx}px × {exampleHeightPx}px.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-modal">Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  id="promo-modal"
                  placeholder="Enter code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={onApplyPromo}>Apply</Button>
              </div>
              {appliedCode ? (
                <p className="text-xs text-emerald-400">Applied {appliedCode} ({discountPercent}% off)</p>
              ) : promoInput ? (
                <p className="text-xs text-red-400">Invalid or expired code</p>
              ) : null}
            </div>

            <div className="rounded-md border border-border p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Selected Blocks</div>
                <div className="text-right font-semibold">{selectedBlocks.toLocaleString()}</div>
                <div className="text-muted-foreground">Selected Pixels</div>
                <div className="text-right">{selectedPixels.toLocaleString()}</div>
                <div className="text-muted-foreground">Subtotal</div>
                <div className="text-right">${subtotal.toLocaleString()}</div>
                <div className="text-muted-foreground">Promo {appliedCode ? `(${appliedCode})` : ""}</div>
                <div className="text-right">-{discountAmount.toLocaleString()}</div>
                <div className="text-muted-foreground">Total</div>
                <div className="text-right font-semibold">${total.toLocaleString()}</div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || selectedBlocks < 1}>
              {submitting ? "Submitting..." : "Submit Purchase Request"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Your application will be manually reviewed. You will receive an email from{" "}
              <span className="font-medium text-primary">hello@themilliondollarcryptopage.com</span>{" "}
              within 24 hours.
              <br />
              If approved, your email will contain secure USDT payment instructions to complete your purchase and secure your block.
            </p>
          </form>
          )}
        </DialogContent>
      </Dialog>

      <footer className="py-1.5 px-3 text-center border-t border-border/50">
        <p className="text-[0.5rem] sm:text-[0.55rem] text-muted-foreground/70 whitespace-nowrap overflow-hidden text-ellipsis">
          The Million Dollar Crypto Page © 2026. All rights reserved. Logos displayed are property of their respective owners. We are not responsible for content on external linked sites.
        </p>
      </footer>
    </div>
  );
};

export default Buy;


