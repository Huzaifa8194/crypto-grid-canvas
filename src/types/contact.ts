export interface ContactSettings {
  email: string;
  xLink: string;
  xHandle: string;
  responseTime: string;
  additionalInfo?: string;
}

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  email: "hello@themilliondollarcryptopage.com",
  xLink: "https://x.com",
  xHandle: "@MillionDollarCryptoPage",
  responseTime: "24 hours",
  additionalInfo: "",
};




