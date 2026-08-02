import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useFAQ } from "@/context/FAQContext";
import { HelpCircle, Sparkles, MessageSquare } from "lucide-react";
import SEO from "@/components/SEO";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const { items, loading } = useFAQ();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Frequently Asked Questions"
        description="Got questions about The Million Dollar Crypto Page? Find answers about pixel buying, blockchain transactions, NFT auctions, and community history."
        url="/faq"
        keywords="faq, help, crypto grid, pixel art, web3 help, how to buy pixels, million dollar homepage"
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
                <HelpCircle className="h-3.5 w-3.5" />
                <span>FAQ & Help</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-[0.05em]">
                Frequently Asked Questions
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Everything you need to know about purchasing pixels, promoting your Web3 project, and participating in the historic Million Dollar Crypto Page.
              </p>
            </div>
          </section>

          {/* Loading State */}
          {loading && (
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Loading questions and answers…</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && (
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-8 text-center space-y-4">
                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 animate-pulse" />
                <p className="text-lg font-semibold text-foreground">No questions found</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Our team is compiling the list of answers to help you navigate. Check back soon or contact support directly if you have urgent questions.
                </p>
              </CardContent>
            </Card>
          )}

          {/* FAQ Accordion Section */}
          {!loading && items.length > 0 && (
            <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 shadow-md">
              <Accordion type="single" collapsible className="w-full space-y-3">
                {items.map((item) => (
                  <AccordionItem 
                    key={item.id} 
                    value={item.id}
                    className="border border-border/50 rounded-xl bg-card/50 px-4 transition-all duration-200 hover:border-primary/30 data-[state=open]:border-primary/50 data-[state=open]:shadow-md data-[state=open]:shadow-primary/5"
                  >
                    <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground py-4 text-left hover:text-primary transition-colors hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-2 pb-5 border-t border-border/20 mt-1 whitespace-pre-wrap">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* Still Need Help Section */}
          <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-secondary/60 p-5 sm:p-6 space-y-4">
            <div className="pointer-events-none absolute right-[-5%] top-[-20%] h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5 border border-primary/20">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-xl font-bold text-foreground">Still have questions?</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                  If you didn't find the answers you're looking for, or if you need assistance with custom pixel sizes or bulk reservations, feel free to reach out to our team.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
                  >
                    Contact Support
                  </a>
                  <p className="text-xs text-muted-foreground">
                    We typical respond within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
