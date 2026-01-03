import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { usePress } from "@/context/PressContext";
import { Newspaper, ExternalLink, Calendar, Star, Building2 } from "lucide-react";
import SEO from "@/components/SEO";

const Press = () => {
  const { items, loading } = usePress();

  const featuredItems = items.filter((item) => item.featured);
  const regularItems = items.filter((item) => !item.featured);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Press & Media"
        description="The Million Dollar Crypto Page in the news. Read media coverage, press mentions, and articles about the most ambitious pixel art project in Web3."
        url="/press"
        keywords="crypto news, blockchain press, web3 media, NFT coverage, pixel art news"
      />
      <Navigation />
      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-background to-card p-5 sm:p-7 shadow-lg">
            <div className="pointer-events-none absolute inset-0 opacity-30 blur-3xl">
              <div className="absolute left-[-5%] top-[-20%] h-40 w-40 rounded-full bg-primary/30" />
              <div className="absolute right-[-10%] bottom-[-15%] h-48 w-48 rounded-full bg-cyan-400/25" />
            </div>
            <div className="relative space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
                <Newspaper className="h-3.5 w-3.5" />
                <span>Press & Media</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                In the news.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                The Million Dollar Crypto Page is making waves. Here's what the media is saying about the most ambitious pixel art project in Web3.
              </p>
            </div>
          </section>

          {/* Loading State */}
          {loading && (
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Loading press coverage…</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && (
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-6 text-center">
                <Newspaper className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-semibold text-foreground">Press coverage coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check back later for news and media mentions.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Featured Press Items */}
          {featuredItems.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                <Star className="h-4 w-4 fill-primary" />
                Featured Coverage
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {featuredItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <Card className="h-full border-primary/30 bg-gradient-to-br from-card to-primary/5 transition-all hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.outlet}
                              className="h-14 w-14 rounded-lg border border-border/70 object-contain bg-background flex-shrink-0"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border/70 bg-muted text-muted-foreground flex-shrink-0">
                              <Building2 className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-semibold text-primary">{item.outlet}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.date)}
                              </span>
                            </div>
                            <h3 className="mt-2 text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {item.title}
                            </h3>
                            {item.excerpt && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {item.excerpt}
                              </p>
                            )}
                            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
                              <ExternalLink className="h-3 w-3" />
                              Read article
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* All Press Items */}
          {regularItems.length > 0 && (
            <section className="space-y-4">
              {featuredItems.length > 0 && (
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  More Coverage
                </h2>
              )}
              <Card className="border-border/70 bg-card/80">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {regularItems.map((item) => (
                      <a
                        key={item.id}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-start gap-4 p-4 transition-colors hover:bg-secondary/30"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.outlet}
                            className="h-12 w-12 rounded border border-border/70 object-contain bg-background flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded border border-border/70 bg-muted text-muted-foreground flex-shrink-0">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{item.outlet}</span>
                            <span>•</span>
                            <span>{formatDate(item.date)}</span>
                          </div>
                          <h3 className="mt-1 font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Media Contact Section */}
          <section className="rounded-2xl border border-border/70 bg-secondary/60 p-5 sm:p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Media inquiries</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Are you a journalist or content creator interested in covering The Million Dollar Crypto Page? 
              We'd love to hear from you.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
              >
                Get in touch
              </a>
              <p className="text-sm text-muted-foreground">
                Press kit and brand assets available upon request.
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

export default Press;

