import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useContactSettings } from "@/context/ContactSettingsContext";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useContactSettings();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Buy Pixels", href: "/buy" },
    { name: "The Story", href: "/story" },
    { name: "First Buyers", href: "/first-buyers" },
    { name: "NFT Auction", href: "/auction" },
    { name: "Press", href: "/press" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-3 md:px-6">
        <div className="grid h-8 grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3 text-[0.55rem] md:text-[0.6rem] font-semibold uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground">
          <div className="flex items-center gap-2">
            <a
              href={settings.xLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <img src="/x-logo.png" alt="X" className="h-5 w-auto" />
              <span className="sr-only">X</span>
            </a>
          </div>

          <nav className="hidden items-center justify-center gap-2 md:flex">
            {navItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <a
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.name}
                </a>
                {index < navItems.length - 1 && (
                  <span className="text-[0.5rem] text-primary/70">|</span>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center justify-end md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded border border-border/60 bg-background/40 p-1.5 text-muted-foreground transition hover:text-foreground"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-1 rounded border border-border/80 bg-background/95 p-3 shadow-lg md:hidden">
            <nav className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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

        <div className="py-1.5 text-center">
          <h1 className="text-[0.65rem] xs:text-xs sm:text-base md:text-lg font-bold uppercase tracking-[0.08em] xs:tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.25em] text-foreground">
            The Million Dollar Crypto Page™
          </h1>
          <p className="mt-0.5 text-[0.4rem] xs:text-[0.45rem] sm:text-[0.55rem] md:text-[0.6rem] uppercase tracking-[0.05em] xs:tracking-[0.1em] sm:tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground leading-relaxed">
            <span className="hidden sm:inline">21-Year Anniversary • Own a piece of Web3 history! • 1,000,000 Pixels • $1 Each</span>
            <span className="sm:hidden">21-Year Anniversary • Own a piece of Web3 history!<br/>1,000,000 Pixels • $1 Each</span>
          </p>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
