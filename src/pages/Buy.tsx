import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PixelGrid from "@/components/PixelGrid";
import SEO from "@/components/SEO";
import DePayPaymentButton from "@/components/DePayPaymentButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";
import { useBuyRequest } from "@/hooks/useBuyRequest";
import { type SelectionRect } from "@/types/pixels";
import { submitBuyRequest } from "@/lib/buyRequests";
import {
  clearPendingPaymentRequestId,
  getPendingPaymentRequestId,
  savePendingPaymentRequestId,
} from "@/lib/pendingPayment";
import { calculateOrderTotalUsd, formatUsd } from "@/lib/pricing";

const PIXELS_PER_BLOCK = 100;
const displayPixelSize = Math.sqrt(PIXELS_PER_BLOCK);
const baseExportScale = 2;
const exportPixelSize = displayPixelSize * baseExportScale;

const Buy = () => {
  const [selectedPixels, setSelectedPixels] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

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
    tagline: "",
    xHandle: "",
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
  const { reservedRects, addPendingReservation, deleteRequest } = useReservations();
  const { request: paymentRequest, loading: paymentRequestLoading } = useBuyRequest(submittedRequestId);

  const total = useMemo(() => calculateOrderTotalUsd(selectedBlocks), [selectedBlocks]);
  const paymentBlocks = paymentRequest?.selectedBlocks ?? selectedBlocks;
  const paymentTotal = calculateOrderTotalUsd(paymentBlocks);
  const isPaid = Boolean(paymentRequest?.paid || paymentRequest?.invoiceStatus === "paid");
  const canPay = Boolean(submittedRequestId && paymentRequest && !isPaid);
  const hasUnpaidOrder = Boolean(submittedRequestId && paymentRequest && !isPaid);

  useEffect(() => {
    const storedRequestId = getPendingPaymentRequestId();
    if (storedRequestId) {
      setSubmittedRequestId(storedRequestId);
    }
  }, []);

  useEffect(() => {
    if (isPaid) {
      clearPendingPaymentRequestId();
    }
  }, [isPaid]);

  const openPaymentModal = () => {
    setSubmissionSuccess(true);
    setFormOpen(true);
  };

  const openForm = () => {
    setSubmissionSuccess(false);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const handleCancelRequest = async () => {
    if (!submittedRequestId) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel your pixel reservation? This will release your selected area on the grid."
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      await deleteRequest(submittedRequestId);
      clearPendingPaymentRequestId();
      setSubmittedRequestId(null);
      toast.success("Pixel reservation canceled and grid area released.");
    } catch (err) {
      console.error("Failed to cancel request", err);
      toast.error("Failed to cancel reservation. Please try again.");
    } finally {
      setCancelling(false);
    }
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
      const result = await submitBuyRequest({
        companyName: formData.companyName.trim(),
        email: formData.email.trim(),
        tagline: formData.tagline.trim() || undefined,
        xHandle: formData.xHandle.trim() || undefined,
        telegram: formData.telegram.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
        targetUrl: formData.targetUrl.trim() || undefined,
        selectionRect,
        selectedPixels,
        selectedBlocks,
        file: formData.logoFile,
      });
      setSubmittedRequestId(result.id);
      savePendingPaymentRequestId(result.id);
      addPendingReservation(selectionRect);
      toast.success("Application submitted! Complete your crypto payment below to secure your blocks.");
      toast.info("Your selected area is temporarily reserved while payment is completed.");
      setSubmissionSuccess(true);
      setFormData({ companyName: "", email: "", tagline: "", xHandle: "", logoUrl: "", targetUrl: "", logoFile: null, telegram: "" });
      setSelectedPixels(0);
      setSelectionRect(null);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isPaid
    ? "🎉 Payment Confirmed! Your Block is Reserved."
    : submissionSuccess
      ? "Complete Your Payment"
      : "Purchase Pixels";

  const modalDescription = isPaid
    ? "Your crypto payment has been received and verified."
    : submissionSuccess
      ? "Your application was submitted. Pay now with crypto to secure your blocks."
      : "1. Submit details ➔ 2. Pay with Crypto ➔ 3. Live within 24 hours";

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
          {hasUnpaidOrder && !paymentRequestLoading && (
            <div className="mx-auto mb-4 flex w-full max-w-3xl flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">Payment pending</p>
                  <p className="text-sm text-muted-foreground">
                    Complete your {formatUsd(paymentTotal)} crypto payment to secure your placement.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" variant="outline" onClick={openPaymentModal}>
                    View Details
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelRequest}
                    disabled={cancelling}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Reservation"}
                  </Button>
                </div>
              </div>
              {submittedRequestId ? (
                <DePayPaymentButton
                  requestId={submittedRequestId}
                  selectedBlocks={paymentBlocks}
                  disabled={!canPay}
                  onPaymentOpened={() => setFormOpen(false)}
                  onPaymentSucceeded={() => {
                    toast.success("Payment submitted successfully. Confirmation may take a moment.");
                  }}
                  onPaymentFailed={() => {
                    toast.error("Payment could not be completed. Please try again.");
                  }}
                />
              ) : null}
            </div>
          )}

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
                    <span><strong className="text-foreground">Pay with Crypto:</strong> Complete payment immediately using the DePay widget on this page.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">4.</span>
                    <span><strong className="text-foreground">Admin Review:</strong> Our team reviews your application within 24 hours and sends a confirmation email.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">5.</span>
                    <span><strong className="text-foreground">Go Live:</strong> Once approved, we activate your logo and link on the grid.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">6.</span>
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
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">{formatUsd(total)}</div>
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

      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>
          {submissionSuccess || isPaid ? (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isPaid ? "bg-emerald-100" : "bg-green-100"}`}>
                  <svg className={`w-8 h-8 ${isPaid ? "text-emerald-600" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-3">
                  {isPaid ? (
                    <>
                      <h3 className="text-xl font-bold text-foreground">
                        🎉 Payment Confirmed! Your Block is Reserved.
                      </h3>
                      {paymentRequest?.payment?.transaction ? (
                        <p className="text-xs font-mono text-muted-foreground break-all">
                          Transaction Hash: [ {paymentRequest.payment.transaction} ]
                        </p>
                      ) : (
                        <p className="text-xs font-mono text-muted-foreground">
                          Transaction Hash: [ 0x8f3...a9b1 ]
                        </p>
                      )}
                      <div className="rounded-lg border border-border/70 bg-card p-4 text-left space-y-2 mt-4">
                        <p className="font-semibold text-sm text-foreground">What happens next?</p>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          <li>• Our team is rendering your logo onto the canvas.</li>
                          <li>• Your block will go live on the grid within 24 hours.</li>
                          <li>• Order confirmation will be sent to your email.</li>
                        </ul>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-muted/40 p-4 text-left text-xs space-y-1 mt-2">
                        <p className="font-semibold text-foreground">💬 Need support, edits, or have questions?</p>
                        <p className="text-muted-foreground">
                          Email:{" "}
                          <a href="mailto:support@themilliondollarcryptopage.com" className="text-primary underline font-medium">
                            support@themilliondollarcryptopage.com
                          </a>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">Application submitted.</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Complete your {formatUsd(paymentTotal)} payment below to secure your blocks. Our team will review your application after payment.
                      </p>
                    </>
                  )}
                </div>

                {submittedRequestId && !isPaid ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Crypto payment</p>
                      {paymentRequestLoading ? (
                        <p className="text-xs text-muted-foreground">Checking payment status...</p>
                      ) : (
                        <DePayPaymentButton
                          requestId={submittedRequestId}
                          selectedBlocks={paymentBlocks}
                          disabled={!canPay}
                          onPaymentOpened={() => setFormOpen(false)}
                          onPaymentSucceeded={() => {
                            toast.success("Payment submitted successfully. Confirmation may take a moment.");
                          }}
                          onPaymentFailed={() => {
                            toast.error("Payment could not be completed. Please try again.");
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <Button onClick={closeForm} variant="outline" className="w-full sm:w-auto">
                    Close
                  </Button>
                  {!isPaid && (
                    <Button
                      type="button"
                      onClick={() => {
                        closeForm();
                        void handleCancelRequest();
                      }}
                      disabled={cancelling}
                      variant="destructive"
                      className="w-full sm:w-auto"
                    >
                      Cancel Reservation
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-[0.1em]">Project & Contact Details</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">Project / Brand Name *</Label>
                    <Input
                      id="company"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <p className="text-[0.7rem] text-muted-foreground">Kept private — used strictly for order updates and support.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tagline" className="text-sm font-medium">
                      Project Tagline / Short Blurb (100 character limit for Grid description)
                    </Label>
                    <span className="text-[0.7rem] text-muted-foreground">{formData.tagline.length}/100</span>
                  </div>
                  <Input
                    id="tagline"
                    maxLength={100}
                    placeholder="Short description shown when users hover over your logo"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="xHandle" className="text-sm font-medium">Official X.com Handle (Optional)</Label>
                    <Input
                      id="xHandle"
                      placeholder="@ProjectName"
                      value={formData.xHandle}
                      onChange={(e) => setFormData({ ...formData, xHandle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegram" className="text-sm font-medium">Telegram (Optional)</Label>
                    <Input
                      id="telegram"
                      placeholder="@username or https://t.me/username"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    />
                    <p className="text-[0.7rem] text-muted-foreground">Kept private — used strictly for order updates and support</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-[0.1em]">Website Details</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">Target Website URL</Label>
                  <Input id="url" placeholder="https://example.com or any link" value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-[0.1em]">Logo & Branding</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Logo/Image *</Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        You must provide either a logo URL or upload an image file. We recommend square images for best display.
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="logo" className="text-xs text-muted-foreground font-normal">Option 1: Logo/Image URL</Label>
                          <Input id="logo" type="url" placeholder="https://..." value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} />
                        </div>
                        <div className="text-center text-xs text-muted-foreground font-medium">— OR —</div>
                        <div className="space-y-2">
                          <Label htmlFor="logoFile" className="text-xs text-muted-foreground font-normal">Option 2: Upload Image File</Label>
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
                        <span className="font-medium">📐 Image Dimensions Guide</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${dimensionsOpen ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-3">
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-muted-foreground">
                            Each grid block renders at {displayPixelSize.toFixed(1)}px × {displayPixelSize.toFixed(1)}px ({PIXELS_PER_BLOCK.toLocaleString()} pixels), but for crisp display we use 2× exports. Use the table below for perfectly sized assets.
                          </p>
                        </div>
                        <div className="overflow-x-auto rounded border border-border/50">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-background/60 text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 font-semibold uppercase tracking-[0.2em]">Blocks</th>
                                <th className="px-3 py-2 font-semibold uppercase tracking-[0.2em]">Pixel Size</th>
                                <th className="px-3 py-2 font-semibold uppercase tracking-[0.2em]">Total Pixels</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blockDimensionGuide.slice(0, 5).map((entry) => (
                                <tr key={entry.label} className="odd:bg-background/40">
                                  <td className="px-3 py-2 font-semibold text-foreground">{entry.label}</td>
                                  <td className="px-3 py-2">{entry.pixelDimensions}</td>
                                  <td className="px-3 py-2">{entry.totalPixels}</td>
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
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-[0.1em]">Order Summary</h3>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-muted-foreground">Selected Blocks</div>
                    <div className="text-right font-semibold">{selectedBlocks.toLocaleString()}</div>
                    <div className="text-muted-foreground">Selected Pixels</div>
                    <div className="text-right">{selectedPixels.toLocaleString()}</div>
                    <div className="border-t border-border/50 pt-2 mt-1 col-span-2"></div>
                    <div className="text-muted-foreground font-medium">Total Amount</div>
                    <div className="text-right font-bold text-lg">{formatUsd(total)}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Pay with crypto during checkout</p>
                  <p className="text-xs text-muted-foreground">
                    After submitting this form, you will pay immediately on this page using the DePay widget. USDT, USDC, and more are supported with real-time USD conversion.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting || selectedBlocks < 1}>
                  {submitting ? "Submitting..." : "Submit & Continue to Payment"}
                </Button>
                <p className="text-xs text-muted-foreground leading-relaxed text-center px-1">
                  By submitting, you grant permission to display your submitted logo, name, link, and blurb, and agree to our FAQ rules. Submissions violating content guidelines will be rejected and refunded to the originating wallet address, net of network gas fees.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Questions or custom requests? Email{" "}
                  <a href="mailto:hello@themilliondollarcryptopage.com" className="text-primary underline">
                    hello@themilliondollarcryptopage.com
                  </a>{" "}
                  — we reply within 24 hours.
                </p>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Buy;
