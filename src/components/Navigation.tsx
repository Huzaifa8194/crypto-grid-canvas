import { Link } from "react-router-dom";

const Navigation = () => {
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Buy Pixels", href: "/buy-pixels" },
    { name: "The Story", href: "/story" },
    { name: "NFT Auction", href: "/nft-auction" },
    { name: "Press", href: "/press" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="bg-white border-b border-gray-300">
      {/* Title Section */}
      <div className="text-center py-3 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-gray-800">
          The Million Dollar Crypto Page™
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          20th Anniversary Tribute • 1,000,000 Pixels • $1 Each
        </p>
      </div>

      {/* Navigation Bar */}
      <div className="relative py-2">
        {/* Social Icons - Left aligned */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-600 transition-colors"
            aria-label="Twitter"
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

        {/* Center Navigation */}
        <nav className="flex items-center justify-center gap-1">
          {navItems.map((item, index) => (
            <span key={item.name} className="flex items-center">
              <Link
                to={item.href}
                className="text-sm text-gray-700 hover:text-red-600 transition-colors px-2 py-1"
              >
                {item.name}
              </Link>
              {index < navItems.length - 1 && (
                <span className="text-gray-400">|</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
