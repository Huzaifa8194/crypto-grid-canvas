import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            The Million Dollar CryptoPage
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Own a piece of Web3 history. 1,000,000 pixels of blockchain-verified digital real estate.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="glow-primary">
              <a href="#buy">Buy Pixels Now</a>
            </Button>
            <Button size="lg" variant="outline">
              <a href="#about">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section id="buy" className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-3xl font-bold">The Canvas</h2>
            <p className="text-muted-foreground">
              Click any available block to purchase your pixels
            </p>
          </div>
          <PixelGrid />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">About the Project</h2>
          <Card className="border-border">
            <CardContent className="p-8 space-y-4 text-muted-foreground">
              <p>
                The Million Dollar CryptoPage is a blockchain-first pixel canvas inspired by the iconic 2005 internet sensation. This platform features a 1000×1000 pixel grid where each pixel costs $1 in USDT.
              </p>
              <p>
                With a minimum purchase of $100 (100 pixels), users can secure their piece of digital history. All purchases are verified on the blockchain, ensuring transparency and authenticity.
              </p>
              <p className="font-semibold text-foreground">
                Each purchase is manually vetted before payment to ensure quality and authenticity.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How much does it cost?",
                a: "Each pixel costs $1 in USDT. The minimum purchase is 100 pixels ($100 USDT).",
              },
              {
                q: "How do I make a purchase?",
                a: "Click on any available grey block on the canvas, fill out the purchase form with your details, and submit. Your request will be manually reviewed before payment.",
              },
              {
                q: "What can I display on my pixels?",
                a: "You can display your logo or image, and link it to your website. All content is subject to approval.",
              },
              {
                q: "Is this blockchain-verified?",
                a: "Yes! All purchases are recorded on the blockchain for transparency and authenticity.",
              },
            ].map((faq, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* NFT Auction Section */}
      <section id="auction" className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">NFT Auction</h2>
          <p className="text-muted-foreground mb-6">
            Special pixel blocks will be auctioned as NFTs. Stay tuned for announcements!
          </p>
          <Button variant="outline">Coming Soon</Button>
        </div>
      </section>

      {/* Press Section */}
      <section id="press" className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-8">Press & Media</h2>
          <p className="text-muted-foreground">
            For press inquiries, please contact us via the contact form below.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Contact Me</h2>
          <p className="text-muted-foreground mb-6">
            Have questions? Want to collaborate? Get in touch!
          </p>
          <Button>Send a Message</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Million Dollar CryptoPage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
