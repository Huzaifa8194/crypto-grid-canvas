import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, ShieldCheck, Timer } from "lucide-react";
import SEO from "@/components/SEO";

const Story = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="The Story"
        description="Welcome to The Million Dollar Crypto Page—the homepage for Web3 companies. A live snapshot of who's building the future in 2026. Secure your permanent block and stake in crypto's biggest community page."
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
                Welcome to The Million Dollar Crypto Page
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                The homepage for Web3 companies—a live snapshot of who's building the future in 2026.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Secure your permanent block. Get a lasting link and a stake in the future of crypto's biggest community page.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                This is just the starting point. From here, we build more—features, products, connections—driven by the community that fills this canvas.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                In 2005, Alex Tew launched The Million Dollar Homepage and sold a million pixels in 138 days.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Now, 21 years later, the future is crypto.
              </p>
              <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
                How fast can the Web3 community move?
              </p>
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



