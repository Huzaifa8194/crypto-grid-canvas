const USD_PER_BLOCK = 100;

export const calculateOrderTotalUsd = (selectedBlocks: number): number =>
  selectedBlocks * USD_PER_BLOCK;

export interface AcceptedTokenConfig {
  blockchain: string;
  token: string;
  receiver: string;
}

const isValidReceiver = (receiver: string): boolean =>
  Boolean(receiver) &&
  !receiver.includes("YOUR_") &&
  !receiver.includes("PLACEHOLDER") &&
  receiver.length > 10;

const parseAcceptedTokens = (): AcceptedTokenConfig[] => {
  const json = process.env.DEPAY_ACCEPTED_TOKENS_JSON;
  if (json) {
    const parsed = JSON.parse(json) as AcceptedTokenConfig[];
    return parsed.filter((entry) => isValidReceiver(entry.receiver));
  }

  const receiver = process.env.DEPAY_RECEIVER_WALLET;
  if (!receiver || !isValidReceiver(receiver)) {
    return [];
  }

  return [
    {
      blockchain: "ethereum",
      token: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      receiver,
    },
    {
      blockchain: "ethereum",
      token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      receiver,
    },
    {
      blockchain: "base",
      token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      receiver,
    },
    {
      blockchain: "polygon",
      token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      receiver,
    },
    {
      blockchain: "polygon",
      token: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      receiver,
    },
    {
      blockchain: "bsc",
      token: "0x55d398326f99059fF775485246999027B3197955",
      receiver,
    },
    {
      blockchain: "bsc",
      token: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      receiver,
    },
  ];
};

export interface DepayWidgetConfiguration {
  amount: {
    currency: string;
    fix: number;
  };
  accept: AcceptedTokenConfig[];
  forward_to?: string;
}

export const buildDepayConfiguration = (
  selectedBlocks: number,
  siteOrigin: string
): DepayWidgetConfiguration => {
  const accept = parseAcceptedTokens();
  if (accept.length === 0) {
    throw new Error("No DePay receiver wallets configured");
  }

  return {
    amount: {
      currency: "USD",
      fix: calculateOrderTotalUsd(selectedBlocks),
    },
    accept,
    forward_to: `${siteOrigin}/buy`,
  };
};
