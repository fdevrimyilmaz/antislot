import * as SecureStore from "expo-secure-store";

/**
 * Android Private DNS provider preference.
 *
 * Android exposes DoT (DNS-over-TLS) in `Settings → Network & Internet →
 * Private DNS → Provider hostname`. We can't set this for the user — that
 * would require system-level privileges Play Store would never grant. We
 * can only show them the hostname and walk them through the screen.
 *
 * The presets are well-known public resolvers that block gambling /
 * adult-content categories. The user can also enter a custom hostname
 * (typically their personal NextDNS profile, which is the only way to get
 * a list driven by our Telegram-managed blocklist).
 */

const PROVIDER_KEY = "antislot_android_dns_provider";

export interface DnsProvider {
  /** Stable id used in storage; never shown to the user. */
  id: string;
  /** User-facing name. */
  label: string;
  /** The DoT hostname the user pastes into Private DNS settings. */
  hostname: string;
  /** Short, human-readable description of what this provider blocks. */
  description: string;
  /** Whether this provider applies AntiSlot's own blocklist (NextDNS profile). */
  appliesAntislotList: boolean;
}

export const DNS_PROVIDERS: DnsProvider[] = [
  {
    id: "controld-malware-gambling",
    label: "Control D — Kumar + Reklam",
    hostname: "p1.freedns.controld.com",
    description:
      "Ücretsiz Control D profili. Kumar, dolandırıcılık ve reklam alanlarını engeller.",
    appliesAntislotList: false,
  },
  {
    id: "nextdns-default",
    label: "NextDNS (varsayılan profil)",
    hostname: "dns.nextdns.io",
    description:
      "Kendi NextDNS profilini bağlamak için kullan. Tam adres profil ID'ni içerir.",
    appliesAntislotList: false,
  },
  {
    id: "adguard-family",
    label: "AdGuard — Aile Koruması",
    hostname: "family.adguard-dns.com",
    description:
      "Yetişkin içerik + kumar + reklam engelleyen ücretsiz AdGuard profili.",
    appliesAntislotList: false,
  },
];

const DEFAULT_PROVIDER_ID = DNS_PROVIDERS[0].id;

export async function getSelectedProviderId(): Promise<string> {
  const value = await SecureStore.getItemAsync(PROVIDER_KEY);
  if (!value) return DEFAULT_PROVIDER_ID;
  return DNS_PROVIDERS.some((p) => p.id === value) ? value : DEFAULT_PROVIDER_ID;
}

export async function setSelectedProviderId(id: string): Promise<void> {
  if (!DNS_PROVIDERS.some((p) => p.id === id)) return;
  await SecureStore.setItemAsync(PROVIDER_KEY, id);
}

export function getProviderById(id: string): DnsProvider {
  return DNS_PROVIDERS.find((p) => p.id === id) ?? DNS_PROVIDERS[0];
}
