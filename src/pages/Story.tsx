import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, ShieldCheck, Timer } from "lucide-react";
import SEO from "@/components/SEO";

const Story = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="The Story"
        description="In 2005, a student filled a million-pixel homepage in 138 days. Now, 21 years later, it's time for the next chapter. This is the homepage for crypto—a live snapshot of Web3 in 2026."
        url="/story"
        keywords="million dollar homepage, crypto history, web3 story, pixel art history, blockchain marketing"
      />
      <Navigation />
      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-background to-card p-5 sm:p-8 shadow-xl">
            <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl">
              <div className="absolute left-[-10%] top-[-20%] h-56 w-56 rounded-full bg-primary/30" />
              <div className="absolute bottom-[-10%] right-[-15%] h-64 w-64 rounded-full bg-cyan-400/25" />
            </div>
            <div className="relative space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>The Story</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">
                Which Web3 projects will stand the test of time?
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                In 2005, a student filled a million-pixel homepage in 138 days. It became the directory of the early web.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Now, 21 years later, it is time for the next chapter. This is the homepage for crypto—a live snapshot of who is building the future in 2026.
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-3 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Secure Your Block</span>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Secure your block. Get a permanent link. Be seen as an early backer and a fast mover. Get listed on a timeless page among crypto’s key companies.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Join the biggest marketing page in crypto, with a stake in its future.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-3 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                  <Timer className="h-4 w-4" />
                  <span>A Timeless Auction</span>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Once the canvas is complete, the finished artwork will be auctioned as a historic NFT, with 100% of the proceeds distributed back to every project on the grid.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Your share is based on how many pixels you own and how early you bought them.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="rounded-2xl border border-border/70 bg-secondary/60 p-5 sm:p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">The momentum</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              This is just the starting point. From here, we build more—features, products, connections—driven by the community that fills this canvas.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-semibold text-foreground">
                The original took 138 days. How fast can the Web3 community move?
              </p>
              <a
                href="/buy"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
              >
                Secure a block
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
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

export default Story;



