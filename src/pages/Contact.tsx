import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle, Clock } from "lucide-react";
import SEO from "@/components/SEO";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Contact"
        description="Contact The Million Dollar Crypto Page. For inquiries about purchasing pixels, partnerships, or press, reach out at hello@themilliondollarcryptopage.com."
        url="/contact"
        keywords="contact, crypto inquiries, partnership, press contact, web3 support"
      />
      <Navigation />
      <main className="px-3 md:px-6 pt-2 md:pt-3 pb-2 flex-1">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-background to-card p-5 sm:p-8 shadow-xl">
            <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl">
              <div className="absolute left-[-10%] top-[-20%] h-56 w-56 rounded-full bg-primary/30" />
              <div className="absolute bottom-[-10%] right-[-15%] h-64 w-64 rounded-full bg-cyan-400/25" />
            </div>
            <div className="relative space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Get in Touch</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">
                Contact The Million Dollar Crypto Page
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                For inquiries about purchasing pixels, partnerships, or press, please reach out.
              </p>
            </div>
          </section>

          {/* Contact Methods */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <a
                  href="mailto:hello@themilliondollarcryptopage.com"
                  className="block text-lg font-semibold text-foreground hover:text-primary transition-colors break-all"
                >
                  hello@themilliondollarcryptopage.com
                </a>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The best way to reach us for any inquiries about pixels, partnerships, or press.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                  <img src="/x-logo.png" alt="X" className="h-4 w-4" />
                  <span>Follow the Project</span>
                </div>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
                >
                  @MillionDollarCryptoPage
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </a>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stay updated on progress, announcements, and community highlights.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Response Time */}
          <section className="rounded-2xl border border-border/70 bg-secondary/60 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">24-Hour Response Time</h2>
                <p className="text-sm text-muted-foreground">We aim to respond to all inquiries within 24 hours.</p>
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              We are building the definitive community-owned snapshot of the 2026 crypto ecosystem. 
              Whether you're interested in securing pixels, exploring partnership opportunities, or 
              covering our story, we'd love to hear from you.
            </p>
            <div className="pt-2">
              <a
                href="/buy"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
              >
                Secure your pixels now
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

export default Contact;

