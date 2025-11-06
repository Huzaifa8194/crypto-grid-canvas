type Promo = {
  code: string;
  percent: number; // 10 = 10%
  expiresAt: string; // ISO date YYYY-MM-DD
};

const PROMOS: Promo[] = [
  { code: "MDCP10", percent: 10, expiresAt: "2026-12-31" },
  { code: "MDCP20", percent: 20, expiresAt: "2026-12-31" },
  { code: "ANNIV50", percent: 50, expiresAt: "2025-01-31" },
];

export function validatePromoCode(input: string): {
  valid: boolean;
  code: string | null;
  percent: number;
} {
  const code = input.toUpperCase();
  const match = PROMOS.find((p) => p.code === code);
  if (!match) return { valid: false, code: null, percent: 0 };
  const now = new Date();
  const expiry = new Date(match.expiresAt + "T23:59:59Z");
  if (now.getTime() > expiry.getTime()) return { valid: false, code: null, percent: 0 };
  return { valid: true, code: match.code, percent: match.percent };
}


