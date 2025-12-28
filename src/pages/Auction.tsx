import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Gavel, Sparkles } from "lucide-react";

const Auction = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">NFT Auction</h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Once all 1,000,000 pixels sell out, history will have been made.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                The completed artwork will be auctioned as a historic NFT. 100% of the proceeds will be distributed back to the pixel holders.
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                  A shared upside
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  The earlier you buy, and the more pixels you own, the greater your share of the final auction.
                </p>
                <p className="leading-relaxed">
                  Pixel ownership equals participation. Every holder has a stake in how this story is written.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gavel className="h-4 w-4 text-primary" />
                  Countdown to the drop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  Once the last pixel is claimed, the clock starts ticking toward the auction reveal.
                </p>
                <p className="leading-relaxed">
                  We are looking forward to this journey, and hope you will be a part of it.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="rounded-2xl border border-border/70 bg-secondary/60 p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.18em] text-primary font-semibold">Get listed before the hammer falls</p>
              <p className="text-base sm:text-lg text-foreground font-semibold">
                Secure pixels now to maximize your share when the NFT is auctioned.
              </p>
            </div>
            <a
              href="/buy"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
            >
              Buy pixels
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </section>
        </div>
      </main>

      <footer className="py-1.5 px-3 text-center border-t border-border/50">
        <p className="text-[0.5rem] sm:text-[0.55rem] text-muted-foreground/70 whitespace-nowrap overflow-hidden text-ellipsis">
          The Million Dollar Crypto Page © 2026. All rights reserved. Logos displayed are property of their respective owners. We are not responsible for content on external linked sites.
        </p>
      </footer>
    </div>
  );
};

export default Auction;

