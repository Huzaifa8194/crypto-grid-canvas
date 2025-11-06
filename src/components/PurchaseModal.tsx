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
  selectedPixels: number;
  totalPrice: number;
}

// Promo code data structure
interface PromoCode {
  code: string;
  discount: number; // percentage
  expiryDate: Date;
  isActive: boolean;
}

// Sample promo codes
const promoCodes: PromoCode[] = [
  {
    code: "LAUNCH50",
    discount: 50,
    expiryDate: new Date("2025-01-31"),
    isActive: true,
  },
  {
    code: "CRYPTO20",
    discount: 20,
    expiryDate: new Date("2025-12-31"),
    isActive: true,
  },
  {
    code: "EARLY10",
    discount: 10,
    expiryDate: new Date("2024-12-31"), // Expired
    isActive: true,
  },
];

const PurchaseModal = ({ open, onOpenChange, selectedPixels, totalPrice }: PurchaseModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    walletAddress: "",
    logoUrl: "",
    targetUrl: "",
    message: "",
    promoCode: "",
  });

  const [promoCodeStatus, setPromoCodeStatus] = useState<{
    valid: boolean;
    message: string;
    discount: number;
  }>({ valid: false, message: "", discount: 0 });

  const [promoApplied, setPromoApplied] = useState(false);

  const validatePromoCode = (code: string) => {
    if (!code.trim()) {
      setPromoCodeStatus({ valid: false, message: "", discount: 0 });
      setPromoApplied(false);
      return;
    }

    const promo = promoCodes.find((p) => p.code.toUpperCase() === code.toUpperCase());

    if (!promo) {
      setPromoCodeStatus({
        valid: false,
        message: "Invalid promo code",
        discount: 0,
      });
      setPromoApplied(false);
      return;
    }

    if (!promo.isActive) {
      setPromoCodeStatus({
        valid: false,
        message: "This promo code is no longer active",
        discount: 0,
      });
      setPromoApplied(false);
      return;
    }

    const now = new Date();
    if (promo.expiryDate < now) {
      setPromoCodeStatus({
        valid: false,
        message: `This promo code expired on ${promo.expiryDate.toLocaleDateString()}`,
        discount: 0,
      });
      setPromoApplied(false);
      return;
    }

    setPromoCodeStatus({
      valid: true,
      message: `${promo.discount}% discount applied!`,
      discount: promo.discount,
    });
    setPromoApplied(true);
  };

  const handlePromoCodeApply = () => {
    validatePromoCode(formData.promoCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Purchase request submitted! We'll review and contact you soon.");
    onOpenChange(false);
    setFormData({
      name: "",
      email: "",
      walletAddress: "",
      logoUrl: "",
      targetUrl: "",
      message: "",
      promoCode: "",
    });
    setPromoCodeStatus({ valid: false, message: "", discount: 0 });
    setPromoApplied(false);
  };

  const discountAmount = promoApplied ? (totalPrice * promoCodeStatus.discount) / 100 : 0;
  const finalPrice = totalPrice - discountAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Purchase Pixels</DialogTitle>
          <DialogDescription>
            Complete the form below to reserve your pixels
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Purchase Summary */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pixels Selected:</span>
              <span className="font-semibold text-gray-800">{selectedPixels}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price per Pixel:</span>
              <span className="font-semibold text-gray-800">$1</span>
            </div>
            {promoApplied && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-800">${totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({promoCodeStatus.discount}%):</span>
                  <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-base pt-2 border-t border-gray-300">
              <span className="font-bold text-gray-800">Total:</span>
              <span className="font-bold text-blue-600 text-lg">${finalPrice.toFixed(2)} USD</span>
            </div>
          </div>

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
            <Label htmlFor="logo">Logo/Image URL (Optional)</Label>
            <Input
              id="logo"
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Target Website URL (Optional)</Label>
            <Input
              id="url"
              type="url"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoCode">Promo Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="promoCode"
                value={formData.promoCode}
                onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                placeholder="Enter promo code"
                className={promoCodeStatus.valid ? "border-green-500" : ""}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handlePromoCodeApply}
                className="whitespace-nowrap"
              >
                Apply
              </Button>
            </div>
            {promoCodeStatus.message && (
              <p
                className={`text-sm ${
                  promoCodeStatus.valid ? "text-green-600" : "text-red-600"
                }`}
              >
                {promoCodeStatus.message}
              </p>
            )}
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

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Submit Purchase Request
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Your request will be manually reviewed before payment processing
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
