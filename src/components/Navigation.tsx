import { useState } from "react";
import { Menu, Twitter, X } from "lucide-react";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Buy Pixels", href: "/buy" },
    { name: "The Story", href: "/story" },
    { name: "NFT Auction", href: "/auction" },
    { name: "Press", href: "/press" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-5 md:px-10">
        <div className="grid h-10 grid-cols-[1fr_auto_1fr] items-center text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Twitter className="h-4 w-4" />
              <span className="hidden sm:inline tracking-[0.2em]">Twitter</span>
            </a>
          </div>

          <nav className="hidden items-center justify-center gap-3 md:flex">
            {navItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <a
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.name}
                </a>
                {index < navItems.length - 1 && (
                  <span className="text-xs text-primary/70">|</span>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center justify-end md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded border border-border/60 bg-background/40 p-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-2 rounded border border-border/80 bg-background/95 p-4 shadow-lg md:hidden">
            <nav className="flex flex-col gap-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        )}

        <div className="py-3 text-center">
          <h1 className="text-xl font-bold uppercase tracking-[0.4em] text-foreground sm:text-2xl">
            The Million Dollar Crypto Page™
          </h1>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.5em] text-muted-foreground sm:text-[0.7rem]">
            20th Anniversary Tribute • 1,000,000 Pixels • $1 Each
          </p>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
