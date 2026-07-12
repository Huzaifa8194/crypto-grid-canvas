import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PixelGrid from "@/components/PixelGrid";
import { useAuth } from "@/context/AuthContext";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useReservations } from "@/context/ReservationsContext";
import { useInvoiceSettings } from "@/context/InvoiceSettingsContext";
import { type SelectionRect, type PixelRegion } from "@/types/pixels";
import { type BuyRequest, type InvoiceStatus } from "@/types/buy";
import { PIXELS_PER_BLOCK } from "@/lib/pixelMath";
import { storage } from "@/lib/firebase";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "sonner";
import { renderInvoiceTemplate } from "@/lib/invoiceTemplate";
import PaymentDetailsPanel from "@/components/PaymentDetailsPanel";
import { fetchDepayHealth, simulateDepayCallback, type DepayHealthResponse } from "@/lib/adminApi";
import { type PaymentRecord } from "@/types/buy";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const buildDescriptionFromRequest = (request: BuyRequest) => {
  const details = [
    `Request from ${request.companyName}.`,
    `Email: ${request.email}`,
    request.telegram ? `Telegram: ${request.telegram}` : null,
    request.targetUrl ? `Website: ${request.targetUrl}` : null,
    request.promoCode ? `Promo: ${request.promoCode}` : null,
  ].filter(Boolean);
  return details.join(" ");
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { regions, lockedBlocks, upsertRegion, deleteRegion } = usePixelMetadata();
  const { requests, loading: requestsLoading, error: requestsError, reservedRects, deleteRequest, markRequestPaid, updateInvoiceStatus } =
    useReservations();
  const { settings: invoiceSettings } = useInvoiceSettings();

  const [selectedPixels, setSelectedPixels] = useState(0);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [highlightRect, setHighlightRect] = useState<SelectionRect | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileSource, setImageFileSource] = useState<"manual" | "autofill" | null>(null);
  const [imageFileLabel, setImageFileLabel] = useState("");
  const [nonNativeImageUrl, setNonNativeImageUrl] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [deletingRegionId, setDeletingRegionId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceRequest, setInvoiceRequest] = useState<BuyRequest | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [depayHealth, setDepayHealth] = useState<DepayHealthResponse | null>(null);
  const [depayHealthLoading, setDepayHealthLoading] = useState(false);
  const [depayTestRequestId, setDepayTestRequestId] = useState("");
  const [depayTestingId, setDepayTestingId] = useState<string | null>(null);

  const SAMPLE_ADMIN_PAYMENT: PaymentRecord = {
    blockchain: "polygon",
    transaction: "0x053279fcb2f52fd66a9367416910c0bf88ae848dca769231098c4d9e240fcf56",
    sender: "0x317D875cA3B9f8d14f960486C0d1D1913be74e90",
    receiver: "0x85d413831F15E30457fF255bf7d649356568c517",
    token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    amount: "500",
    sentAmount: "500",
    commitment: "confirmed",
    paidAt: Date.now(),
  };

  const editingRegion = useMemo(
    () => regions.find((region) => region.id === editingRegionId) ?? null,
    [regions, editingRegionId]
  );

  const selectionSummary = useMemo(() => {
    if (!selectionRect) return null;
    return {
      blocks: selectionRect.blockCount,
      pixels: selectionRect.pixelCount,
      width: selectionRect.width,
      height: selectionRect.height,
    };
  }, [selectionRect]);
  const isEditing = Boolean(editingRegion);
  const canSubmitImage = Boolean(imageFile || editingRegion?.imageUrl);
  const displayPixelSize = Math.sqrt(PIXELS_PER_BLOCK);
  const baseExportScale = 2;
  const exportPixelSize = displayPixelSize * baseExportScale;
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
    [exportPixelSize]
  );
  const exampleBlockGuide = { width: 4, height: 8 };
  const exampleWidthPx = exampleBlockGuide.width * exportPixelSize;
  const exampleHeightPx = exampleBlockGuide.height * exportPixelSize;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLink("");
    setImageFile(null);
    setImageFileSource(null);
    setImageFileLabel("");
    setNonNativeImageUrl(null);
    setSelectionRect(null);
    setSelectedPixels(0);
    setHighlightRect(null);
    setEditingRegionId(null);
    setActiveRequestId(null);
    setAssignError(null);
  };

  const startEditingRegion = (region: PixelRegion) => {
    setEditingRegionId(region.id);
    setSelectionRect(region.bounds);
    setSelectedPixels(region.bounds.pixelCount);
    setHighlightRect(region.bounds);
    setTitle(region.title);
    setDescription(region.description);
    setLink(region.link ?? "");
    setImageFile(null);
    setImageFileSource(null);
    setImageFileLabel(region.imageStoragePath?.split("/").pop() ?? "");
    setNonNativeImageUrl(null);
    setAssignError(null);
    setActiveRequestId(null);
    toast.info(`Editing "${region.title}". Update the fields and save.`);
  };

  const cancelEditing = () => {
    resetForm();
  };

  const handleAssignMetadata = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetRect = selectionRect ?? editingRegion?.bounds ?? null;
    if (!targetRect || selectedPixels === 0 || targetRect.blockCount === 0) {
      setAssignError("Select a valid block area before saving metadata.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setAssignError("Title and description are required.");
      return;
    }
    const hasExistingImage = Boolean(editingRegion?.imageUrl);
    if (!imageFile && !hasExistingImage) {
      setAssignError("Upload an image for this placement.");
      return;
    }

    setAssigning(true);
    setAssignError(null);
    try {
      const id = editingRegion?.id ?? crypto.randomUUID();
      const timestamp = Date.now();
      let imageUrl = editingRegion?.imageUrl;
      let imageDataUrl = editingRegion?.imageDataUrl;
      let imageStoragePath = editingRegion?.imageStoragePath;

      if (imageFile) {
        const storagePath = `pixel-metadata/${id}/${imageFile.name}`;
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
        imageDataUrl = await fileToDataUrl(imageFile);
        if (isEditing && editingRegion?.imageStoragePath && editingRegion.imageStoragePath !== storagePath) {
          try {
            await deleteObject(ref(storage, editingRegion.imageStoragePath));
          } catch (cleanupErr) {
            console.warn("Failed to delete previous image from storage", cleanupErr);
          }
        }
        imageStoragePath = storagePath;
      }

      await upsertRegion({
        id,
        bounds: targetRect,
        title: title.trim(),
        description: description.trim(),
        link: link.trim() || undefined,
        imageUrl,
        imageStoragePath,
        imageDataUrl,
        createdAt: editingRegion?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      toast.success(isEditing ? "Placement updated." : "Metadata saved locally and synced to Firebase.");
      resetForm();
    } catch (err) {
      console.error("Failed to save metadata", err);
      setAssignError("Failed to save metadata. Please retry.");
      toast.error("Metadata save failed. See console for details.");
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const fetchFileFromUrl = useCallback(async (url: string, fallbackName: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    const blob = await response.blob();
    const ext = blob.type?.split("/").pop() || "png";
    return new File([blob], `${fallbackName}.${ext}`, { type: blob.type || "image/*" });
  }, []);

  const handleRequestSelect = useCallback(
    async (request: BuyRequest) => {
      setEditingRegionId(null);
      const requestRect = request.selectionRect ?? null;
      if (requestRect) {
        setHighlightRect(requestRect);
        setSelectionRect(requestRect);
        setSelectedPixels(request.selectedPixels);
      } else {
        setHighlightRect(null);
        setSelectionRect(null);
        setSelectedPixels(0);
        toast.warning("This request does not include a saved selection.");
        return;
      }
      setTitle(request.companyName ?? "");
      setLink(request.targetUrl ?? "");
      setDescription(buildDescriptionFromRequest(request));
      setAssignError(null);
      setActiveRequestId(request.id);

      const imageSource = request.logoFileUrl ?? request.logoUrl;
      if (imageSource) {
        const isNativeImage =
          (imageSource.includes("firebasestorage.googleapis.com") || imageSource.includes(".firebasestorage.app")) &&
          imageSource.includes("themilliondollarcryptopa-8d151");
        if (!isNativeImage) {
          setImageFile(null);
          setImageFileSource(null);
          setImageFileLabel("");
          setNonNativeImageUrl(imageSource);
          toast.warning("This image is hosted externally. Please download it from the link below and re-upload.");
          return;
        }
        try {
          const file = await fetchFileFromUrl(imageSource, `request-${request.id}`);
          setImageFile(file);
          setImageFileSource("autofill");
          setImageFileLabel(file.name);
          setNonNativeImageUrl(null);
          toast.info(`Loaded ${request.companyName}'s request (image autofilled).`);
        } catch (err) {
          console.error("Failed to autofill request image", err);
          setImageFile(null);
          setImageFileSource(null);
          setImageFileLabel("");
          setNonNativeImageUrl(imageSource);
          toast.warning("Loaded request details; image must be downloaded and re-uploaded manually.");
        }
      } else {
        setImageFile(null);
        setImageFileSource(null);
        setImageFileLabel("");
        setNonNativeImageUrl(null);
        toast.info(`Loaded ${request.companyName}'s request.`);
      }
    },
    [fetchFileFromUrl]
  );

  const handleDeleteRegion = async (region: PixelRegion) => {
    const confirmDelete = window.confirm(`Delete "${region.title}" and free its pixels? This cannot be undone.`);
    if (!confirmDelete) return;
    setDeletingRegionId(region.id);
    try {
      await deleteRegion(region.id, region.imageStoragePath);
      toast.success(`Deleted ${region.title} and released the pixels.`);
    } catch (err) {
      console.error("Failed to delete region", err);
      toast.error("Unable to delete region. Check console for details.");
    } finally {
      setDeletingRegionId((prev) => (prev === region.id ? null : prev));
      if (editingRegionId === region.id) {
        resetForm();
      }
    }
  };

  const handleDeleteRequest = useCallback(
    async (requestId: string) => {
      const confirmDelete = window.confirm("Delete this buy request and free the reserved pixels?");
      if (!confirmDelete) return;
      setDeletingRequestId(requestId);
      try {
        await deleteRequest(requestId);
        toast.success("Buy request deleted.");
      } catch (err) {
        console.error("Failed to delete request", err);
        toast.error("Unable to delete request. Check console for details.");
      } finally {
        setDeletingRequestId((prev) => (prev === requestId ? null : prev));
        if (activeRequestId === requestId) {
          setActiveRequestId(null);
          setHighlightRect(null);
          setSelectionRect(null);
          setSelectedPixels(0);
        }
      }
    },
    [deleteRequest, activeRequestId]
  );

  const handleMarkPaid = useCallback(
    async (requestId: string) => {
      setMarkingPaidId(requestId);
      try {
        await markRequestPaid(requestId, true);
        toast.success("Marked request as paid.");
      } catch (err) {
        console.error("Failed to mark request paid", err);
        toast.error("Unable to mark as paid. Check console for details.");
      } finally {
        setMarkingPaidId((prev) => (prev === requestId ? null : prev));
      }
    },
    [markRequestPaid]
  );

  const openInvoiceModal = (request: BuyRequest) => {
    setInvoiceRequest(request);
    setInvoiceEmail(request.email ?? "");
    setInvoiceDialogOpen(true);
  };

  const closeInvoiceModal = () => {
    setInvoiceDialogOpen(false);
    setInvoiceRequest(null);
    setInvoiceEmail("");
    setInvoiceSending(false);
  };

  const handleSendInvoice = async () => {
    if (!invoiceRequest || !invoiceEmail) return;
    const subject = renderInvoiceTemplate(invoiceSettings.subjectTemplate, invoiceRequest);
    const html = renderInvoiceTemplate(invoiceSettings.bodyTemplate, invoiceRequest);
    setInvoiceSending(true);
    try {
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: invoiceEmail, subject, html }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send invoice");
      }
      await updateInvoiceStatus(invoiceRequest.id, "invoice_sent");
      toast.success("Approval confirmation sent. Customer can now pay on the buy page.");
      closeInvoiceModal();
    } catch (err) {
      console.error("Failed to send invoice", err);
      toast.error("Unable to send invoice. Check console for details.");
    } finally {
      setInvoiceSending(false);
    }
  };

  const handleStatusChange = async (requestId: string, status: InvoiceStatus) => {
    try {
      await updateInvoiceStatus(requestId, status);
      const statusLabel = status === "paid" ? "Paid" : status === "invoice_sent" ? "Invoice Sent" : "Pending";
      toast.success(`Status updated to "${statusLabel}".`);
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Unable to update status. Check console for details.");
    }
  };

  const handleCheckDepayHealth = async () => {
    setDepayHealthLoading(true);
    try {
      const health = await fetchDepayHealth();
      setDepayHealth(health);
      if (health.ok) {
        toast.success("DePay callback infrastructure looks healthy.");
      } else {
        toast.error("DePay callback infrastructure has missing configuration.");
      }
    } catch (err) {
      console.error("Failed to check DePay health", err);
      toast.error(err instanceof Error ? err.message : "Failed to check DePay health.");
    } finally {
      setDepayHealthLoading(false);
    }
  };

  const handleSimulateDepayCallback = async (requestId: string) => {
    setDepayTestingId(requestId);
    try {
      const result = await simulateDepayCallback(requestId);
      toast.success(`Test callback applied to ${result.requestId}. Check payment details below.`);
    } catch (err) {
      console.error("Failed to simulate DePay callback", err);
      toast.error(err instanceof Error ? err.message : "Failed to simulate callback.");
    } finally {
      setDepayTestingId(null);
    }
  };

  const now = Date.now();
  const LATE_THRESHOLD_MS = 1000 * 60 * 60 * 48;
  const parsedSubject = invoiceRequest ? renderInvoiceTemplate(invoiceSettings.subjectTemplate, invoiceRequest) : "";
  const parsedBody = invoiceRequest ? renderInvoiceTemplate(invoiceSettings.bodyTemplate, invoiceRequest) : "";

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <SEO title="Admin Dashboard" noIndex />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Admin Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate("/admin/invoices")}>
            Invoice Template
          </Button>
          <Button variant="secondary" onClick={() => navigate("/admin/first-buyers")}>
            Manage First Buyers
          </Button>
          <Button variant="secondary" onClick={() => navigate("/admin/press")}>
            Manage Press
          </Button>
          <Button variant="secondary" onClick={() => navigate("/admin/contact")}>
            Contact Settings
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>

      <Card className="mt-8 border border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="tracking-[0.3em] uppercase text-sm text-muted-foreground">DePay Callback Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify your callback infrastructure and preview exactly how paid requests appear in the admin panel.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <p className="text-sm font-semibold text-foreground">Infrastructure check</p>
              <p className="text-xs text-muted-foreground">
                Confirms Firebase Admin, DePay public key, and Firestore read access are configured for callbacks.
              </p>
              <Button type="button" variant="secondary" disabled={depayHealthLoading} onClick={() => void handleCheckDepayHealth()}>
                {depayHealthLoading ? "Checking..." : "Check Callback Health"}
              </Button>
              {depayHealth ? (
                <div className="space-y-2 text-xs">
                  <p className={depayHealth.ok ? "font-semibold text-emerald-300" : "font-semibold text-red-300"}>
                    {depayHealth.ok ? "All checks passed" : "Some checks failed"}
                  </p>
                  <p className="break-all text-muted-foreground">Callback: {depayHealth.callbackUrl}</p>
                  <p className="break-all text-muted-foreground">Events: {depayHealth.eventsUrl}</p>
                  <div className="grid gap-1">
                    {Object.entries(depayHealth.checks).map(([key, check]) => (
                      <div key={key} className="flex flex-wrap items-center gap-2">
                        <span className={check.ok ? "text-emerald-300" : "text-red-300"}>{check.ok ? "OK" : "FAIL"}</span>
                        <span className="text-foreground">{key}</span>
                        {check.detail ? <span className="text-muted-foreground">— {check.detail}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <p className="text-sm font-semibold text-foreground">Simulate callback on a request</p>
              <p className="text-xs text-muted-foreground">
                Runs the same Firestore update as a real DePay callback using mock transaction data. Use a pending request ID.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={depayTestRequestId}
                  onChange={(e) => setDepayTestRequestId(e.target.value)}
                  placeholder="Paste buy request ID"
                />
                <Button
                  type="button"
                  disabled={!depayTestRequestId.trim() || depayTestingId === depayTestRequestId.trim()}
                  onClick={() => void handleSimulateDepayCallback(depayTestRequestId.trim())}
                >
                  {depayTestingId === depayTestRequestId.trim() ? "Simulating..." : "Simulate Callback"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Preview: what admin sees for a paid request</p>
            <PaymentDetailsPanel
              payment={SAMPLE_ADMIN_PAYMENT}
              events={[
                { status: "attempt", blockchain: "polygon", createdAt: Date.now() - 3000 },
                { status: "processing", blockchain: "polygon", createdAt: Date.now() - 2000 },
                { status: "succeeded", blockchain: "polygon", createdAt: Date.now() - 1000 },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="tracking-[0.3em] uppercase text-sm text-muted-foreground">Grid Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PixelGrid
              interactive
              showLegend={false}
              lockedBlocks={lockedBlocks}
              reservedRects={reservedRects}
              highlightRect={highlightRect}
              regions={regions}
              onSelectionChange={setSelectedPixels}
              onSelectionComplete={(rect, pixels) => {
                setSelectionRect(rect);
                setSelectedPixels(pixels);
                setHighlightRect(null);
                setActiveRequestId(null);
                setEditingRegionId(null);
              }}
            />

            <div className="grid gap-3 rounded border border-border/60 p-3 text-xs uppercase tracking-[0.3em] text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-[0.6rem]">Pixels</p>
                <p className="text-xl font-semibold tracking-normal text-foreground">{selectedPixels.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[0.6rem]">Blocks</p>
                <p className="text-xl font-semibold tracking-normal text-foreground">
                  {selectionSummary?.blocks?.toLocaleString() ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem]">Dimensions</p>
                <p className="text-xl font-semibold tracking-normal text-foreground">
                  {selectionSummary ? `${selectionSummary.width} x ${selectionSummary.height}` : "—"}
                </p>
              </div>
            </div>

            {editingRegion && (
              <Alert className="border-primary/60 bg-primary/5">
                <AlertTitle>Editing existing placement</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 text-xs normal-case tracking-normal">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{editingRegion.title}</p>
                    <p className="text-muted-foreground">
                      {editingRegion.bounds.width} x {editingRegion.bounds.height} blocks •{" "}
                      {editingRegion.bounds.pixelCount.toLocaleString()} pixels
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={cancelEditing}>
                      Cancel Editing
                    </Button>
                    <span className="text-muted-foreground">Updates keep the same reserved blocks unless deleted.</span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form className="space-y-4" onSubmit={handleAssignMetadata}>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link (Optional)</Label>
                <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-upload">Image Upload</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] ?? null);
                    setImageFileSource(e.target.files?.[0] ? "manual" : null);
                    setImageFileLabel(e.target.files?.[0]?.name ?? "");
                    setNonNativeImageUrl(null);
                  }}
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected image: {imageFileLabel || imageFile.name}{" "}
                    {imageFileSource === "autofill" ? "(autofilled)" : ""}
                  </p>
                )}
                {!imageFile && editingRegion?.imageUrl && (
                  <div className="rounded border border-dashed border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">
                    <p className="text-sm font-semibold text-foreground">Current asset will be reused</p>
                    <p>Upload a new file to replace it or leave this empty to keep the existing image.</p>
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={editingRegion.imageDataUrl ?? editingRegion.imageUrl}
                        alt={editingRegion.title}
                        className="h-12 w-12 rounded border border-border/50 object-contain bg-background"
                      />
                      <a href={editingRegion.imageUrl} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                        Open full image
                      </a>
                    </div>
                  </div>
                )}
                {nonNativeImageUrl && (
                  <Alert variant="destructive">
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>This image is not hosted on our Firebase bucket. Please download it and re-upload to ensure local caching works.</p>
                      <a href={nonNativeImageUrl} target="_blank" rel="noreferrer" className="break-all text-xs underline">
                        {nonNativeImageUrl}
                      </a>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              {assignError && <p className="text-xs text-red-400">{assignError}</p>}
              <Button type="submit" className="w-full" disabled={assigning || selectedPixels === 0 || !canSubmitImage}>
                {assigning ? (isEditing ? "Updating…" : "Assigning...") : isEditing ? "Update Placement" : "Assign Metadata"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Metadata is cached locally (IndexedDB) and mirrored to Firebase for redundancy.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="tracking-[0.3em] uppercase text-sm text-muted-foreground">Buy Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
              <strong className="font-semibold">Note:</strong> To edit an already assigned region, use the{" "}
              <span className="font-semibold text-yellow-100">"Assigned Regions"</span> section below. Do not assign the same request twice—either delete it or update the existing placement.
            </div>
            {requestsLoading && <p className="text-sm text-muted-foreground">Loading purchase requests…</p>}
            {requestsError && (
              <p className="text-sm text-red-400">Failed to load requests: {requestsError.toLowerCase()}</p>
            )}
            {!requestsLoading && requests.length === 0 && (
              <p className="text-sm text-muted-foreground">No purchase requests have been submitted yet.</p>
            )}
            <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-2">
              {requests.map((request) => {
                const isActive = activeRequestId === request.id;
                const invoiceStatus: InvoiceStatus = request.invoiceStatus ?? (request.paid ? "paid" : "pending");
                const isPaid = invoiceStatus === "paid";
                const isInvoiceSent = invoiceStatus === "invoice_sent";
                const isLate = !isPaid && !isInvoiceSent && now - request.createdAt > LATE_THRESHOLD_MS;
                const cardStateClass = isActive
                  ? "border-primary shadow shadow-primary/40"
                  : isPaid
                    ? "border-emerald-400 bg-emerald-400/10"
                    : isInvoiceSent
                      ? "border-yellow-400 bg-yellow-400/10"
                      : isLate
                        ? "border-red-500 bg-red-500/10"
                        : "border-border/50";
                return (
                  <div
                    key={request.id}
                    className={`rounded border p-3 text-sm text-muted-foreground transition hover:border-border cursor-pointer ${cardStateClass}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleRequestSelect(request)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void handleRequestSelect(request);
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{request.companyName}</p>
                        <a href={`mailto:${request.email}`} className="text-xs underline hover:text-foreground">
                          {request.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPaid && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300 uppercase">
                            Paid
                          </span>
                        )}
                        {isInvoiceSent && (
                          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-300 uppercase">
                            Invoice Sent
                          </span>
                        )}
                        {isLate && (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300 uppercase">
                            Late • &gt;48h
                          </span>
                        )}
                        <span className="text-xs">
                          {new Date(request.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                      <div>Blocks: {request.selectedBlocks.toLocaleString()}</div>
                      <div>Pixels: {request.selectedPixels.toLocaleString()}</div>
                      <div className="sm:col-span-2 font-mono text-[0.65rem] text-muted-foreground break-all">
                        Request ID: {request.id}
                      </div>
                      {request.selectionRect && (
                        <div className="sm:col-span-2">
                          Selection: {request.selectionRect.width} x {request.selectionRect.height} blocks
                        </div>
                      )}
                      {request.telegram && <div>Telegram: {request.telegram}</div>}
                      {request.promoCode && <div>Promo: {request.promoCode}</div>}
                    </div>
                    {request.payment ? (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <PaymentDetailsPanel payment={request.payment} events={request.paymentEvents} compact />
                      </div>
                    ) : isPaid ? (
                      <p className="mt-3 rounded border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5 text-xs text-emerald-200">
                        Marked paid manually — no on-chain payment record stored.
                      </p>
                    ) : null}
                    {isLate && (
                      <p className="mt-2 rounded border border-red-500/50 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-200">
                        This request is older than 2 days. Please review it urgently.
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {request.targetUrl && (
                        <a href={request.targetUrl} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                          Target URL
                        </a>
                      )}
                      {request.logoUrl && (
                        <a href={request.logoUrl} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                          Logo URL
                        </a>
                      )}
                      {request.logoFileUrl && (
                        <a href={request.logoFileUrl} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                          Uploaded Asset
                        </a>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRequestSelect(request);
                        }}
                      >
                        Load Details
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          openInvoiceModal(request);
                        }}
                      >
                        {isInvoiceSent ? "Resend Invoice" : "Send Invoice"}
                      </Button>
                      {isInvoiceSent && !isPaid && (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={markingPaidId === request.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleStatusChange(request.id, "paid");
                          }}
                        >
                          {markingPaidId === request.id ? "Marking..." : "Mark as Paid"}
                        </Button>
                      )}
                      {!isPaid ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={depayTestingId === request.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleSimulateDepayCallback(request.id);
                          }}
                        >
                          {depayTestingId === request.id ? "Testing..." : "Test Callback"}
                        </Button>
                      ) : null}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-muted-foreground">Status:</span>
                        <Select
                          value={invoiceStatus}
                          onValueChange={(value: InvoiceStatus) => void handleStatusChange(request.id, value)}
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="ml-auto"
                        disabled={deletingRequestId === request.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteRequest(request.id);
                        }}
                      >
                        {deletingRequestId === request.id ? "Deleting..." : "Delete Request"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="tracking-[0.3em] uppercase text-sm text-muted-foreground">Assigned Regions</CardTitle>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No metadata has been assigned yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {regions.map((region) => {
                const isRegionEditing = editingRegionId === region.id;
                return (
                  <div
                    key={region.id}
                    className={`rounded border p-3 space-y-3 ${isRegionEditing ? "border-primary/70 shadow shadow-primary/20" : "border-border/50"}`}
                  >
                  <div className="flex items-center gap-3">
                    {region.imageDataUrl || region.imageUrl ? (
                      <img
                        src={region.imageDataUrl ?? region.imageUrl}
                        alt={region.title}
                        className="h-12 w-12 rounded border border-border/70 object-contain bg-background"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded border border-border/70 bg-muted" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{region.title}</p>
                      <p className="text-xs text-muted-foreground">{region.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>
                      Blocks: {region.bounds.blockCount.toLocaleString()} ({region.bounds.width} x {region.bounds.height})
                    </p>
                    <p>Pixels: {region.bounds.pixelCount.toLocaleString()}</p>
                    {region.link && (
                      <a href={region.link} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                        Link preview
                      </a>
                    )}
                  </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEditingRegion(region)}>
                        {isRegionEditing ? "Editing…" : "Edit Placement"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deletingRegionId === region.id}
                        onClick={() => handleDeleteRegion(region)}
                      >
                        {deletingRegionId === region.id ? "Deleting..." : "Delete Placement"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="tracking-[0.3em] uppercase text-sm text-muted-foreground">Block Dimension Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Each grid block renders at {displayPixelSize}px × {displayPixelSize}px ({PIXELS_PER_BLOCK.toLocaleString()} pixels), but to keep
            things razor sharp we now standardize on {baseExportScale}× exports ({exportPixelSize}px × {exportPixelSize}px per block). Use the
            table below to export perfectly sized square assets at that 2× baseline.
          </p>
          <div className="overflow-x-auto rounded border border-border/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.2em]">Blocks</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.2em]">Pixel Dimensions</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.2em]">Total Pixels</th>
                </tr>
              </thead>
              <tbody>
                {blockDimensionGuide.map((entry) => (
                  <tr key={entry.label} className="odd:bg-background/40">
                    <td className="px-3 py-2 font-semibold text-foreground">{entry.label}</td>
                    <td className="px-3 py-2">{entry.pixelDimensions}</td>
                    <td className="px-3 py-2">{entry.totalPixels}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            For any rectangle, multiply the width and height (in blocks) by {exportPixelSize}px to get the exact export size. Example: a{" "}
            {exampleBlockGuide.width} × {exampleBlockGuide.height} block placement should be designed at {exampleWidthPx}px ×{" "}
            {exampleHeightPx}px.
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={invoiceDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeInvoiceModal();
          } else {
            setInvoiceDialogOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              {invoiceRequest ? `Request for ${invoiceRequest.companyName}` : "Send invoice for this request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-email">Recipient Email</Label>
              <Input
                id="invoice-email"
                type="email"
                value={invoiceEmail}
                onChange={(e) => setInvoiceEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Preview</Label>
              <p className="rounded border border-border/60 bg-background px-3 py-2 text-sm text-foreground">
                {parsedSubject || "Select a request to preview"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Body Preview</Label>
              <div
                className="prose prose-invert max-w-none rounded border border-border/60 bg-background px-3 py-2 text-sm"
                dangerouslySetInnerHTML={{ __html: parsedBody || "<p>Select a request to preview.</p>" }}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeInvoiceModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSendInvoice} disabled={!invoiceEmail || invoiceSending || !invoiceRequest}>
              {invoiceSending ? "Sending…" : "Send Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

