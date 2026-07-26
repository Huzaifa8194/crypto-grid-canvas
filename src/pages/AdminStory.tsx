import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useStorySettings } from "@/context/StorySettingsContext";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2, ArrowUp, ArrowDown, Eye } from "lucide-react";
import SEO from "@/components/SEO";

const AdminStory = () => {
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useStorySettings();

  const [title, setTitle] = useState("");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [boldCallout, setBoldCallout] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync form with loaded settings
  useEffect(() => {
    if (!loading) {
      setTitle(settings.title);
      setParagraphs(settings.paragraphs || []);
      setBoldCallout(settings.boldCallout || "");
    }
  }, [loading, settings]);

  const handleAddParagraph = () => {
    setParagraphs((prev) => [...prev, ""]);
  };

  const handleRemoveParagraph = (index: number) => {
    setParagraphs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParagraphChange = (index: number, value: string) => {
    setParagraphs((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setParagraphs((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === paragraphs.length - 1) return;
    setParagraphs((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    // Clean up empty paragraphs
    const cleanedParagraphs = paragraphs.map((p) => p.trim()).filter(Boolean);

    setSaving(true);
    try {
      await updateSettings({
        title: title.trim(),
        paragraphs: cleanedParagraphs,
        boldCallout: boldCallout.trim(),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save story settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <SEO title="Edit Story" noIndex />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Edit The Story</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="secondary" onClick={() => navigate("/story")}>
            View Story Page
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Editor Form */}
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Story Content Editor</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading settings…</p>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="story-title">Headline / Title *</Label>
                  <Input
                    id="story-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Welcome to The Million Dollar Crypto Page"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This headline will display at the top of the Story section.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Paragraphs</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      onClick={handleAddParagraph}
                    >
                      <Plus className="h-3 w-3" /> Add Paragraph
                    </Button>
                  </div>

                  {paragraphs.length === 0 ? (
                    <div className="rounded border border-dashed border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground">No paragraphs added. Click above to add one.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paragraphs.map((para, idx) => (
                        <div key={idx} className="flex gap-2 items-start rounded border border-border bg-background/50 p-2.5 shadow-sm">
                          <span className="text-xs font-mono font-bold text-muted-foreground/80 mt-2 px-1">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            <Textarea
                              value={para}
                              onChange={(e) => handleParagraphChange(idx, e.target.value)}
                              placeholder={`Enter paragraph #${idx + 1}...`}
                              rows={3}
                              className="resize-y"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              disabled={idx === 0}
                              onClick={() => handleMoveUp(idx)}
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              disabled={idx === paragraphs.length - 1}
                              onClick={() => handleMoveDown(idx)}
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleParagraphChange(idx, "") || handleRemoveParagraph(idx)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Rearrange, add, or delete paragraphs. Empty paragraphs are automatically ignored.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bold-callout">Bottom Callout (Bold Text)</Label>
                  <Input
                    id="bold-callout"
                    value={boldCallout}
                    onChange={(e) => setBoldCallout(e.target.value)}
                    placeholder="How fast can the Web3 community move?"
                  />
                  <p className="text-xs text-muted-foreground">
                    This represents the closing highlighted text at the bottom.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="border border-border/60 bg-card/80 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between py-6">
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-background to-card p-6 shadow-xl">
              <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl">
                <div className="absolute left-[-10%] top-[-20%] h-48 w-48 rounded-full bg-primary/20" />
                <div className="absolute bottom-[-10%] right-[-15%] h-56 w-56 rounded-full bg-cyan-400/15" />
              </div>
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>The Story</span>
                </div>
                <h1 className="text-2xl font-bold leading-tight text-foreground">
                  {title || "Welcome to The Million Dollar Crypto Page"}
                </h1>
                
                <div className="space-y-3">
                  {paragraphs.filter(Boolean).map((para, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
                      {para}
                    </p>
                  ))}
                  {paragraphs.filter(Boolean).length === 0 && (
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      No paragraph text entered yet.
                    </p>
                  )}
                </div>

                {boldCallout && (
                  <p className="text-sm font-semibold text-foreground leading-relaxed mt-2 pt-2 border-t border-border/40">
                    {boldCallout}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-muted-foreground border-t border-border/40 pt-4">
              Note: This is a live simulation of the public page's layout.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStory;
