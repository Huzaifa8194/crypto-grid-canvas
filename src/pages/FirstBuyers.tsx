import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirstBuyers } from "@/context/FirstBuyersContext";

const FirstBuyers = () => {
  const { buyers, loading } = useFirstBuyers();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">First Buyers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading buyers…</p>
              ) : buyers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No first buyers have been added yet.</p>
              ) : (
                <ul className="space-y-4">
                  {buyers.map((buyer) => (
                    <li key={buyer.id} className="flex gap-4 rounded border border-border/60 p-3">
                      <img
                        src={buyer.imageUrl}
                        alt={buyer.title}
                        className="h-12 w-12 rounded border border-border object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">{buyer.title}</span>
                          {buyer.link && (
                            <a
                              href={buyer.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Visit
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{buyer.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
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
