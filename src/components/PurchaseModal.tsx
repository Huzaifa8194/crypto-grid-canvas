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
}

const PurchaseModal = ({ open, onOpenChange, blockId }: PurchaseModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    walletAddress: "",
    blockCount: "100",
    logoUrl: "",
    targetUrl: "",
    message: "",
  });

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
    });
  };

  const totalCost = parseInt(formData.blockCount) || 100;

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
            />
            <p className="text-sm text-muted-foreground">
              Total cost: ${totalCost} USDT
            </p>
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
