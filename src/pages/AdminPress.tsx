import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePress } from "@/context/PressContext";
import { type PressItem } from "@/types/press";
import { toast } from "sonner";
import { Star, ExternalLink, Calendar, Building2 } from "lucide-react";

const AdminPress = () => {
  const navigate = useNavigate();
  const { items, loading, error, addItem, deleteItem, moveItem, toggleFeatured } = usePress();
  
  const [form, setForm] = useState({
    title: "",
    outlet: "",
    date: "",
    excerpt: "",
    link: "",
    featured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.outlet || !form.link || !form.date) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await addItem({
        title: form.title,
        outlet: form.outlet,
        date: new Date(form.date).getTime(),
        excerpt: form.excerpt || undefined,
        link: form.link,
        featured: form.featured,
        file: imageFile || undefined,
      });
      setForm({ title: "", outlet: "", date: "", excerpt: "", link: "", featured: false });
      setImageFile(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: PressItem) => {
    const confirmed = window.confirm(`Remove "${item.title}" from press items?`);
    if (!confirmed) return;
    setDeletingId(item.id);
    try {
      await deleteItem(item);
    } finally {
      setDeletingId((prev) => (prev === item.id ? null : prev));
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Manage Press</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="secondary" onClick={() => navigate("/press")}>
            View Press Page
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Add Press Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="press-title">Headline *</Label>
                <Input
                  id="press-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="The Million Dollar Crypto Page launches..."
                  required
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="press-outlet">Media Outlet *</Label>
                  <Input
                    id="press-outlet"
                    value={form.outlet}
                    onChange={(e) => setForm((prev) => ({ ...prev, outlet: e.target.value }))}
                    placeholder="CoinDesk"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="press-date">Publication Date *</Label>
                  <Input
                    id="press-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="press-link">Article URL *</Label>
                <Input
                  id="press-link"
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                  placeholder="https://coindesk.com/article/..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="press-excerpt">Excerpt / Summary (optional)</Label>
                <Textarea
                  id="press-excerpt"
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A brief description or quote from the article..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="press-image">Outlet Logo / Thumbnail (optional)</Label>
                <Input
                  id="press-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground">Selected: {imageFile.name}</p>
                )}
              </div>

              <div className="flex items-center gap-3 rounded border border-border/60 bg-secondary/30 p-3">
                <Switch
                  id="press-featured"
                  checked={form.featured}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, featured: checked }))}
                />
                <Label htmlFor="press-featured" className="cursor-pointer">
                  <span className="font-semibold">Featured</span>
                  <p className="text-xs text-muted-foreground">Highlight this item at the top of the press page</p>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Adding..." : "Add Press Item"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Press Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading press items…</p>}
            {error && <p className="text-sm text-red-400">Unable to load: {error.toLowerCase()}</p>}
            {!loading && items.length === 0 && (
              <p className="text-sm text-muted-foreground">No press items yet. Add your first one!</p>
            )}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`rounded border p-3 transition ${
                    item.featured
                      ? "border-yellow-500/50 bg-yellow-500/5"
                      : "border-border/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.outlet}
                        className="h-12 w-12 rounded border border-border object-contain bg-background"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded border border-border/70 bg-muted text-muted-foreground">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground line-clamp-2">{item.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-primary">{item.outlet}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.date)}
                            </span>
                          </div>
                        </div>
                        {item.featured && (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      {item.excerpt && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.excerpt}</p>
                      )}
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline hover:text-primary/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Article
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveItem(item.id, "up")}
                    >
                      ↑ Up
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(item.id, "down")}
                    >
                      ↓ Down
                    </Button>
                    <Button
                      type="button"
                      variant={item.featured ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => toggleFeatured(item.id)}
                    >
                      <Star className={`mr-1 h-3 w-3 ${item.featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      {item.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="ml-auto"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item)}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPress;

