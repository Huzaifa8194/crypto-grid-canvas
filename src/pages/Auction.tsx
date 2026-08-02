import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Gavel, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { useAuctionSettings } from "@/context/AuctionSettingsContext";

const Auction = () => {
  const { settings } = useAuctionSettings();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="NFT Auction"
        description="Once all 1,000,000 pixels sell out, the completed canvas will be auctioned as a historic NFT. 100% of proceeds distributed to pixel owners based on their stake."
        url="/auction"
        keywords="NFT auction, crypto art, blockchain collectible, pixel NFT, web3 auction"
      />
      <Navigation />
      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-background via-card to-secondary p-5 sm:p-8 shadow-xl">
            <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl">
              <div className="absolute left-[-10%] top-[-10%] h-48 w-48 rounded-full bg-primary/30" />
              <div className="absolute right-[-15%] bottom-[-10%] h-56 w-56 rounded-full bg-cyan-400/25" />
            </div>
            <div className="relative flex flex-col gap-4 sm:gap-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
                <Gavel className="h-3.5 w-3.5" />
                <span>NFT Auction</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">
                {settings.heroTitle}
              </h1>
              {settings.heroParagraphs?.map((paragraph, index) => (
                <p key={index} className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {settings.card1Title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                {settings.card1Paragraphs?.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gavel className="h-4 w-4 text-primary" />
                  {settings.card2Title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                {settings.card2Paragraphs?.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="rounded-2xl border border-border/70 bg-secondary/60 p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.18em] text-primary font-semibold">
                {settings.bannerSubtitle}
              </p>
              <p className="text-base sm:text-lg text-foreground font-semibold">
                {settings.bannerTitle}
              </p>
            </div>
            <a
              href="/buy"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
            >
              {settings.bannerButtonText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auction;



