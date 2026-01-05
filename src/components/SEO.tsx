import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

const SITE_NAME = "The Million Dollar Crypto Page";
const DEFAULT_TITLE = "The Million Dollar Crypto Page - Own Your Piece of Web3 History";
const DEFAULT_DESCRIPTION = "The definitive community-owned snapshot of the 2026 crypto ecosystem. 1,000,000 pixels at $1 each. Secure your block on the blockchain-first pixel canvas.";
const DEFAULT_IMAGE = "/og-image.png"; // You'll want to create this
const BASE_URL = "https://themilliondollarcryptopage.com";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
}: SEOProps) => {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = url ? `${BASE_URL}${url}` : undefined;
  const imageUrl = image.startsWith("http") ? image : `${BASE_URL}${image}`;

  // Default keywords for the project
  const defaultKeywords = "crypto, blockchain, NFT, pixels, web3, million dollar homepage, cryptocurrency, digital real estate, pixel art";
  const finalKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={finalKeywords} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
};

export default SEO;

// Structured Data component for JSON-LD
interface StructuredDataProps {
  data: object;
}

export const StructuredData = ({ data }: StructuredDataProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  </Helmet>
);

// Pre-built structured data for the organization
export const OrganizationSchema = () => (
  <StructuredData
    data={{
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Million Dollar Crypto Page",
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
      description: DEFAULT_DESCRIPTION,
      sameAs: [
        "https://x.com/MillionDollarCryptoPage",
      ],
    }}
  />
);

// Website schema for search engines
export const WebsiteSchema = () => (
  <StructuredData
    data={{
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: BASE_URL,
      description: DEFAULT_DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/?s={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }}
  />
);



