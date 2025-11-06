import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string;
  selectedPixelCount?: number;
  totalPrice?: number;
}

interface PromoCode {
  code: string;
  discount: number; // percentage (e.g., 50 for 50%)
  expiryDate: Date;
}

// Define promo codes with expiry dates
const PROMO_CODES: PromoCode[] = [
  { code: "LAUNCH50", discount: 50, expiryDate: new Date("2025-01-31") },
  { code: "EARLY20", discount: 20, expiryDate: new Date("2025-02-28") },
  { code: "SAVE10", discount: 10, expiryDate: new Date("2025-12-31") },
];

const PurchaseModal = ({ 
  open, 
  onOpenChange, 
  blockId,
  selectedPixelCount,
  totalPrice 
}: PurchaseModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    walletAddress: "",
    blockCount: selectedPixelCount?.toString() || "100",
    logoUrl: "",
    targetUrl: "",
    message: "",
    promoCode: "",
  });

  const [promoValidation, setPromoValidation] = useState<{
    isValid: boolean;
    message: string;
    discount: number;
  }>({ isValid: false, message: "", discount: 0 });

  const validatePromoCode = (code: string) => {
    if (!code.trim()) {
      setPromoValidation({ isValid: false, message: "", discount: 0 });
      return;
    }

    const promo = PROMO_CODES.find(
      (p) => p.code.toLowerCase() === code.trim().toLowerCase()
    );

    if (!promo) {
      setPromoValidation({
        isValid: false,
        message: "Invalid promo code",
        discount: 0,
      });
      return;
    }

    const now = new Date();
    if (now > promo.expiryDate) {
      setPromoValidation({
        isValid: false,
        message: `Promo code expired on ${promo.expiryDate.toLocaleDateString()}`,
        discount: 0,
      });
      return;
    }

    setPromoValidation({
      isValid: true,
      message: `${promo.discount}% discount applied!`,
      discount: promo.discount,
    });
  };

  const handlePromoCodeChange = (code: string) => {
    setFormData({ ...formData, promoCode: code });
    validatePromoCode(code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Purchase request submitted! We'll review and contact you soon.");
    onOpenChange(false);
    setFormData({
      name: "",
      email: "",
      walletAddress: "",
      blockCount: "100",
      logoUrl: "",
      targetUrl: "",
      message: "",
      promoCode: "",
    });
    setPromoValidation({ isValid: false, message: "", discount: 0 });
  };

  const basePrice = totalPrice || parseInt(formData.blockCount) || 100;
  const discountAmount = promoValidation.isValid 
    ? (basePrice * promoValidation.discount) / 100 
    : 0;
  const finalPrice = basePrice - discountAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Purchase Pixels</DialogTitle>
          <DialogDescription>
            Each pixel costs $1 (1 USDT). Minimum purchase: 100 pixels ($100 USDT)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet">USDT Wallet Address</Label>
            <Input
              id="wallet"
              value={formData.walletAddress}
              onChange={(e) =>
                setFormData({ ...formData, walletAddress: e.target.value })
              }
              placeholder="0x..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blocks">Number of Pixels</Label>
            <Input
              id="blocks"
              type="number"
              min="100"
              step="10"
              value={formData.blockCount}
              onChange={(e) => setFormData({ ...formData, blockCount: e.target.value })}
              required
              disabled={!!selectedPixelCount}
            />
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                Base price: ${basePrice.toLocaleString()} USDT
              </p>
              {promoValidation.isValid && (
                <>
                  <p className="text-green-600 font-medium">
                    Discount ({promoValidation.discount}%): -${discountAmount.toLocaleString()} USDT
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    Final price: ${finalPrice.toLocaleString()} USDT
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoCode">Promo Code (Optional)</Label>
            <Input
              id="promoCode"
              value={formData.promoCode}
              onChange={(e) => handlePromoCodeChange(e.target.value)}
              placeholder="Enter promo code"
            />
            {promoValidation.message && (
              <p
                className={`text-sm ${
                  promoValidation.isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {promoValidation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo/Image URL</Label>
            <Input
              id="logo"
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Target Website URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Any special requests or information..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Submit Purchase Request
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your request will be manually reviewed before payment processing
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
