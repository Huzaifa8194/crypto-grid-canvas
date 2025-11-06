import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Buy Pixels", href: "/buy-pixels" },
    { name: "The Story", href: "/story" },
    { name: "NFT Auction", href: "/auction" },
    { name: "Press", href: "/press" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="w-full border-b border-border bg-background">
      <div className="w-full px-4 py-3">
        {/* Twitter Icon - Left aligned */}
        <div className="flex items-start mb-2">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
            aria-label="Follow us on Twitter"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>

        {/* Title and Subtitle */}
        <div className="text-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            The Million Dollar Crypto Page™
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            20th Anniversary Tribute • 1,000,000 Pixels • $1 Each
          </p>
        </div>

        {/* Desktop Navigation - Center aligned */}
        <div className="hidden md:flex items-center justify-center gap-1 mt-3">
          {navItems.map((item, index) => (
            <span key={item.name} className="flex items-center">
              <Link
                to={item.href}
                className="text-sm text-foreground hover:text-blue-400 transition-colors px-2 py-1"
              >
                {item.name}
              </Link>
              {index < navItems.length - 1 && (
                <span className="text-muted-foreground">|</span>
              )}
            </span>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex justify-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="ml-2 text-xs">Menu</span>
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border pt-2 mt-2 md:hidden">
            <div className="flex flex-col items-center space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm text-foreground hover:text-blue-400 transition-colors py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
