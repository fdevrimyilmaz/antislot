import type { UiLanguage } from "./locale";

export type TherapyCallbackStatus = "queued" | "contacted" | "closed";

export interface TherapyCallbackRecord {
  requestId: string;
  userId: string;
  phone: string;
  name?: string;
  preferredTime?: string;
  note?: string;
  adminNote?: string;
  locale: UiLanguage;
  status: TherapyCallbackStatus;
  createdAt: number;
  updatedAt: number;
}

export interface TherapyCallbackQueueResponse {
  requestId: string;
  status: TherapyCallbackStatus;
  queueDepth: number;
  queuedAt: number;
  supportEmail: string;
}
