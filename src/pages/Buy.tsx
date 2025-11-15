import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validatePromoCode } from "@/lib/promo";
import { toast } from "sonner";

const MIN_BLOCKS = 1;
const MAX_BLOCKS = 10000; // 1,000,000 pixels / 100 pixels per block

const Buy = () => {
  const [selectedBlocks, setSelectedBlocks] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    logoUrl: "",
    targetUrl: "",
    logoFile: null as File | null,
    telegram: "",
  });

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

  const handleManualBlockChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setSelectedBlocks(() => {
      if (value <= 0) return MIN_BLOCKS;
      return Math.min(MAX_BLOCKS, Math.max(MIN_BLOCKS, value));
    });
  };

  const incrementManualBlocks = () => {
    setSelectedBlocks((prev) => {
      const base = prev > 0 ? prev : MIN_BLOCKS - 1;
      return Math.min(MAX_BLOCKS, base + 1);
    });
  };

  const decrementManualBlocks = () => {
    setSelectedBlocks((prev) => {
      if (prev === 0) return 0;
      if (prev <= MIN_BLOCKS) return MIN_BLOCKS;
      return Math.max(MIN_BLOCKS, prev - 1);
    });
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
    setSubmitting(true);
    try {
      // TODO: integrate backend API; for now just simulate success
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Thank you for your application! Our team will review it within 24 hours and contact you with next steps.");
      setFormOpen(false);
      setFormData({ companyName: "", email: "", logoUrl: "", targetUrl: "", logoFile: null, telegram: "" });
      setPromoInput("");
      setAppliedCode(null);
      setDiscountPercent(0);
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Selected Blocks</div>
                <div className="text-xl font-semibold">{selectedBlocks.toLocaleString()}</div>
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

            <div className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto]">
              <div className="text-xs text-muted-foreground">1 Block = 100 Pixels = 100 USD</div>
              <Button type="button" className="sm:justify-self-end" disabled={selectedBlocks < 1} onClick={openForm}>
                Open Purchase Form
              </Button>
            </div>
            {selectedBlocks > 0 && selectedBlocks < 1 && (
              <p className="mt-2 text-xs text-amber-400">Minimum purchase is 1 block (100 pixels).</p>
            )}
          </div>

          <div className="mb-6 rounded-lg border border-border bg-card/50 p-4 sm:hidden">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Mobile Block Selector
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Use these controls to pick how many 100-pixel blocks you want. We’ll confirm placement details after you submit the purchase form.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-12 rounded-full text-xl"
                onClick={decrementManualBlocks}
                disabled={selectedBlocks === 0 || selectedBlocks <= MIN_BLOCKS}
              >
                −
              </Button>
              <div className="flex-1 space-y-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={MIN_BLOCKS}
                  max={MAX_BLOCKS}
                  step={1}
                  value={selectedBlocks > 0 ? selectedBlocks : ""}
                  placeholder="Enter blocks"
                  onChange={(e) => {
                    const next = parseInt(e.target.value, 10);
                    if (Number.isNaN(next)) {
                      setSelectedBlocks(0);
                      return;
                    }
                    handleManualBlockChange(next);
                  }}
                />
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  <span>Min 1 block</span>
                  <span>Step = 100 pixels</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-12 rounded-full text-xl"
                onClick={incrementManualBlocks}
              >
                +
              </Button>
            </div>

            <p className="mt-3 text-center text-sm font-semibold text-foreground">
              {selectedBlocks > 0 ? `${(selectedBlocks * 100).toLocaleString()} pixels • $${subtotal.toLocaleString()}` : "Select at least 1 block (100 pixels)"}
            </p>
            <div className="mt-2 flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs font-semibold uppercase tracking-[0.25em]"
                onClick={() => setSelectedBlocks(0)}
              >
                Clear Selection
              </Button>
            </div>
          </div>

          <PixelGrid
            interactive
            showLegend
            onSelectionChange={setSelectedBlocks}
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
                <div className="text-right">{(selectedBlocks * 100).toLocaleString()}</div>
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


