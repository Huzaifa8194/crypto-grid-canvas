import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
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
  const { request: paymentRequest, loading: paymentRequestLoading } = useBuyRequest(submittedRequestId);

  const total = useMemo(() => calculateOrderTotalUsd(selectedBlocks), [selectedBlocks]);
  const paymentBlocks = paymentRequest?.selectedBlocks ?? selectedBlocks;
  const paymentTotal = calculateOrderTotalUsd(paymentBlocks);
  const isPaid = Boolean(paymentRequest?.paid || paymentRequest?.invoiceStatus === "paid");
  const isInvoiceSent = paymentRequest?.invoiceStatus === "invoice_sent";
  const canPay = Boolean(submittedRequestId && paymentRequest && isInvoiceSent && !isPaid);
  const hasPendingOrder = Boolean(submittedRequestId && paymentRequest && !isPaid);

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

  useEffect(() => {
    if (canPay) {
      toast.success("Your application has been approved. You can complete payment on this page.");
    }
  }, [canPay]);

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
      toast.success("Thank you for your application! Our team will review it within 24 hours.");
      toast.info("Your selected area is now temporarily reserved while we review.");
      setSubmissionSuccess(true);
      setFormData({ companyName: "", email: "", logoUrl: "", targetUrl: "", logoFile: null, telegram: "" });
      setSelectedPixels(0);
      setSelectionRect(null);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isPaid
    ? "Payment Complete"
    : canPay
      ? "Complete Your Payment"
      : submissionSuccess
        ? "Application Submitted"
        : "Purchase Pixels";

  const modalDescription = isPaid
    ? "Your crypto payment has been received."
    : canPay
      ? "Pay securely with crypto using the DePay widget below."
      : submissionSuccess
        ? "Your application has been received and is being processed."
        : "Complete the form below and our team will review your placement within 24 hours.";

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
          {canPay && (
            <div className="mx-auto mb-4 flex w-full max-w-3xl flex-col gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Your application has been approved</p>
                <p className="text-sm text-muted-foreground">
                  Complete your {formatUsd(paymentTotal)} crypto payment on this page to secure your placement.
                </p>
              </div>
              <Button onClick={openPaymentModal} className="shrink-0">
                Pay with Crypto
              </Button>
            </div>
          )}

          {hasPendingOrder && !canPay && !isPaid && !paymentRequestLoading && (
            <div className="mx-auto mb-4 w-full max-w-3xl rounded-lg border border-border bg-card/40 p-4">
              <p className="text-sm text-muted-foreground">
                Your application is under review. Once approved, you will receive a confirmation email and can complete payment right here on the buy page.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openPaymentModal}>
                View Application Status
              </Button>
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
                    <span><strong className="text-foreground">Get Approved & Pay:</strong> We review your application and send a confirmation email. Once approved, pay with crypto via the DePay widget on this page.</span>
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
          {submissionSuccess || canPay || isPaid ? (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isPaid ? "bg-emerald-100" : "bg-green-100"}`}>
                  <svg className={`w-8 h-8 ${isPaid ? "text-emerald-600" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  {isPaid ? (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">Thank you — payment received.</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We will activate your placement on the grid shortly.
                      </p>
                      {paymentRequest?.payment?.transaction ? (
                        <p className="text-xs text-muted-foreground break-all">
                          Transaction: {paymentRequest.payment.transaction}
                        </p>
                      ) : null}
                    </>
                  ) : canPay ? (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">Your application has been approved.</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Complete your {formatUsd(paymentTotal)} payment below using the DePay crypto widget.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">Thank you for your submission.</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your application will be manually reviewed. You will receive a confirmation email from{" "}
                        <span className="font-medium text-primary">hello@themilliondollarcryptopage.com</span>{" "}
                        within 24 hours once approved.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        After approval, return to this buy page to complete your crypto payment using the DePay widget.
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
                          disabledReason={
                            canPay
                              ? undefined
                              : "Payment unlocks after our team reviews your application and sends your approval confirmation."
                          }
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

                <Button onClick={closeForm} className="mt-2">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-[0.1em]">Company Information</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">Company Name *</Label>
                    <Input id="company" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram" className="text-sm font-medium">Telegram (Optional)</Label>
                  <Input
                    id="telegram"
                    placeholder="@username or https://t.me/username"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  />
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
                  <p className="text-sm font-medium text-foreground">Pay with crypto after approval</p>
                  <p className="text-xs text-muted-foreground">
                    After your application is approved, you will complete payment right here on this page using the DePay widget. USDT, USDC, ETH, and more are supported with real-time USD conversion.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting || selectedBlocks < 1}>
                  {submitting ? "Submitting Application..." : "Submit Purchase Request"}
                </Button>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">Next Steps After Submission:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Your application will be manually reviewed</li>
                        <li>• You will receive a confirmation email once approved</li>
                        <li>• Return to this buy page to pay with crypto via the DePay widget</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
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
