import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validatePromoCode } from "@/lib/promo";
import { toast } from "sonner";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { type SelectionRect } from "@/types/pixels";
import { submitBuyRequest } from "@/lib/buyRequests";

const PIXELS_PER_BLOCK = 100;

const Buy = () => {
  const [selectedPixels, setSelectedPixels] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

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

  const { lockedBlocks } = usePixelMetadata();

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
      toast.success("Thank you for your application! Our team will review it within 24 hours and contact you with next steps.");
      setFormOpen(false);
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="px-5 md:px-10 pt-48 md:pt-36 pb-12">
        <div className="mx-auto w-full max-w-5xl">
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
            onSelectionChange={setSelectedPixels}
            onSelectionComplete={(rect, pixels) => {
              setSelectionRect(rect);
              setSelectedPixels(pixels);
            }}
          />
        </div>
      </main>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Pixels</DialogTitle>
          </DialogHeader>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logo">Logo/Image URL</Label>
                <Input id="logo" type="url" placeholder="https://..." value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Target Website URL</Label>
                <Input id="url" type="url" placeholder="https://..." value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoFile">Upload Logo/Image (Optional)</Label>
              <Input
                id="logoFile"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, logoFile: e.target.files?.[0] ?? null })}
              />
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
            <p className="text-center text-xs text-muted-foreground">Your request will be manually reviewed before payment processing</p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Buy;


