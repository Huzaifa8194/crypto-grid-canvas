import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirstBuyers } from "@/context/FirstBuyersContext";

const FirstBuyers = () => {
  const { buyers, loading } = useFirstBuyers();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-background to-card p-5 sm:p-7 shadow-lg">
            <div className="pointer-events-none absolute inset-0 opacity-30 blur-3xl">
              <div className="absolute left-[-5%] top-[-20%] h-40 w-40 rounded-full bg-primary/30" />
              <div className="absolute right-[-10%] bottom-[-15%] h-48 w-48 rounded-full bg-cyan-400/25" />
            </div>
            <div className="relative space-y-3 sm:space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                First Buyers
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                The pioneers.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                The first to secure their place on the grid. Listed in the order they joined.
              </p>
            </div>
          </section>

          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-foreground">Founding placements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading buyers…</p>
              ) : buyers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No first buyers have been added yet.</p>
              ) : (
                <ol className="space-y-4">
                  {buyers.map((buyer, index) => (
                    <li
                      key={buyer.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/70 bg-secondary/50 p-3 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        <img
                          src={buyer.imageUrl}
                          alt={buyer.title}
                          className="h-12 w-12 rounded border border-border object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-semibold text-foreground">{buyer.title}</span>
                          {buyer.link && (
                            <a
                              href={buyer.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-primary underline"
                            >
                              Visit
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{buyer.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
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

export default FirstBuyers;
