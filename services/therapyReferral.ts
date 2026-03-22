import { SUPPORT_EMAIL } from "@/constants/urls";
import { resolveUiLanguage, type SupportedLanguage } from "@/i18n/translations";

export interface TherapyCallbackRequest {
  phone: string;
  name?: string;
  preferredTime?: string;
  note?: string;
  locale?: SupportedLanguage;
  supportEmail?: string;
}

export function normalizePhoneNumber(value: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

export function isValidTherapyPhone(value: string): boolean {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return false;
  const digits = normalized.replace(/^\+/, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function buildTherapyCallbackMailto(request: TherapyCallbackRequest): string {
  const locale = resolveUiLanguage(request.locale ?? "en");
  const to = (request.supportEmail ?? SUPPORT_EMAIL).trim() || SUPPORT_EMAIL;
  const normalizedPhone = normalizePhoneNumber(request.phone);

  const subject =
    locale === "tr" ? "Telefonla Terapi Geri Arama Talebi" : "Phone Therapy Callback Request";

  const lines = [
    locale === "tr" ? "Anti Slot uygulamasindan geri arama talebi:" : "Callback request from Anti Slot app:",
    "",
    `${locale === "tr" ? "Telefon" : "Phone"}: ${normalizedPhone || request.phone}`,
    `${locale === "tr" ? "Isim" : "Name"}: ${request.name?.trim() || "-"}`,
    `${locale === "tr" ? "Musaitlik" : "Availability"}: ${request.preferredTime?.trim() || "-"}`,
    `${locale === "tr" ? "Not" : "Note"}: ${request.note?.trim() || "-"}`,
  ];

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    lines.join("\n")
  )}`;
}
