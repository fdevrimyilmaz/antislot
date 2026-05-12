import * as SecureStore from "expo-secure-store";

const DAILY_AVG_KEY = "antislot_savings_daily_avg";
const CURRENCY_KEY = "antislot_savings_currency";

/**
 * Savings tracker — the user enters an estimated daily gambling spend (TRY by default).
 * Total saved = dailyAverage * cleanDaysCount. Defaults to 200 TRY which is a common
 * starter estimate; the user can override in settings.
 */
const DEFAULT_DAILY_AVG = 200;
const DEFAULT_CURRENCY = "₺";

export type SavingsConfig = {
  dailyAverage: number;
  currency: string;
};

export async function getSavingsConfig(): Promise<SavingsConfig> {
  try {
    const dailyRaw = await SecureStore.getItemAsync(DAILY_AVG_KEY);
    const currencyRaw = await SecureStore.getItemAsync(CURRENCY_KEY);
    const parsed = dailyRaw ? Number(dailyRaw) : DEFAULT_DAILY_AVG;
    return {
      dailyAverage: Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DAILY_AVG,
      currency: currencyRaw && currencyRaw.length > 0 ? currencyRaw : DEFAULT_CURRENCY,
    };
  } catch {
    return { dailyAverage: DEFAULT_DAILY_AVG, currency: DEFAULT_CURRENCY };
  }
}

export async function setSavingsConfig(config: Partial<SavingsConfig>): Promise<void> {
  if (typeof config.dailyAverage === "number" && config.dailyAverage >= 0) {
    await SecureStore.setItemAsync(DAILY_AVG_KEY, String(Math.round(config.dailyAverage)));
  }
  if (typeof config.currency === "string" && config.currency.trim().length > 0) {
    await SecureStore.setItemAsync(CURRENCY_KEY, config.currency.trim().slice(0, 4));
  }
}

export function calculateSavings(days: number, dailyAverage: number): number {
  if (!Number.isFinite(days) || days <= 0) return 0;
  if (!Number.isFinite(dailyAverage) || dailyAverage <= 0) return 0;
  return Math.round(days * dailyAverage);
}

export function formatCurrency(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return `0 ${currency}`;
  // Format with thousands separator (TR locale uses '.' for thousands)
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted} ${currency}`;
}
