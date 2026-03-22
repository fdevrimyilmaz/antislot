import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import GamblingBlocker from "@/react-native-bridge/GamblingBlockerModule";
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";
import { computeBlockerHardeningScore, useBlockerHardeningStore } from "@/store/blockerHardeningStore";
import {
  addWhitelistDomain,
  checkDomainBlocked,
  getBlockerState,
  removeWhitelistDomain,
  saveApiUrl,
  syncBlocklist,
} from "@/store/blockerStore";

type BlockerErrorContext = "sync" | "saveApiUrl";
type ProtectionIssueReason =
  | "permission_denied"
  | "unsupported"
  | "not_authorized"
  | "module_unavailable"
  | "unsupported_platform"
  | "generic";

type ProtectionIssue = {
  reason: ProtectionIssueReason;
  title: string;
  body: string;
  actionLabel?: string;
};

const BLOCKER_COPY = {
  tr: {
    loadError: "Engelleyici durumu yuklenemedi. Lutfen tekrar deneyin.",
    saveApiFailed: "API URL'si kaydedilemedi. Lutfen daha sonra tekrar deneyin.",
    syncFailed: "Engel listesi senkronize edilemedi. Lutfen daha sonra tekrar deneyin.",
    staleSyncWarning: "Engel listesi uzun suredir guncellenmedi. Guvenlik icin senkronizasyon onerilir.",
    autoSyncRunning: "Engel listesi otomatik olarak guncelleniyor...",
    autoSyncDone: "Engel listesi otomatik guncellendi.",
    autoSyncFailed: "Otomatik guncelleme basarisiz oldu. Lutfen manuel senkronizasyon yapin.",
    invalidApiUrlSave: "Gecersiz API URL'si. Ornek: https://api.antislot.app",
    invalidApiUrlSync: "API URL'si gecersiz. Lutfen URL alanini kontrol edin.",
    httpsRequired: "Guvenli (HTTPS) bir API URL'si kullanmaniz gerekiyor.",
    syncFetchFailed:
      "Sunucudan engel listesi alinamadi. Internet baglantinizi veya API URL'sini kontrol edin.",
    signatureFailed: "Imza dogrulamasi basarisiz oldu. Lutfen daha sonra tekrar deneyin.",
    incompatibleVersion:
      "Bu engel listesi surumu uygulamanizla uyumlu degil. Uygulamayi guncellemeyi deneyin.",
    neverSynced: "Henuz senkronize edilmedi",
    justNow: "Az once",
    minutesAgo: (value: number) => `${value} dakika once`,
    hoursAgo: (value: number) => `${value} saat once`,
    daysAgo: (value: number) => `${value} gun once`,
    loading: "Engelleyici yukleniyor...",
    backAccessibility: "Geri don",
    title: "Web Engelleyici",
    protectionTitle: "Koruma",
    enableProtection: "Korumayi Etkinlestir",
    enableProtectionAccessibility: "Korumayi etkinlestir veya kapat",
    enableProtectionHint: "Acikken kumar siteleri engellenir.",
    protectionDescription:
      "Desteklendiginde cihaz duzeyi koruma ile kumar alan adlarini engeller.",
    hardeningTitle: "VPN Hardening",
    hardeningSubtitle:
      "Sadece DNS degil; DoH/DoT/QUIC ve tamper risklerine karsi katmanli koruma ayarlari.",
    strictMode: "Strict mode",
    blockDoh: "DoH bypass riskini azalt",
    blockDot: "DoT bypass riskini azalt",
    blockQuic: "QUIC bypass riskini azalt",
    lockdownVpn: "VPN lock-down hedefi",
    tamperAlerts: "Tamper uyarilari",
    hardeningScoreLabel: "Hardening skoru",
    hardeningLow: "Dusuk",
    hardeningMedium: "Orta",
    hardeningHigh: "Yuksek",
    hardeningHint:
      "Not: Bazi secenekler platform kisitlari nedeniyle davranissal koruma hedefidir; OS-level always-on ayarlariyla birlikte kullanin.",
    vpnInfoTitle: "VPN Bilgilendirme",
    vpnInfoDescription:
      "Uygulama, DNS duzeyinde engelleme icin cihazda yerel VPN kullanir. Koruma etkinlesmesi icin VPN'i Ayarlar bolumunden onaylamaniz gerekebilir.",
    vpnDisclosureTitle: "VPN Baglantisi Gerekli",
    vpnDisclosureBody:
      "Anti Slot, kumar sitelerine erisiminizi engellemek icin cihazinizda yerel bir VPN agi kurar. Bu VPN sadece cihazinizda calisir, kisisel verilerinizi toplamaz ve hicbir sunucuya gondermez.",
    vpnDisclosureCancel: "Vazgec",
    vpnDisclosureAccept: "Kabul Et",
    bullet1: "- Gezinti verileri toplanmaz, yerelde islenir",
    bullet2: "- DoH / uygulama ici tarayicilar filtreyi asabilir",
    bullet3: "- En iyi koruma icin VPN aktif olmalidir",
    openVpnSettings: "VPN Ayarlarina Git",
    limitations: "Sinirlamalar",
    privacy: "Gizlilik",
    syncTitle: "Engel Listesi Senkronizasyonu",
    apiPlaceholder: "API URL (orn. https://api.antislot.app veya http://localhost:3000)",
    saveUrl: "URL'yi Kaydet",
    saveUrlAccessibility: "API URL'sini kaydet",
    syncNow: "Simdi Senkronize Et",
    syncAccessibility: "Engel listesini senkronize et",
    domains: "Alan adlari",
    patterns: "Kaliplar",
    lastSync: "Son senkronizasyon",
    whitelistTitle: "Izin Listesi",
    whitelistPlaceholder: "Izin listesine alan adi ekle",
    addWhitelist: "Izin Listesine Ekle",
    addWhitelistAccessibility: "Alan adini izin listesine ekle",
    noWhitelist: "Izin listesinde alan adi yok",
    domainTestTitle: "Alan Adi Testi",
    domainTestPlaceholder: "Test etmek icin URL veya alan adi girin",
    checkNow: "Kontrol Et",
    domainLabel: "Alan adi",
    unknownDomain: "Bilinmiyor",
    blocked: "Engellendi",
    allowed: "Izin Verildi",
    invalidUrlTitle: "Gecersiz URL",
    invalidUrlBody: "Lutfen gecerli bir API URL'si girin.",
    savedTitle: "Kaydedildi",
    savedBody: "API URL'si guncellendi.",
    syncDoneTitle: "Senkronizasyon Tamamlandi",
    syncDoneBody: "Engel listesi basariyla guncellendi.",
    syncFailedTitle: "Senkronizasyon Basarisiz",
    genericErrorTitle: "Hata",
    permissionDeniedTitle: "VPN izni reddedildi",
    permissionDeniedBody: "Koruma icin VPN izni vermeniz gerekiyor.",
    comingSoonTitle: "Yakinda",
    iosNotReady: "iOS icin yerel koruma henuz etkin degil.",
    authorizationRequiredTitle: "Yetkilendirme Gerekli",
    authorizationRequiredBody: "Apple yetkilendirmeleri etkinlestirilmelidir.",
    openSystemSettings: "Ayarlari Ac",
    privateDnsActiveTitle: "Private DNS acik",
    privateDnsActiveBody:
      "DoT bypass riskini azaltmak icin Android Private DNS ayarini kapatip tekrar dene.",
    lockdownUnsupportedTitle: "Lock-down desteklenmiyor",
    lockdownUnsupportedBody:
      "Bu Android surumunde VPN lock-down hedefi kullanilamiyor. Standart koruma ile devam edebilirsin.",
    unsupportedTitle: "Desteklenmiyor",
    unsupportedBody: "Bu cihazda yerel koruma modulu kullanilamiyor.",
    startFailed: "Koruma baslatilamadi.",
    stopFailed: "Koruma durdurulamadi.",
    toggleUnsupported: "Bu cihazda koruma acilip kapatilamiyor.",
    addWhitelistError: "Alan adi izin listesine eklenemedi.",
    removeWhitelistError: "Alan adi izin listesinden kaldirilamadi.",
    domainTestError: "Alan adi testi su anda yapilamiyor.",
  },
  en: {
    loadError: "Blocker state could not be loaded. Please try again.",
    saveApiFailed: "API URL could not be saved. Please try again later.",
    syncFailed: "Blocklist could not be synchronized. Please try again later.",
    staleSyncWarning: "Blocklist is outdated. Sync is recommended for stronger protection.",
    autoSyncRunning: "Blocklist is being refreshed automatically...",
    autoSyncDone: "Blocklist refreshed automatically.",
    autoSyncFailed: "Automatic refresh failed. Please run manual sync.",
    invalidApiUrlSave: "Invalid API URL. Example: https://api.antislot.app",
    invalidApiUrlSync: "API URL is invalid. Please check the URL field.",
    httpsRequired: "You need to use a secure (HTTPS) API URL.",
    syncFetchFailed:
      "Could not fetch blocklist from server. Check your internet connection or API URL.",
    signatureFailed: "Signature verification failed. Please try again later.",
    incompatibleVersion:
      "This blocklist version is not compatible with your app. Try updating the app.",
    neverSynced: "Not synchronized yet",
    justNow: "Just now",
    minutesAgo: (value: number) => `${value} minute${value === 1 ? "" : "s"} ago`,
    hoursAgo: (value: number) => `${value} hour${value === 1 ? "" : "s"} ago`,
    daysAgo: (value: number) => `${value} day${value === 1 ? "" : "s"} ago`,
    loading: "Loading blocker...",
    backAccessibility: "Go back",
    title: "Web Blocker",
    protectionTitle: "Protection",
    enableProtection: "Enable Protection",
    enableProtectionAccessibility: "Enable or disable protection",
    enableProtectionHint: "When on, gambling websites are blocked.",
    protectionDescription:
      "When supported, this blocks gambling domains using device-level protection.",
    hardeningTitle: "VPN Hardening",
    hardeningSubtitle:
      "Not DNS-only; layered controls for DoH/DoT/QUIC bypass and tamper resistance.",
    strictMode: "Strict mode",
    blockDoh: "Reduce DoH bypass risk",
    blockDot: "Reduce DoT bypass risk",
    blockQuic: "Reduce QUIC bypass risk",
    lockdownVpn: "VPN lock-down target",
    tamperAlerts: "Tamper alerts",
    hardeningScoreLabel: "Hardening score",
    hardeningLow: "Low",
    hardeningMedium: "Medium",
    hardeningHigh: "High",
    hardeningHint:
      "Note: Some options are behavioral hardening targets under platform limits; combine with OS-level always-on settings.",
    vpnInfoTitle: "VPN Information",
    vpnInfoDescription:
      "The app uses a local VPN for DNS-level blocking. You may need to approve VPN from system settings for protection to activate.",
    vpnDisclosureTitle: "VPN Connection Required",
    vpnDisclosureBody:
      "Anti Slot sets up a local VPN network on your device to block access to gambling websites. This VPN runs only on your device, does not collect personal data, and does not send your data to any server.",
    vpnDisclosureCancel: "Cancel",
    vpnDisclosureAccept: "Accept",
    bullet1: "- Browsing data is not collected and processed locally",
    bullet2: "- DoH / in-app browsers can bypass filtering",
    bullet3: "- Keep VPN active for strongest protection",
    openVpnSettings: "Open VPN Settings",
    limitations: "Limitations",
    privacy: "Privacy",
    syncTitle: "Blocklist Sync",
    apiPlaceholder: "API URL (e.g. https://api.antislot.app or http://localhost:3000)",
    saveUrl: "Save URL",
    saveUrlAccessibility: "Save API URL",
    syncNow: "Sync Now",
    syncAccessibility: "Synchronize blocklist",
    domains: "Domains",
    patterns: "Patterns",
    lastSync: "Last sync",
    whitelistTitle: "Allowlist",
    whitelistPlaceholder: "Add domain to allowlist",
    addWhitelist: "Add to Allowlist",
    addWhitelistAccessibility: "Add domain to allowlist",
    noWhitelist: "No domains in allowlist",
    domainTestTitle: "Domain Test",
    domainTestPlaceholder: "Enter URL or domain to test",
    checkNow: "Check",
    domainLabel: "Domain",
    unknownDomain: "Unknown",
    blocked: "Blocked",
    allowed: "Allowed",
    invalidUrlTitle: "Invalid URL",
    invalidUrlBody: "Please enter a valid API URL.",
    savedTitle: "Saved",
    savedBody: "API URL updated.",
    syncDoneTitle: "Sync Completed",
    syncDoneBody: "Blocklist updated successfully.",
    syncFailedTitle: "Sync Failed",
    genericErrorTitle: "Error",
    permissionDeniedTitle: "VPN permission denied",
    permissionDeniedBody: "You need to allow VPN permission for protection.",
    comingSoonTitle: "Coming soon",
    iosNotReady: "Native protection for iOS is not active yet.",
    authorizationRequiredTitle: "Authorization Required",
    authorizationRequiredBody: "Apple entitlements must be enabled.",
    openSystemSettings: "Open Settings",
    privateDnsActiveTitle: "Private DNS is enabled",
    privateDnsActiveBody:
      "Turn off Android Private DNS to reduce DoT bypass risk, then try again.",
    lockdownUnsupportedTitle: "Lock-down not supported",
    lockdownUnsupportedBody:
      "This Android version cannot enforce VPN lock-down target. You can continue with standard protection.",
    unsupportedTitle: "Unsupported",
    unsupportedBody: "Native protection module is not available on this device.",
    startFailed: "Protection could not be started.",
    stopFailed: "Protection could not be stopped.",
    toggleUnsupported: "Protection cannot be toggled on this device.",
    addWhitelistError: "Could not add domain to allowlist.",
    removeWhitelistError: "Could not remove domain from allowlist.",
    domainTestError: "Domain test is unavailable right now.",
  },
} as const;

type BlockerCopy = (typeof BLOCKER_COPY)["tr"] | (typeof BLOCKER_COPY)["en"];

const AUTO_SYNC_STALE_MS = 24 * 60 * 60 * 1000;
const STALE_WARNING_MS = 72 * 60 * 60 * 1000;

function mapBlockerError(error: unknown, context: BlockerErrorContext, copy: BlockerCopy): string {
  if (!(error instanceof Error)) {
    return context === "saveApiUrl" ? copy.saveApiFailed : copy.syncFailed;
  }

  const code = (error.message || "").trim();

  if (code === "invalid_api_url") {
    return context === "saveApiUrl" ? copy.invalidApiUrlSave : copy.invalidApiUrlSync;
  }

  if (code === "insecure_api_url" || code === "sync_requires_https") {
    return copy.httpsRequired;
  }

  if (code === "sync_fetch_failed") {
    return copy.syncFetchFailed;
  }

  if (
    code === "blocklist_signature_invalid" ||
    code === "patterns_signature_invalid" ||
    code.includes("verify-signature")
  ) {
    return copy.signatureFailed;
  }

  if (code.startsWith("incompatible_")) {
    return copy.incompatibleVersion;
  }

  return context === "saveApiUrl" ? copy.saveApiFailed : copy.syncFailed;
}

function mapProtectionIssue(
  reason: string | undefined,
  message: string | undefined,
  attemptedValue: boolean,
  copy: Pick<
    BlockerCopy,
    | "permissionDeniedTitle"
    | "permissionDeniedBody"
    | "comingSoonTitle"
    | "iosNotReady"
    | "authorizationRequiredTitle"
    | "authorizationRequiredBody"
    | "openSystemSettings"
    | "privateDnsActiveTitle"
    | "privateDnsActiveBody"
    | "lockdownUnsupportedTitle"
    | "lockdownUnsupportedBody"
    | "unsupportedTitle"
    | "unsupportedBody"
    | "genericErrorTitle"
    | "startFailed"
    | "stopFailed"
  >
): ProtectionIssue | null {
  const normalizedReason = (reason || "").trim();
  const normalizedMessage = typeof message === "string" && message.trim().length > 0 ? message.trim() : undefined;

  if (normalizedReason === "permission_denied") {
    return {
      reason: "permission_denied",
      title: copy.permissionDeniedTitle,
      body: normalizedMessage ?? copy.permissionDeniedBody,
      actionLabel: copy.openSystemSettings,
    };
  }

  if (normalizedReason === "unsupported") {
    return {
      reason: "unsupported",
      title: copy.comingSoonTitle,
      body: normalizedMessage ?? copy.iosNotReady,
    };
  }

  if (normalizedReason === "not_authorized") {
    return {
      reason: "not_authorized",
      title: copy.authorizationRequiredTitle,
      body: normalizedMessage ?? copy.authorizationRequiredBody,
      actionLabel: copy.openSystemSettings,
    };
  }

  if (normalizedReason === "dot_active") {
    return {
      reason: "generic",
      title: copy.privateDnsActiveTitle,
      body: normalizedMessage ?? copy.privateDnsActiveBody,
      actionLabel: copy.openSystemSettings,
    };
  }

  if (normalizedReason === "lockdown_unsupported") {
    return {
      reason: "generic",
      title: copy.lockdownUnsupportedTitle,
      body: normalizedMessage ?? copy.lockdownUnsupportedBody,
    };
  }

  if (normalizedReason === "module_unavailable" || normalizedReason === "unsupported_platform") {
    return {
      reason: normalizedReason,
      title: copy.unsupportedTitle,
      body: normalizedMessage ?? copy.unsupportedBody,
    };
  }

  if (!normalizedReason && !normalizedMessage) {
    return null;
  }

  return {
    reason: "generic",
    title: copy.genericErrorTitle,
    body: normalizedMessage ?? (attemptedValue ? copy.startFailed : copy.stopFailed),
  };
}

function formatLastSync(
  ts: number | null,
  locale: string,
  copy: Pick<BlockerCopy, "neverSynced" | "justNow" | "minutesAgo" | "hoursAgo" | "daysAgo">
): string {
  if (ts == null) return copy.neverSynced;
  const now = Date.now();
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);
  if (diffMin < 1) return copy.justNow;
  if (diffMin < 60) return copy.minutesAgo(diffMin);
  if (diffHour < 24) return copy.hoursAgo(diffHour);
  if (diffDay < 7) return copy.daysAgo(diffDay);
  return new Date(ts).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BlockerScreen() {
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(BLOCKER_COPY);
  const hydrateHardening = useBlockerHardeningStore((state) => state.hydrate);
  const strictMode = useBlockerHardeningStore((state) => state.strictMode);
  const blockDoh = useBlockerHardeningStore((state) => state.blockDoh);
  const blockDot = useBlockerHardeningStore((state) => state.blockDot);
  const blockQuic = useBlockerHardeningStore((state) => state.blockQuic);
  const lockdownVpn = useBlockerHardeningStore((state) => state.lockdownVpn);
  const tamperAlerts = useBlockerHardeningStore((state) => state.tamperAlerts);
  const updateHardeningPolicy = useBlockerHardeningStore((state) => state.updatePolicy);
  const [loading, setLoading] = useState(true);
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [togglingProtection, setTogglingProtection] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [domainsCount, setDomainsCount] = useState(0);
  const [patternsCount, setPatternsCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelist, setNewWhitelist] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<{ blocked: boolean; domain: string | null } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [protectionIssue, setProtectionIssue] = useState<ProtectionIssue | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [lastSyncStale, setLastSyncStale] = useState(false);

  const canSync = apiUrl.trim().length > 0 && !syncing;
  const canSaveUrl = apiUrl.trim().length > 0;
  const canAddWhitelist = newWhitelist.trim().length > 0;
  const canTestDomain = testInput.trim().length > 0;
  const hardeningScore = computeBlockerHardeningScore({
    policy: {
      strictMode,
      blockDoh,
      blockDot,
      blockQuic,
      lockdownVpn,
      tamperAlerts,
    },
    protectionEnabled,
    lastSyncStale,
  });
  const hardeningLevel =
    hardeningScore >= 75 ? copy.hardeningHigh : hardeningScore >= 50 ? copy.hardeningMedium : copy.hardeningLow;

  const persistHardeningToNative = useCallback(
    async (policy: {
      strictMode: boolean;
      blockDoh: boolean;
      blockDot: boolean;
      blockQuic: boolean;
      lockdownVpn: boolean;
      tamperAlerts: boolean;
    }) => {
      try {
        await SharedConfig.saveBlockerHardening(policy);
      } catch {
        // Native persistence is best-effort.
      }
    },
    []
  );

  const applyHardeningUpdate = useCallback(
    async (
      partial: Partial<{
        strictMode: boolean;
        blockDoh: boolean;
        blockDot: boolean;
        blockQuic: boolean;
        lockdownVpn: boolean;
        tamperAlerts: boolean;
      }>
    ) => {
      const next = {
        strictMode: partial.strictMode ?? strictMode,
        blockDoh: partial.blockDoh ?? blockDoh,
        blockDot: partial.blockDot ?? blockDot,
        blockQuic: partial.blockQuic ?? blockQuic,
        lockdownVpn: partial.lockdownVpn ?? lockdownVpn,
        tamperAlerts: partial.tamperAlerts ?? tamperAlerts,
      };
      await updateHardeningPolicy(partial);
      await persistHardeningToNative(next);
    },
    [
      blockDoh,
      blockDot,
      blockQuic,
      lockdownVpn,
      persistHardeningToNative,
      strictMode,
      tamperAlerts,
      updateHardeningPolicy,
    ]
  );

  const refreshProtectionEnabled = useCallback(async () => {
    try {
      const enabled = await GamblingBlocker.isProtectionEnabled();
      setProtectionEnabled(enabled);
      return enabled;
    } catch {
      setProtectionEnabled(false);
      return false;
    }
  }, []);

  const openSystemSettings = useCallback(async () => {
    try {
      if (typeof Linking.openSettings === "function") {
        await Linking.openSettings();
        return;
      }
      await Linking.openURL("app-settings:");
    } catch {
      Alert.alert(copy.genericErrorTitle, copy.toggleUnsupported);
    }
  }, [copy.genericErrorTitle, copy.toggleUnsupported]);

  const confirmVpnDisclosure = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (value: boolean) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        Alert.alert(
          copy.vpnDisclosureTitle,
          copy.vpnDisclosureBody,
          [
            {
              text: copy.vpnDisclosureCancel,
              style: "cancel",
              onPress: () => finish(false),
            },
            {
              text: copy.vpnDisclosureAccept,
              onPress: () => finish(true),
            },
          ],
          {
            cancelable: false,
            onDismiss: () => finish(false),
          }
        );
      }),
    [
      copy.vpnDisclosureAccept,
      copy.vpnDisclosureBody,
      copy.vpnDisclosureCancel,
      copy.vpnDisclosureTitle,
    ]
  );

  const loadState = useCallback(async () => {
    try {
      const state = await getBlockerState();
      setApiUrl(state.apiUrl);
      setDomainsCount(state.domains.length);
      setPatternsCount(state.patterns.length);
      setLastSync(state.lastSync);
      setLastSyncStale(state.lastSync === null || Date.now() - state.lastSync > STALE_WARNING_MS);
      setSyncNotice(null);
      setWhitelist(state.whitelist);
      await SharedConfig.saveBlocklist(state.domains);
      await SharedConfig.savePatterns(state.patterns);
      await SharedConfig.saveWhitelist(state.whitelist);

      const needsAutoSync = state.lastSync === null || Date.now() - state.lastSync > AUTO_SYNC_STALE_MS;
      if (needsAutoSync && state.apiUrl.trim().length > 0) {
        setSyncNotice(copy.autoSyncRunning);
        try {
          const synced = await syncBlocklist(state.apiUrl, "auto");
          setApiUrl(synced.apiUrl);
          setDomainsCount(synced.domains.length);
          setPatternsCount(synced.patterns.length);
          setLastSync(synced.lastSync);
          setLastSyncStale(false);
          setSyncNotice(copy.autoSyncDone);
          try {
            await GamblingBlocker.syncBlocklist(synced.apiUrl);
          } catch {
            // Native sync remains optional.
          }
        } catch {
          setSyncNotice(copy.autoSyncFailed);
        }
      }

      await refreshProtectionEnabled();
    } catch (error) {
      console.error("Blocker state load error:", error);
      Alert.alert(copy.genericErrorTitle, copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [
    copy.autoSyncDone,
    copy.autoSyncFailed,
    copy.autoSyncRunning,
    copy.genericErrorTitle,
    copy.loadError,
    refreshProtectionEnabled,
  ]);

  useEffect(() => {
    void hydrateHardening();
  }, [hydrateHardening]);

  useEffect(() => {
    void persistHardeningToNative({
      strictMode,
      blockDoh,
      blockDot,
      blockQuic,
      lockdownVpn,
      tamperAlerts,
    });
  }, [blockDoh, blockDot, blockQuic, lockdownVpn, persistHardeningToNative, strictMode, tamperAlerts]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const toggleProtection = async (value: boolean) => {
    if (value) {
      const accepted = await confirmVpnDisclosure();
      if (!accepted) {
        setProtectionEnabled(false);
        return;
      }
    }

    setTogglingProtection(true);
    setProtectionIssue(null);
    try {
      const result = value ? await GamblingBlocker.startProtection() : await GamblingBlocker.stopProtection();
      const { status, reason, message } = result;
      if (status === "running") {
        setProtectionEnabled(true);
      } else if (status === "stopped") {
        setProtectionEnabled(false);
      } else {
        await refreshProtectionEnabled();
      }

      const issue = mapProtectionIssue(reason, message, value, copy);
      if (issue) {
        setProtectionIssue(issue);
      }
    } catch {
      await refreshProtectionEnabled();
      setProtectionIssue({
        reason: "generic",
        title: copy.genericErrorTitle,
        body: copy.toggleUnsupported,
      });
    } finally {
      setTogglingProtection(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const state = await syncBlocklist(apiUrl);
      setApiUrl(state.apiUrl);
      setDomainsCount(state.domains.length);
      setPatternsCount(state.patterns.length);
      setLastSync(state.lastSync);
      setLastSyncStale(false);
      setSyncNotice(null);
      try {
        await GamblingBlocker.syncBlocklist(apiUrl);
      } catch {
        // Native sync is optional on some platforms.
      }
      Alert.alert(copy.syncDoneTitle, copy.syncDoneBody);
    } catch (error) {
      const message = mapBlockerError(error, "sync", copy);
      Alert.alert(copy.syncFailedTitle, message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert(copy.invalidUrlTitle, copy.invalidUrlBody);
      return;
    }
    try {
      const normalized = await saveApiUrl(apiUrl.trim());
      setApiUrl(normalized);
      Alert.alert(copy.savedTitle, copy.savedBody);
    } catch (error) {
      const message = mapBlockerError(error, "saveApiUrl", copy);
      Alert.alert(copy.genericErrorTitle, message);
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelist.trim()) return;
    try {
      const updated = await addWhitelistDomain(newWhitelist.trim());
      setWhitelist(updated);
      setNewWhitelist("");
    } catch {
      Alert.alert(copy.genericErrorTitle, copy.addWhitelistError);
    }
  };

  const handleRemoveWhitelist = async (domain: string) => {
    try {
      const updated = await removeWhitelistDomain(domain);
      setWhitelist(updated);
    } catch {
      Alert.alert(copy.genericErrorTitle, copy.removeWhitelistError);
    }
  };

  const handleTestDomain = async () => {
    if (!testInput.trim()) return;
    try {
      const result = await checkDomainBlocked(testInput.trim());
      setTestResult(result);
    } catch {
      Alert.alert(copy.genericErrorTitle, copy.domainTestError);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="blocker-screen">
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{copy.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="blocker-screen">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            testID="blocker-back"
            accessibilityLabel={copy.backAccessibility}
            accessibilityRole="button"
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.protectionTitle}</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{copy.enableProtection}</Text>
            {togglingProtection ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={protectionEnabled}
                onValueChange={toggleProtection}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
                disabled={togglingProtection}
                testID="blocker-protection-switch"
                accessibilityLabel={copy.enableProtectionAccessibility}
                accessibilityHint={copy.enableProtectionHint}
              />
            )}
          </View>
          <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>{copy.protectionDescription}</Text>
          {protectionIssue ? (
            <View
              style={[
                styles.protectionIssueCard,
                {
                  borderColor: `${colors.warning ?? colors.primary}55`,
                  backgroundColor: `${colors.warning ?? colors.primary}14`,
                },
              ]}
              testID="blocker-protection-fallback"
            >
              <Text style={[styles.protectionIssueTitle, { color: colors.text }]}>{protectionIssue.title}</Text>
              <Text style={[styles.protectionIssueBody, { color: colors.textSecondary }]}>{protectionIssue.body}</Text>
              {protectionIssue.actionLabel ? (
                <TouchableOpacity
                  style={[
                    styles.protectionIssueAction,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => void openSystemSettings()}
                  accessibilityLabel={protectionIssue.actionLabel}
                >
                  <Text style={[styles.protectionIssueActionText, { color: colors.primary }]}>
                    {protectionIssue.actionLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.hardeningTitle}</Text>
          <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>{copy.hardeningSubtitle}</Text>

          <View style={[styles.hardeningScoreBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.hardeningScoreLabel, { color: colors.textSecondary }]}>
              {copy.hardeningScoreLabel}
            </Text>
            <Text style={[styles.hardeningScoreValue, { color: colors.text }]}>
              {hardeningScore}/100 - {hardeningLevel}
            </Text>
          </View>

          <View style={styles.hardeningRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{copy.strictMode}</Text>
            <Switch
              value={strictMode}
              onValueChange={(value) => void applyHardeningUpdate({ strictMode: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.hardeningRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{copy.blockDoh}</Text>
            <Switch
              value={blockDoh}
              onValueChange={(value) => void applyHardeningUpdate({ blockDoh: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.hardeningRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{copy.blockDot}</Text>
            <Switch
              value={blockDot}
              onValueChange={(value) => void applyHardeningUpdate({ blockDot: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.hardeningRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{copy.blockQuic}</Text>
            <Switch
              value={blockQuic}
              onValueChange={(value) => void applyHardeningUpdate({ blockQuic: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.hardeningRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{copy.lockdownVpn}</Text>
            <Switch
              value={lockdownVpn}
              onValueChange={(value) => void applyHardeningUpdate({ lockdownVpn: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.hardeningRow, styles.hardeningRowLast]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{copy.tamperAlerts}</Text>
            <Switch
              value={tamperAlerts}
              onValueChange={(value) => void applyHardeningUpdate({ tamperAlerts: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>{copy.hardeningHint}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.vpnInfoTitle}</Text>
          <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>{copy.vpnInfoDescription}</Text>
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{copy.bullet1}</Text>
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{copy.bullet2}</Text>
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{copy.bullet3}</Text>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => void openSystemSettings()}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.openVpnSettings}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/limitations")}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.limitations}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/privacy")}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.privacy}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.syncTitle}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder={copy.apiPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={apiUrl}
            onChangeText={setApiUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                !canSaveUrl && styles.buttonDisabled,
              ]}
              onPress={handleSaveApiUrl}
              disabled={!canSaveUrl}
              accessibilityLabel={copy.saveUrlAccessibility}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.saveUrl}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                !canSync && styles.buttonDisabled,
              ]}
              onPress={handleSync}
              disabled={!canSync}
              testID="blocker-sync-btn"
              accessibilityLabel={copy.syncAccessibility}
              accessibilityState={{ busy: syncing }}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{copy.syncNow}</Text>
              )}
            </TouchableOpacity>
          </View>
          {syncNotice ? (
            <View style={[styles.syncNoticeBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.syncNoticeText, { color: colors.textSecondary }]}>{syncNotice}</Text>
            </View>
          ) : null}
          {lastSyncStale ? (
            <View style={[styles.syncWarningBox, { borderColor: `${colors.warning ?? colors.primary}55` }]}>
              <Text style={[styles.syncWarningText, { color: colors.warning ?? "#B45309" }]}>
                {copy.staleSyncWarning}
              </Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{copy.domains}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{domainsCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{copy.patterns}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{patternsCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{copy.lastSync}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatLastSync(lastSync, locale, copy)}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.whitelistTitle}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder={copy.whitelistPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={newWhitelist}
            onChangeText={setNewWhitelist}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              !canAddWhitelist && styles.buttonDisabled,
            ]}
            onPress={handleAddWhitelist}
            disabled={!canAddWhitelist}
            accessibilityLabel={copy.addWhitelistAccessibility}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.addWhitelist}</Text>
          </TouchableOpacity>
          {whitelist.length > 0 ? (
            <View style={styles.tagList}>
              {whitelist.map((domain) => (
                <TouchableOpacity
                  key={domain}
                  style={[styles.tag, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "33" }]}
                  onPress={() => handleRemoveWhitelist(domain)}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>{`${domain} x`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.noWhitelist}</Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.domainTestTitle}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder={copy.domainTestPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={testInput}
            onChangeText={setTestInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              !canTestDomain && styles.buttonDisabled,
            ]}
            onPress={handleTestDomain}
            disabled={!canTestDomain}
            accessibilityLabel={copy.checkNow}
          >
            <Text style={styles.primaryButtonText}>{copy.checkNow}</Text>
          </TouchableOpacity>
          {testResult && (
            <View style={[styles.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.resultText, { color: colors.text }]}>
                {copy.domainLabel}: {testResult.domain || copy.unknownDomain}
              </Text>
              <Text
                style={[
                  styles.resultText,
                  testResult.blocked ? styles.blocked : styles.allowed,
                  { color: testResult.blocked ? colors.warning ?? "#D97706" : "#1E7A55" },
                ]}
              >
                {testResult.blocked ? copy.blocked : copy.allowed}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  loaderText: {
    fontSize: 15,
    fontFamily: Fonts.body,
  },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.lg },
  backButton: { marginBottom: Spacing.md },
  backButtonText: { fontSize: 15, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 28, fontFamily: Fonts.display },
  section: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bodySemiBold, marginBottom: Spacing.md },
  sectionSubtext: { fontSize: 13, fontFamily: Fonts.body, marginTop: Spacing.sm, lineHeight: 20 },
  protectionIssueCard: {
    marginTop: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  protectionIssueTitle: { fontSize: 14, fontFamily: Fonts.bodySemiBold },
  protectionIssueBody: { fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 },
  protectionIssueAction: {
    alignSelf: "flex-start",
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  protectionIssueActionText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  bulletText: { fontSize: 13, fontFamily: Fonts.body, marginTop: 6 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hardeningScoreBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hardeningScoreLabel: { fontSize: 12, fontFamily: Fonts.body },
  hardeningScoreValue: { fontSize: 15, fontFamily: Fonts.bodySemiBold, marginTop: 2 },
  hardeningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.25)",
  },
  hardeningRowLast: { borderBottomWidth: 0, marginBottom: Spacing.sm },
  settingLabel: { fontSize: 15, fontFamily: Fonts.bodyMedium },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    fontFamily: Fonts.body,
  },
  buttonRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md },
  syncNoticeBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  syncNoticeText: { fontSize: 12, fontFamily: Fonts.body, lineHeight: 18 },
  syncWarningBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: "rgba(217, 119, 6, 0.08)",
  },
  syncWarningText: { fontSize: 12, fontFamily: Fonts.bodySemiBold, lineHeight: 18 },
  primaryButton: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
  },
  primaryButtonText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold },
  secondaryButton: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
    borderWidth: 1,
  },
  secondaryButtonText: { fontFamily: Fonts.bodySemiBold },
  buttonDisabled: { opacity: 0.5 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoLabel: { fontSize: 14, fontFamily: Fonts.body },
  infoValue: { fontSize: 14, fontFamily: Fonts.bodySemiBold },
  tagList: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.sm },
  tag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1 },
  tagText: { fontSize: 13, fontFamily: Fonts.bodyMedium },
  emptyText: { fontSize: 13, fontFamily: Fonts.body, fontStyle: "italic", marginTop: Spacing.sm },
  resultBox: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  resultText: { fontSize: 14, fontFamily: Fonts.body, marginBottom: 4 },
  blocked: { fontFamily: Fonts.bodySemiBold },
  allowed: { fontFamily: Fonts.bodySemiBold },
});
