const USD_PER_BLOCK = 100;

export const calculateOrderTotalUsd = (selectedBlocks: number): number =>
  selectedBlocks * USD_PER_BLOCK;

export interface AcceptedTokenConfig {
  blockchain: string;
  token: string;
  receiver: string;
}

const parseAcceptedTokens = (): AcceptedTokenConfig[] => {
  const json = process.env.DEPAY_ACCEPTED_TOKENS_JSON;
  if (json) {
    return JSON.parse(json) as AcceptedTokenConfig[];
  }

  const receiver = process.env.DEPAY_RECEIVER_WALLET;
  if (!receiver) {
    return [];
  }

  return [
    {
      blockchain: "ethereum",
      token: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      receiver,
    },
    {
      blockchain: "polygon",
      token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      receiver,
    },
    {
      blockchain: "bsc",
      token: "0x55d398326f99059fF775485246999027B3197955",
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
  requestId: string,
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
