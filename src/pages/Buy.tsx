import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validatePromoCode } from "@/lib/promo";
import { toast } from "sonner";

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


