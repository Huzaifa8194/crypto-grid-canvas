export const USD_PER_PIXEL = 1;
export const PIXELS_PER_BLOCK = 100;
export const USD_PER_BLOCK = PIXELS_PER_BLOCK * USD_PER_PIXEL;

export const calculateOrderTotalUsd = (selectedBlocks: number): number =>
  selectedBlocks * USD_PER_BLOCK;

export const formatUsd = (amount: number): string =>
  `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
