import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuctionSettings } from "@/context/AuctionSettingsContext";
import { toast } from "sonner";
import { Gavel, Sparkles, Plus, Trash2, ArrowUp, ArrowDown, Eye, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

const AdminAuction = () => {
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useAuctionSettings();

  const [heroTitle, setHeroTitle] = useState("");
  const [heroParagraphs, setHeroParagraphs] = useState<string[]>([]);
  
  const [card1Title, setCard1Title] = useState("");
  const [card1Paragraphs, setCard1Paragraphs] = useState<string[]>([]);

  const [card2Title, setCard2Title] = useState("");
  const [card2Paragraphs, setCard2Paragraphs] = useState<string[]>([]);

  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerButtonText, setBannerButtonText] = useState("");
  
  const [saving, setSaving] = useState(false);

  // Sync form with loaded settings
  useEffect(() => {
    if (!loading) {
      setHeroTitle(settings.heroTitle || "");
      setHeroParagraphs(settings.heroParagraphs || []);
      setCard1Title(settings.card1Title || "");
      setCard1Paragraphs(settings.card1Paragraphs || []);
      setCard2Title(settings.card2Title || "");
      setCard2Paragraphs(settings.card2Paragraphs || []);
      setBannerSubtitle(settings.bannerSubtitle || "");
      setBannerTitle(settings.bannerTitle || "");
      setBannerButtonText(settings.bannerButtonText || "");
    }
  }, [loading, settings]);

  // Generic paragraph list helpers
  const handleAddParagraph = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const handleRemoveParagraph = (idx: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleParagraphChange = (idx: number, val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  const handleMoveUp = (idx: number, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    if (idx === 0) return;
    setter((prev) => {
      const updated = [...prev];
      const temp = updated[idx - 1];
      updated[idx - 1] = updated[idx];
      updated[idx] = temp;
      return updated;
    });
  };

  const handleMoveDown = (idx: number, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    if (idx === list.length - 1) return;
    setter((prev) => {
      const updated = [...prev];
      const temp = updated[idx + 1];
      updated[idx + 1] = updated[idx];
      updated[idx] = temp;
      return updated;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!heroTitle.trim() || !card1Title.trim() || !card2Title.trim()) {
      toast.error("Titles are required for Hero, Card 1, and Card 2.");
      return;
    }

    const cleanHeroParagraphs = heroParagraphs.map((p) => p.trim()).filter(Boolean);
    const cleanCard1Paragraphs = card1Paragraphs.map((p) => p.trim()).filter(Boolean);
    const cleanCard2Paragraphs = card2Paragraphs.map((p) => p.trim()).filter(Boolean);

    setSaving(true);
    try {
      await updateSettings({
        heroTitle: heroTitle.trim(),
        heroParagraphs: cleanHeroParagraphs,
        card1Title: card1Title.trim(),
        card1Paragraphs: cleanCard1Paragraphs,
        card2Title: card2Title.trim(),
        card2Paragraphs: cleanCard2Paragraphs,
        bannerSubtitle: bannerSubtitle.trim(),
        bannerTitle: bannerTitle.trim(),
        bannerButtonText: bannerButtonText.trim(),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save auction settings.");
    } finally {
      setSaving(false);
    }
  };

  // Reusable Paragraph Editor Component UI helper
  const renderParagraphEditor = (
    label: string, 
    list: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <div className="space-y-3 rounded-lg border border-border/80 bg-background/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-[0.7rem] px-2"
          onClick={() => handleAddParagraph(setter)}
        >
          <Plus className="h-2.5 w-2.5" /> Add Paragraph
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded border border-dashed border-border/60 p-3 text-center bg-background/20">
          <p className="text-[0.7rem] text-muted-foreground italic">No paragraphs. Click add to write one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((para, idx) => (
            <div key={idx} className="flex gap-2 items-start rounded border border-border bg-background/50 p-2 shadow-sm">
              <span className="text-[0.65rem] font-mono font-bold text-muted-foreground/80 mt-2 px-1">
                #{idx + 1}
              </span>
              <div className="flex-1">
                <Textarea
                  value={para}
                  onChange={(e) => handleParagraphChange(idx, e.target.value, setter)}
                  placeholder={`Paragraph #${idx + 1}`}
                  rows={2}
                  className="text-xs py-1.5 min-h-[50px] resize-y"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx, setter, list)}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground"
                  disabled={idx === list.length - 1}
                  onClick={() => handleMoveDown(idx, setter, list)}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveParagraph(idx, setter)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <SEO title="Edit Auction" noIndex />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Edit NFT Auction</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="secondary" onClick={() => navigate("/auction")}>
            View Auction Page
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Editor Form */}
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Auction Content Editor</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading settings…</p>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* HERO SECTION */}
                <div className="space-y-3 rounded-xl border border-border p-4 bg-background/20">
                  <h3 className="text-sm font-semibold text-primary">1. Hero Section</h3>
                  <div className="space-y-2">
                    <Label htmlFor="hero-title">Hero Title *</Label>
                    <Input
                      id="hero-title"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="NFT Auction"
                      required
                    />
                  </div>
                  {renderParagraphEditor("Hero Paragraphs", heroParagraphs, setHeroParagraphs)}
                </div>

                {/* CARDS SECTION */}
                <div className="space-y-4 rounded-xl border border-border p-4 bg-background/20">
                  <h3 className="text-sm font-semibold text-primary">2. Cards Section</h3>
                  
                  {/* Card 1 */}
                  <div className="space-y-3 p-3 rounded-lg border border-border/80 bg-background/40">
                    <div className="space-y-2">
                      <Label htmlFor="card1-title">Card 1 Title *</Label>
                      <Input
                        id="card1-title"
                        value={card1Title}
                        onChange={(e) => setCard1Title(e.target.value)}
                        placeholder="A shared upside"
                        required
                      />
                    </div>
                    {renderParagraphEditor("Card 1 Paragraphs", card1Paragraphs, setCard1Paragraphs)}
                  </div>

                  {/* Card 2 */}
                  <div className="space-y-3 p-3 rounded-lg border border-border/80 bg-background/40">
                    <div className="space-y-2">
                      <Label htmlFor="card2-title">Card 2 Title *</Label>
                      <Input
                        id="card2-title"
                        value={card2Title}
                        onChange={(e) => setCard2Title(e.target.value)}
                        placeholder="Countdown to the drop"
                        required
                      />
                    </div>
                    {renderParagraphEditor("Card 2 Paragraphs", card2Paragraphs, setCard2Paragraphs)}
                  </div>
                </div>

                {/* BANNER SECTION */}
                <div className="space-y-3 rounded-xl border border-border p-4 bg-background/20">
                  <h3 className="text-sm font-semibold text-primary">3. Callout Banner</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="banner-subtitle">Banner Subtitle</Label>
                    <Input
                      id="banner-subtitle"
                      value={bannerSubtitle}
                      onChange={(e) => setBannerSubtitle(e.target.value)}
                      placeholder="Get listed before the hammer falls"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner-title">Banner Main Text</Label>
                    <Input
                      id="banner-title"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder="Secure pixels now to maximize your share..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner-button">Banner Button Text</Label>
                    <Input
                      id="banner-button"
                      value={bannerButtonText}
                      onChange={(e) => setBannerButtonText(e.target.value)}
                      placeholder="Buy pixels"
                    />
                  </div>
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
          <CardContent className="flex-1 flex flex-col justify-between py-6 space-y-6">
            <div className="space-y-6">
              {/* Hero Preview */}
              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-background via-card to-secondary p-6 shadow-xl">
                <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl">
                  <div className="absolute left-[-10%] top-[-10%] h-40 w-40 rounded-full bg-primary/20" />
                  <div className="absolute right-[-15%] bottom-[-10%] h-48 w-48 rounded-full bg-cyan-400/15" />
                </div>
                <div className="relative flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-primary self-start">
                    <Gavel className="h-3 w-3" />
                    <span>NFT Auction</span>
                  </div>
                  <h1 className="text-2xl font-bold leading-tight text-foreground">
                    {heroTitle || "NFT Auction"}
                  </h1>
                  <div className="space-y-2">
                    {heroParagraphs.filter(Boolean).map((para, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
                        {para}
                      </p>
                    ))}
                    {heroParagraphs.filter(Boolean).length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No hero paragraph copy.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards Preview */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/70 bg-card/80">
                  <div className="p-4 space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {card1Title || "Card 1 Title"}
                    </h3>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {card1Paragraphs.filter(Boolean).map((p, idx) => (
                        <p key={idx} className="leading-relaxed">{p}</p>
                      ))}
                      {card1Paragraphs.filter(Boolean).length === 0 && (
                        <p className="italic">No paragraphs.</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="border-border/70 bg-card/80">
                  <div className="p-4 space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Gavel className="h-3.5 w-3.5 text-primary" />
                      {card2Title || "Card 2 Title"}
                    </h3>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {card2Paragraphs.filter(Boolean).map((p, idx) => (
                        <p key={idx} className="leading-relaxed">{p}</p>
                      ))}
                      {card2Paragraphs.filter(Boolean).length === 0 && (
                        <p className="italic">No paragraphs.</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Banner Preview */}
              <div className="rounded-2xl border border-border/70 bg-secondary/60 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-primary font-semibold">
                    {bannerSubtitle || "Banner Subtitle"}
                  </p>
                  <p className="text-xs text-foreground font-semibold">
                    {bannerTitle || "Banner Main Text"}
                  </p>
                </div>
                <div className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-[0.7rem] font-semibold text-primary-foreground shadow">
                  {bannerButtonText || "Buy pixels"}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground border-t border-border/40 pt-4">
              Note: This is a live simulation of the public page's layout.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuction;
