import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFirstBuyers } from "@/context/FirstBuyersContext";
import { usePixelMetadata } from "@/context/PixelMetadataContext";
import { type FirstBuyer } from "@/types/firstBuyer";
import { toast } from "sonner";

const AdminFirstBuyers = () => {
  const navigate = useNavigate();
  const { buyers, loading, error, addBuyer, deleteBuyer, moveBuyer } = useFirstBuyers();
  const { regions } = usePixelMetadata();
  const [form, setForm] = useState({ title: "", link: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileSource, setImageFileSource] = useState<"manual" | "autofill" | null>(null);
  const [imageFileLabel, setImageFileLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFileFromUrl = useCallback(async (url: string, fallbackName: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    const blob = await response.blob();
    const ext = blob.type?.split("/").pop() || "png";
    return new File([blob], `${fallbackName}.${ext}`, { type: blob.type || "image/*" });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!imageFile) return;
    setSubmitting(true);
    try {
      await addBuyer({
        title: form.title,
        description: form.description,
        link: form.link || undefined,
        file: imageFile,
      });
      setForm({ title: "", link: "", description: "" });
      setImageFile(null);
       setImageFileSource(null);
       setImageFileLabel("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (buyer: FirstBuyer) => {
    const confirmed = window.confirm(`Remove ${buyer.title} from the First Buyers list?`);
    if (!confirmed) return;
    setDeletingId(buyer.id);
    try {
      await deleteBuyer(buyer);
    } finally {
      setDeletingId((prev) => (prev === buyer.id ? null : prev));
    }
  };

  const handleUsePlacement = async (regionId: string) => {
    const region = regions.find((entry) => entry.id === regionId);
    if (!region) return;
    setForm({
      title: region.title,
      link: region.link ?? "",
      description: region.description,
    });
    const imageSource = region.imageDataUrl ?? region.imageUrl;
    if (!imageSource) {
      toast.warning("Placement has no image to reuse.");
      return;
    }
    try {
      const file = await fetchFileFromUrl(imageSource, `region-${region.id}`);
      setImageFile(file);
      setImageFileSource("autofill");
      setImageFileLabel(file.name);
      toast.info(`Loaded ${region.title} placement into the First Buyers form.`);
    } catch (err) {
      console.error("Failed to autofill placement image", err);
      toast.error("Could not fetch placement image. Please upload manually.");
      setImageFile(null);
      setImageFileSource(null);
      setImageFileLabel("");
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Manage First Buyers</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Add First Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fb-title">Title</Label>
                <Input
                  id="fb-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-link">Link (optional)</Label>
                <Input
                  id="fb-link"
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-description">Description</Label>
                <Textarea
                  id="fb-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-image">Image</Label>
                <Input
                  id="fb-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] || null);
                    setImageFileSource(e.target.files?.[0] ? "manual" : null);
                    setImageFileLabel(e.target.files?.[0]?.name ?? "");
                  }}
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected image: {imageFileLabel || imageFile.name}{" "}
                    {imageFileSource === "autofill" ? "(autofilled)" : ""}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !imageFile}>
                {submitting ? "Adding..." : "Add First Buyer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Current List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading first buyers…</p>}
            {error && <p className="text-sm text-red-400">Unable to load: {error.toLowerCase()}</p>}
            {!loading && buyers.length === 0 && <p className="text-sm text-muted-foreground">No first buyers yet.</p>}
            <div className="space-y-4">
              {buyers.map((buyer, index) => (
                <div key={buyer.id} className="rounded border border-border/60 p-3">
                  <div className="flex items-center gap-3">
                    <img src={buyer.imageUrl} alt={buyer.title} className="h-12 w-12 rounded border border-border object-cover" />
                    <div>
                      <p className="font-semibold text-foreground">{buyer.title}</p>
                      {buyer.link && (
                        <a href={buyer.link} target="_blank" rel="noreferrer" className="text-xs underline hover:text-foreground">
                          {buyer.link}
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{buyer.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveBuyer(buyer.id, "up")}
                    >
                      Move Up
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={index === buyers.length - 1}
                      onClick={() => moveBuyer(buyer.id, "down")}
                    >
                      Move Down
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="ml-auto"
                      disabled={deletingId === buyer.id}
                      onClick={() => handleDelete(buyer)}
                    >
                      {deletingId === buyer.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Assigned Regions</CardTitle>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No metadata has been assigned yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {regions.map((region) => (
                <div key={region.id} className="rounded border border-border/50 p-3 space-y-3">
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
                      {region.link && (
                        <a href={region.link} target="_blank" rel="noreferrer" className="text-xs underline hover:text-foreground">
                          Link preview
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{region.description}</p>
                  <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => void handleUsePlacement(region.id)}>
                    Use For First Buyer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFirstBuyers;

