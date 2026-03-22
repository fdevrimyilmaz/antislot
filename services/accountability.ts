import { Platform } from "react-native";

import type { SupportedLanguage } from "@/i18n/translations";
import {
  AccountabilityAlertApiError,
  sendAccountabilityAlertViaServer,
} from "@/services/accountabilityApi";
import { openExternalUrlWithFallback } from "@/services/safeLinking";

export type AccountabilityAlertReason =
  | "manual_check_in"
  | "high_risk_detected"
  | "critical_urge_detected"
  | "proactive_lock_started";

type BuildMessageParams = {
  language: SupportedLanguage;
  reason: AccountabilityAlertReason;
  riskLevel?: "warning" | "high" | "critical";
  score?: number;
};

type AccountabilityLocaleCopy = {
  reasonManualCheckIn: string;
  reasonHighRiskDetected: string;
  reasonCriticalUrgeDetected: string;
  reasonProactiveLockStarted: string;
  reasonDefault: string;
  riskMedium: string;
  riskHigh: string;
  riskCritical: string;
  protectionScoreLabel: string;
  callNow: string;
  smsUnavailableTitle: string;
  smsUnavailableBodyPrefix: string;
};

const ACCOUNTABILITY_COPY: Record<SupportedLanguage, AccountabilityLocaleCopy> = {
  tr: {
    reasonManualCheckIn: "Benimle kisa bir check-in yapar misin?",
    reasonHighRiskDetected: "Su an yuksek risk sinyali algiladim.",
    reasonCriticalUrgeDetected: "Su an kritik duzeyde durtu yasiyorum.",
    reasonProactiveLockStarted: "Proaktif koruma kilidini baslattim.",
    reasonDefault: "Su an destek ihtiyacim var.",
    riskMedium: "ORTA",
    riskHigh: "YUKSEK",
    riskCritical: "KRITIK",
    protectionScoreLabel: "Koruma skoru",
    callNow: "Mumkunse beni simdi ara.",
    smsUnavailableTitle: "SMS acilamadi",
    smsUnavailableBodyPrefix: "Mesaj uygulamasi acilamadi. Elle gonder:",
  },
  en: {
    reasonManualCheckIn: "Can you do a quick check-in with me?",
    reasonHighRiskDetected: "I detected high-risk relapse signals right now.",
    reasonCriticalUrgeDetected: "I am experiencing a critical urge right now.",
    reasonProactiveLockStarted: "I started a proactive protection lock.",
    reasonDefault: "I need support right now.",
    riskMedium: "MEDIUM",
    riskHigh: "HIGH",
    riskCritical: "CRITICAL",
    protectionScoreLabel: "Protection score",
    callNow: "Please call me now if possible.",
    smsUnavailableTitle: "SMS unavailable",
    smsUnavailableBodyPrefix: "Could not open SMS app. Send manually to:",
  },
  de: {
    reasonManualCheckIn: "Kannst du kurz bei mir einchecken?",
    reasonHighRiskDetected: "Ich habe gerade hohe Rueckfallsignale erkannt.",
    reasonCriticalUrgeDetected: "Ich erlebe gerade einen kritischen Drang.",
    reasonProactiveLockStarted: "Ich habe einen proaktiven Schutz-Lock gestartet.",
    reasonDefault: "Ich brauche gerade Unterstuetzung.",
    riskMedium: "MITTEL",
    riskHigh: "HOCH",
    riskCritical: "KRITISCH",
    protectionScoreLabel: "Schutz-Score",
    callNow: "Bitte ruf mich an, wenn moeglich.",
    smsUnavailableTitle: "SMS nicht verfuegbar",
    smsUnavailableBodyPrefix: "SMS-App konnte nicht geoeffnet werden. Bitte manuell senden an:",
  },
  fr: {
    reasonManualCheckIn: "Peux-tu faire un petit point avec moi ?",
    reasonHighRiskDetected: "J'ai detecte un risque eleve de rechute.",
    reasonCriticalUrgeDetected: "Je ressens une envie critique en ce moment.",
    reasonProactiveLockStarted: "J'ai active un verrou de protection proactif.",
    reasonDefault: "J'ai besoin de soutien maintenant.",
    riskMedium: "MOYEN",
    riskHigh: "ELEVE",
    riskCritical: "CRITIQUE",
    protectionScoreLabel: "Score de protection",
    callNow: "Appelle-moi si possible.",
    smsUnavailableTitle: "SMS indisponible",
    smsUnavailableBodyPrefix: "Impossible d'ouvrir l'app SMS. Envoye manuellement a :",
  },
  hi: {
    reasonManualCheckIn: "Kya tum mere saath ek chhota check-in kar sakte ho?",
    reasonHighRiskDetected: "Mujhe abhi high-risk relapse sanket mile hain.",
    reasonCriticalUrgeDetected: "Mujhe abhi critical urge mehsoos ho rahi hai.",
    reasonProactiveLockStarted: "Maine proactive protection lock shuru kiya hai.",
    reasonDefault: "Mujhe abhi support chahiye.",
    riskMedium: "MADHYAM",
    riskHigh: "UCHCH",
    riskCritical: "GAMBHIR",
    protectionScoreLabel: "Protection score",
    callNow: "Agar mumkin ho to mujhe abhi call karo.",
    smsUnavailableTitle: "SMS uplabdh nahin",
    smsUnavailableBodyPrefix: "SMS app nahi khul saki. Kripya manually bhejo:",
  },
  lv: {
    reasonManualCheckIn: "Vai vari ar mani atri sazvanities?",
    reasonHighRiskDetected: "Es tikko pamaniju augsta riska signalus.",
    reasonCriticalUrgeDetected: "Man sobrid ir kritiska tieksme.",
    reasonProactiveLockStarted: "Es iesledzu proaktivu aizsardzibas lock.",
    reasonDefault: "Man sobrid vajag atbalstu.",
    riskMedium: "VIDEJS",
    riskHigh: "AUGSTS",
    riskCritical: "KRITISKS",
    protectionScoreLabel: "Aizsardzibas rezultats",
    callNow: "Ludzu piezvani man, ja vari.",
    smsUnavailableTitle: "SMS nav pieejams",
    smsUnavailableBodyPrefix: "Neizdevas atvert SMS lietotni. Sutiet manuali uz:",
  },
  zh: {
    reasonManualCheckIn: "Neng bu neng he wo kuaisu guanhuai yixia?",
    reasonHighRiskDetected: "Wo ganggang jiance dao gao fengxian xinhao.",
    reasonCriticalUrgeDetected: "Wo xianzai jingli yige yanzhong chongdong.",
    reasonProactiveLockStarted: "Wo yijing qidong zhuodong baohu lock.",
    reasonDefault: "Wo xianzai xuyao zhichi.",
    riskMedium: "ZHONG",
    riskHigh: "GAO",
    riskCritical: "WEIJI",
    protectionScoreLabel: "Protection score",
    callNow: "Ruguo keyi qing xianzai gei wo da dianhua.",
    smsUnavailableTitle: "SMS bu ke yong",
    smsUnavailableBodyPrefix: "Wu fa dakai SMS yingyong. Qing shoudong fasong dao:",
  },
  tl: {
    reasonManualCheckIn: "Pwede ba tayong mag quick check-in?",
    reasonHighRiskDetected: "May nakita akong high-risk relapse signals ngayon.",
    reasonCriticalUrgeDetected: "May matinding urge ako ngayon.",
    reasonProactiveLockStarted: "Nag-start ako ng proactive protection lock.",
    reasonDefault: "Kailangan ko ng support ngayon.",
    riskMedium: "MEDIUM",
    riskHigh: "HIGH",
    riskCritical: "CRITICAL",
    protectionScoreLabel: "Protection score",
    callNow: "Kung maaari, tawagan mo ako ngayon.",
    smsUnavailableTitle: "Hindi available ang SMS",
    smsUnavailableBodyPrefix: "Hindi mabuksan ang SMS app. Pakisend nang mano-mano sa:",
  },
  sq: {
    reasonManualCheckIn: "A mund te bejme nje check-in te shpejte?",
    reasonHighRiskDetected: "Kam zbuluar sinjale te larta rreziku.",
    reasonCriticalUrgeDetected: "Po perjetoj nje nxitje kritike tani.",
    reasonProactiveLockStarted: "Kam nisur nje lock proaktiv mbrojtjeje.",
    reasonDefault: "Kam nevoje per mbeshtetje tani.",
    riskMedium: "MESATAR",
    riskHigh: "LARTE",
    riskCritical: "KRITIK",
    protectionScoreLabel: "Rezultati i mbrojtjes",
    callNow: "Nese mundesh, me telefono tani.",
    smsUnavailableTitle: "SMS i padisponueshem",
    smsUnavailableBodyPrefix: "Nuk u hap aplikacioni SMS. Dergo manualisht te:",
  },
  sr: {
    reasonManualCheckIn: "Mozemo li kratko da se cujemo?",
    reasonHighRiskDetected: "Detektovao sam visok rizik od relapsa.",
    reasonCriticalUrgeDetected: "Trenutno imam kritican poriv.",
    reasonProactiveLockStarted: "Pokrenuo sam proaktivni zastitni lock.",
    reasonDefault: "Treba mi podrska sada.",
    riskMedium: "SREDNJI",
    riskHigh: "VISOK",
    riskCritical: "KRITICAN",
    protectionScoreLabel: "Skor zastite",
    callNow: "Ako mozes, pozovi me sada.",
    smsUnavailableTitle: "SMS nije dostupan",
    smsUnavailableBodyPrefix: "SMS aplikacija nije otvorena. Posalji rucno na:",
  },
  fi: {
    reasonManualCheckIn: "Voisitko tehda kanssani nopean check-inin?",
    reasonHighRiskDetected: "Havaitsin korkean riskin relapsi-signaaleja.",
    reasonCriticalUrgeDetected: "Koen juuri kriittista halua.",
    reasonProactiveLockStarted: "Kaynnistin proaktiivisen suoja-lockin.",
    reasonDefault: "Tarvitsen tukea nyt.",
    riskMedium: "KESKITASO",
    riskHigh: "KORKEA",
    riskCritical: "KRIITTINEN",
    protectionScoreLabel: "Suojauspisteet",
    callNow: "Soita minulle nyt, jos mahdollista.",
    smsUnavailableTitle: "SMS ei saatavilla",
    smsUnavailableBodyPrefix: "SMS-sovellusta ei voitu avata. Laheta kasin numeroon:",
  },
  sv: {
    reasonManualCheckIn: "Kan du gora en snabb check-in med mig?",
    reasonHighRiskDetected: "Jag upptackte hog risk for aterfall just nu.",
    reasonCriticalUrgeDetected: "Jag upplever ett kritiskt sug just nu.",
    reasonProactiveLockStarted: "Jag startade ett proaktivt skydds-lock.",
    reasonDefault: "Jag behover stod just nu.",
    riskMedium: "MEDEL",
    riskHigh: "HOG",
    riskCritical: "KRITISK",
    protectionScoreLabel: "Skyddspoang",
    callNow: "Ring mig nu om du kan.",
    smsUnavailableTitle: "SMS ej tillgangligt",
    smsUnavailableBodyPrefix: "Kunde inte oppna SMS-appen. Skicka manuellt till:",
  },
  it: {
    reasonManualCheckIn: "Puoi fare un rapido check-in con me?",
    reasonHighRiskDetected: "Ho rilevato segnali di rischio elevato adesso.",
    reasonCriticalUrgeDetected: "Sto vivendo un impulso critico in questo momento.",
    reasonProactiveLockStarted: "Ho avviato un lock di protezione proattiva.",
    reasonDefault: "Ho bisogno di supporto adesso.",
    riskMedium: "MEDIO",
    riskHigh: "ALTO",
    riskCritical: "CRITICO",
    protectionScoreLabel: "Punteggio di protezione",
    callNow: "Se puoi, chiamami ora.",
    smsUnavailableTitle: "SMS non disponibile",
    smsUnavailableBodyPrefix: "Impossibile aprire l'app SMS. Invia manualmente a:",
  },
  is: {
    reasonManualCheckIn: "Geturdu gert stutt check-in med mer?",
    reasonHighRiskDetected: "Eg skynjadi haa endurfallshattu nuna.",
    reasonCriticalUrgeDetected: "Eg er med gagnrynt hvot nuna.",
    reasonProactiveLockStarted: "Eg setti i gang proaktivan verndar-lock.",
    reasonDefault: "Eg tharfnast stydnings nuna.",
    riskMedium: "MIDLUNGS",
    riskHigh: "HAA",
    riskCritical: "ALVARLEG",
    protectionScoreLabel: "Verndarskor",
    callNow: "Hringdu i mig nu ef thu getur.",
    smsUnavailableTitle: "SMS ekki tiltakt",
    smsUnavailableBodyPrefix: "Ekki tokst ad opna SMS app. Sendu handvirkt a:",
  },
  ja: {
    reasonManualCheckIn: "Chotto check-in shite moraeru?",
    reasonHighRiskDetected: "Ima high-risk no sain wo kenshutsu shimashita.",
    reasonCriticalUrgeDetected: "Ima critical na urge wo kanjiteimasu.",
    reasonProactiveLockStarted: "Proactive protection lock wo kaishi shimashita.",
    reasonDefault: "Ima support ga hitsuyo desu.",
    riskMedium: "MEDIUM",
    riskHigh: "HIGH",
    riskCritical: "CRITICAL",
    protectionScoreLabel: "Protection score",
    callNow: "Dekireba ima denwa shite kudasai.",
    smsUnavailableTitle: "SMS unavailable",
    smsUnavailableBodyPrefix: "SMS app ga hirakemasen deshita. Manual de okutte kudasai:",
  },
  ko: {
    reasonManualCheckIn: "Jjamkkan check-in haejul su isseo?",
    reasonHighRiskDetected: "Jigeum high-risk relapse sinho ga gamji dwaesseo.",
    reasonCriticalUrgeDetected: "Jigeum critical urge reul neukkigo isseo.",
    reasonProactiveLockStarted: "Proactive protection lock reul sijakhaesseo.",
    reasonDefault: "Jigeum support ga pilyohae.",
    riskMedium: "MEDIUM",
    riskHigh: "HIGH",
    riskCritical: "CRITICAL",
    protectionScoreLabel: "Protection score",
    callNow: "Ganeunghamyeon jigeum jeonhwahae jwo.",
    smsUnavailableTitle: "SMS unavailable",
    smsUnavailableBodyPrefix: "SMS app reul yeol su eopseoyo. Surokhan beonho-e su-dong jeonsong:",
  },
  es: {
    reasonManualCheckIn: "Puedes hacer un check-in rapido conmigo?",
    reasonHighRiskDetected: "Detecte senales de alto riesgo ahora mismo.",
    reasonCriticalUrgeDetected: "Estoy sintiendo un impulso critico ahora.",
    reasonProactiveLockStarted: "Inicie un lock de proteccion proactiva.",
    reasonDefault: "Necesito apoyo ahora.",
    riskMedium: "MEDIO",
    riskHigh: "ALTO",
    riskCritical: "CRITICO",
    protectionScoreLabel: "Puntaje de proteccion",
    callNow: "Si puedes, llamame ahora.",
    smsUnavailableTitle: "SMS no disponible",
    smsUnavailableBodyPrefix: "No se pudo abrir la app de SMS. Envia manualmente a:",
  },
  pt: {
    reasonManualCheckIn: "Voce pode fazer um check-in rapido comigo?",
    reasonHighRiskDetected: "Detectei sinais de alto risco agora.",
    reasonCriticalUrgeDetected: "Estou com um impulso critico agora.",
    reasonProactiveLockStarted: "Iniciei um lock de protecao proativa.",
    reasonDefault: "Preciso de apoio agora.",
    riskMedium: "MEDIO",
    riskHigh: "ALTO",
    riskCritical: "CRITICO",
    protectionScoreLabel: "Pontuacao de protecao",
    callNow: "Se puder, me ligue agora.",
    smsUnavailableTitle: "SMS indisponivel",
    smsUnavailableBodyPrefix: "Nao foi possivel abrir o app de SMS. Envie manualmente para:",
  },
  ms: {
    reasonManualCheckIn: "Boleh buat check-in ringkas dengan saya?",
    reasonHighRiskDetected: "Saya kesan isyarat risiko tinggi sekarang.",
    reasonCriticalUrgeDetected: "Saya alami dorongan kritikal sekarang.",
    reasonProactiveLockStarted: "Saya mulakan lock perlindungan proaktif.",
    reasonDefault: "Saya perlukan sokongan sekarang.",
    riskMedium: "SEDERHANA",
    riskHigh: "TINGGI",
    riskCritical: "KRITIKAL",
    protectionScoreLabel: "Skor perlindungan",
    callNow: "Jika boleh, hubungi saya sekarang.",
    smsUnavailableTitle: "SMS tidak tersedia",
    smsUnavailableBodyPrefix: "Aplikasi SMS tidak dapat dibuka. Hantar manual ke:",
  },
  km: {
    reasonManualCheckIn: "Can you do a quick check-in with me?",
    reasonHighRiskDetected: "I detected high-risk relapse signals right now.",
    reasonCriticalUrgeDetected: "I am experiencing a critical urge right now.",
    reasonProactiveLockStarted: "I started a proactive protection lock.",
    reasonDefault: "I need support right now.",
    riskMedium: "MEDIUM",
    riskHigh: "HIGH",
    riskCritical: "CRITICAL",
    protectionScoreLabel: "Protection score",
    callNow: "Please call me now if possible.",
    smsUnavailableTitle: "SMS unavailable",
    smsUnavailableBodyPrefix: "Could not open SMS app. Send manually to:",
  },
  th: {
    reasonManualCheckIn: "Can you do a quick check-in with me?",
    reasonHighRiskDetected: "I detected high-risk relapse signals right now.",
    reasonCriticalUrgeDetected: "I am experiencing a critical urge right now.",
    reasonProactiveLockStarted: "I started a proactive protection lock.",
    reasonDefault: "I need support right now.",
    riskMedium: "MEDIUM",
    riskHigh: "HIGH",
    riskCritical: "CRITICAL",
    protectionScoreLabel: "Protection score",
    callNow: "Please call me now if possible.",
    smsUnavailableTitle: "SMS unavailable",
    smsUnavailableBodyPrefix: "Could not open SMS app. Send manually to:",
  },
};

function normalizePhone(phone: string): string {
  return phone
    .trim()
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");
}

function getAccountabilityCopy(language: SupportedLanguage): AccountabilityLocaleCopy {
  return ACCOUNTABILITY_COPY[language] ?? ACCOUNTABILITY_COPY.en;
}

function reasonText(params: BuildMessageParams): string {
  const copy = getAccountabilityCopy(params.language);
  switch (params.reason) {
    case "manual_check_in":
      return copy.reasonManualCheckIn;
    case "high_risk_detected":
      return copy.reasonHighRiskDetected;
    case "critical_urge_detected":
      return copy.reasonCriticalUrgeDetected;
    case "proactive_lock_started":
      return copy.reasonProactiveLockStarted;
    default:
      return copy.reasonDefault;
  }
}

function riskText(language: SupportedLanguage, riskLevel?: "warning" | "high" | "critical"): string {
  if (!riskLevel) return "";
  const copy = getAccountabilityCopy(language);
  if (riskLevel === "critical") return `Risk: ${copy.riskCritical}`;
  if (riskLevel === "high") return `Risk: ${copy.riskHigh}`;
  return `Risk: ${copy.riskMedium}`;
}

export function buildAccountabilityMessage(params: BuildMessageParams): string {
  const copy = getAccountabilityCopy(params.language);
  const lines: string[] = [reasonText(params)];
  const risk = riskText(params.language, params.riskLevel);
  if (risk) lines.push(risk);
  if (typeof params.score === "number" && Number.isFinite(params.score)) {
    const score = Math.max(0, Math.min(100, Math.round(params.score)));
    lines.push(`${copy.protectionScoreLabel}: ${score}/100`);
  }
  lines.push(copy.callNow);
  return lines.join("\n");
}

export async function openAccountabilityPartnerSms(params: {
  phone: string;
  message: string;
  language: SupportedLanguage;
}): Promise<boolean> {
  const cleanPhone = normalizePhone(params.phone);
  if (!cleanPhone) return false;

  const message = params.message.trim();

  try {
    const serverDelivery = await sendAccountabilityAlertViaServer({
      phone: cleanPhone,
      message,
    });
    if (serverDelivery?.delivery === "sent") {
      return true;
    }
  } catch (error) {
    if (error instanceof AccountabilityAlertApiError && error.kind === "policy_blocked") {
      if (__DEV__) {
        console.warn("[Accountability] Policy blocked server SMS delivery:", {
          status: error.status,
          code: error.code,
          message: error.message,
        });
      }
      return false;
    }

    if (__DEV__) {
      console.warn("[Accountability] Server SMS delivery failed, falling back to composer:", error);
    }
  }

  const separator = Platform.OS === "ios" ? "&" : "?";
  const url = `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;

  const copy = getAccountabilityCopy(params.language);
  const fallbackTitle = copy.smsUnavailableTitle;
  const fallbackMessage = `${copy.smsUnavailableBodyPrefix} ${cleanPhone}\n\n${message}`;

  return openExternalUrlWithFallback({
    url,
    fallbackTitle,
    fallbackMessage,
  });
}
