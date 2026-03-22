export const CRISIS_PROTOCOL_VERSION = "2026.02";

export type CrisisContact = {
  id: "emergency_112" | "yedam_115" | "alo183";
  title: string;
  phone: string;
  sms?: string;
  label: string;
};

export type CrisisActionStep = {
  id: "pause" | "breathe" | "safe_distance" | "reach_out";
  title: string;
  description: string;
};

export type BreathingPlan = {
  pattern: "4-4-6";
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  minRounds: number;
};

export const DEFAULT_BREATHING_PLAN: BreathingPlan = {
  pattern: "4-4-6",
  inhaleSec: 4,
  holdSec: 4,
  exhaleSec: 6,
  minRounds: 5,
};

export const CRISIS_ACTION_PLAN: CrisisActionStep[] = [
  {
    id: "pause",
    title: "Dur ve guvende kal",
    description: "Acil risk varsa hemen 112'yi ara. O an arac kullanma ve yalniz kalmamaya calis.",
  },
  {
    id: "breathe",
    title: "60 saniye nefes duzenleme",
    description: "4 saniye nefes al, 4 saniye tut, 6 saniye ver. En az 5 tur tekrar et.",
  },
  {
    id: "safe_distance",
    title: "Tetikleyiciden uzaklas",
    description: "Bahis uygulamalarini kapat, odadan cik, telefondan dikkat dagitici bir aktivite ac.",
  },
  {
    id: "reach_out",
    title: "Hemen birine ulas",
    description: "YEDAM 115 veya Alo 183'e ulas. Mumkunse guvendigin bir kisiye kisa bir mesaj gonder.",
  },
];

export const CRISIS_CONTACTS: CrisisContact[] = [
  {
    id: "emergency_112",
    title: "112 Emergency",
    phone: "112",
    label: "Life-threatening emergency",
  },
  {
    id: "yedam_115",
    title: "YEDAM",
    phone: "115",
    label: "Addiction support and counseling",
  },
  {
    id: "alo183",
    title: "Alo 183",
    phone: "183",
    sms: "183",
    label: "24/7 social support",
  },
];

export const OFFLINE_CRISIS_FALLBACK = {
  title: "Baglanti yoksa manuel adim",
  description: "Telefon aramasi acilamazsa numarayi elle cevirin: 112, 115, 183. Hemen guvendiginiz bir kisiye ulasin.",
  manualDial: ["112", "115", "183"],
};
