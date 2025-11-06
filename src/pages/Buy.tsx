import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validatePromoCode } from "@/lib/promo";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Buy = () => {
  const [selectedPixels, setSelectedPixels] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    walletAddress: "",
    logoUrl: "",
    targetUrl: "",
    message: "",
  });

  const subtotal = useMemo(() => selectedPixels * 1, [selectedPixels]);
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
    if (selectedPixels < 100) {
      toast.error("Minimum purchase is 100 pixels");
      return;
    }
    setSubmitting(true);
    try {
      // TODO: integrate backend API; for now just simulate success
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Purchase request submitted! We'll review and contact you soon.");
      setFormOpen(false);
      setFormData({ name: "", email: "", walletAddress: "", logoUrl: "", targetUrl: "", message: "" });
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
      <main className="px-5 md:px-10 pt-36 pb-12">
        <div className="mx-auto w-full max-w-5xl">
          <PixelGrid
            interactive
            showLegend
            onSelectionChange={setSelectedPixels}
            onAreaClick={() => {
              if (selectedPixels >= 100) openForm();
            }}
          />

          <div className="mx-auto mt-6 w-full max-w-3xl rounded-lg border border-border bg-card/40 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Selected Pixels</div>
                <div className="text-xl font-semibold">{selectedPixels.toLocaleString()}</div>
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
              <div className="space-y-2">
                <Label htmlFor="promo">Promo Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="promo"
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

              <Button type="button" className="sm:justify-self-end" disabled={selectedPixels < 100} onClick={openForm}>
                Open Purchase Form
              </Button>
            </div>
            {selectedPixels > 0 && selectedPixels < 100 && (
              <p className="mt-2 text-xs text-amber-400">Minimum purchase is 100 pixels.</p>
            )}
          </div>
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
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">USDT Wallet Address</Label>
              <Input id="wallet" placeholder="0x..." value={formData.walletAddress} onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })} required />
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
              <Label htmlFor="message">Additional Message (Optional)</Label>
              <Textarea id="message" rows={3} placeholder="Any special requests or information..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
            </div>

            <div className="rounded-md border border-border p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Selected Pixels</div>
                <div className="text-right font-semibold">{selectedPixels.toLocaleString()}</div>
                <div className="text-muted-foreground">Subtotal</div>
                <div className="text-right">${subtotal.toLocaleString()}</div>
                <div className="text-muted-foreground">Promo {appliedCode ? `(${appliedCode})` : ""}</div>
                <div className="text-right">-{discountAmount.toLocaleString()}</div>
                <div className="text-muted-foreground">Total</div>
                <div className="text-right font-semibold">${total.toLocaleString()}</div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || selectedPixels < 100}>
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


