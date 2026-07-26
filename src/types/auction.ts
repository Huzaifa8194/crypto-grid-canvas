export interface AuctionSettings {
  heroTitle: string;
  heroParagraphs: string[];
  card1Title: string;
  card1Paragraphs: string[];
  card2Title: string;
  card2Paragraphs: string[];
  bannerSubtitle: string;
  bannerTitle: string;
  bannerButtonText: string;
}

export const DEFAULT_AUCTION_SETTINGS: AuctionSettings = {
  heroTitle: "NFT Auction",
  heroParagraphs: [
    "Once all 1,000,000 pixels sell out, history will have been made.",
    "The completed artwork will be auctioned as a historic NFT. 100% of the proceeds will be distributed back to the pixel holders."
  ],
  card1Title: "A shared upside",
  card1Paragraphs: [
    "The earlier you buy, and the more pixels you own, the greater your share of the final auction.",
    "Pixel ownership equals participation. Every holder has a stake in how this story is written."
  ],
  card2Title: "Countdown to the drop",
  card2Paragraphs: [
    "Once the last pixel is claimed, the clock starts ticking toward the auction reveal.",
    "We are looking forward to this journey, and hope you will be a part of it."
  ],
  bannerSubtitle: "Get listed before the hammer falls",
  bannerTitle: "Secure pixels now to maximize your share when the NFT is auctioned.",
  bannerButtonText: "Buy pixels",
};
