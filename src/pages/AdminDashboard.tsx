import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PixelGrid from "@/components/PixelGrid";
import { useAuth } from "@/context/AuthContext";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { useBuyRequests } from "@/hooks/useBuyRequests";
import { type SelectionRect } from "@/types/pixels";
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "sonner";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const AdminDashboard = () => {
  const { logout } = useAuth();
  const { regions, lockedBlocks, upsertRegion } = usePixelMetadata();
  const { requests, loading: requestsLoading, error: requestsError } = useBuyRequests();

  const [selectedPixels, setSelectedPixels] = useState(0);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const selectionSummary = useMemo(() => {
    if (!selectionRect) return null;
    return {
      blocks: selectionRect.blockCount,
      pixels: selectionRect.pixelCount,
      width: selectionRect.width,
      height: selectionRect.height,
    };
  }, [selectionRect]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLink("");
    setImageFile(null);
  };

  const handleAssignMetadata = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectionRect || selectedPixels === 0) {
      setAssignError("Select an available block area before assigning metadata.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setAssignError("Title and description are required.");
      return;
    }
    if (!imageFile) {
      setAssignError("Upload an image for this placement.");
      return;
    }

    setAssigning(true);
    setAssignError(null);
    try {
      const id = crypto.randomUUID();
      const storagePath = `pixel-metadata/${id}/${imageFile.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, imageFile);
      const imageUrl = await getDownloadURL(fileRef);
      const imageDataUrl = await fileToDataUrl(imageFile);
      const timestamp = Date.now();

      await upsertRegion({
        id,
        bounds: selectionRect,
        title: title.trim(),
        description: description.trim(),
        link: link.trim() || undefined,
        imageUrl,
        imageStoragePath: storagePath,
        imageDataUrl,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      toast.success("Metadata saved locally and synced to Firebase.");
      resetForm();
      setSelectionRect(null);
      setSelectedPixels(0);
    } catch (err) {
      console.error("Failed to assign metadata", err);
      setAssignError("Failed to save metadata. Please retry.");
      toast.error("Metadata save failed. See console for details.");
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Admin Dashboard</h1>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

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
              onSelectionChange={setSelectedPixels}
              onSelectionComplete={(rect, pixels) => {
                setSelectionRect(rect);
                setSelectedPixels(pixels);
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

            <form className="space-y-4" onSubmit={handleAssignMetadata}>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link (Optional)</Label>
                <Input id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
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
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>
              {assignError && <p className="text-xs text-red-400">{assignError}</p>}
              <Button type="submit" className="w-full" disabled={assigning || selectedPixels === 0}>
                {assigning ? "Assigning..." : "Assign Metadata"}
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
            {requestsLoading && <p className="text-sm text-muted-foreground">Loading purchase requests…</p>}
            {requestsError && (
              <p className="text-sm text-red-400">Failed to load requests: {requestsError.toLowerCase()}</p>
            )}
            {!requestsLoading && requests.length === 0 && (
              <p className="text-sm text-muted-foreground">No purchase requests have been submitted yet.</p>
            )}
            <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-2">
              {requests.map((request) => (
                <div key={request.id} className="rounded border border-border/50 p-3 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{request.companyName}</p>
                      <a href={`mailto:${request.email}`} className="text-xs underline hover:text-foreground">
                        {request.email}
                      </a>
                    </div>
                    <span className="text-xs">
                      {new Date(request.createdAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <div>Blocks: {request.selectedBlocks.toLocaleString()}</div>
                    <div>Pixels: {request.selectedPixels.toLocaleString()}</div>
                    {request.selectionRect && (
                      <div className="sm:col-span-2">
                        Selection: {request.selectionRect.width} x {request.selectionRect.height} blocks
                      </div>
                    )}
                    {request.telegram && <div>Telegram: {request.telegram}</div>}
                    {request.promoCode && <div>Promo: {request.promoCode}</div>}
                  </div>
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
                </div>
              ))}
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
              {regions.map((region) => (
                <div key={region.id} className="rounded border border-border/50 p-3">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

