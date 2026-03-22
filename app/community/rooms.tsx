import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { getStoredUsername } from "@/store/profileStore";
import {
  COMMUNITY_ROOMS,
  listenToRoomOnlineCount,
  type CommunityRoomId,
} from "@/lib/community";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RoomCounts = Partial<Record<CommunityRoomId, number>>;
const HIDDEN_CHAT_ROOM_IDS: CommunityRoomId[] = ["kriz", "gunluk", "dinleme"];

const COMMUNITY_ROOMS_COPY = {
  tr: {
    title: "Sohbet Odalari",
    subtitle: "Bir oda sec, kullanici adiyla topluluga katil.",
    onlineSuffix: "cevrimici",
    join: "Katil ->",
  },
  en: {
    title: "Chat Rooms",
    subtitle: "Choose a room and join with your username.",
    onlineSuffix: "online",
    join: "Join ->",
  },
} as const;

const LOCALIZED_ROOM_META: Record<
  "tr" | "en",
  Record<CommunityRoomId, { name: string; description: string }>
> = {
  tr: {
    kriz: {
      name: "Sohbet",
      description: "Kullanici adiyla ortak sohbet. Acil durumda hizli yazisma alani.",
    },
    kumar: {
      name: "Kumar",
      description: "Kumar durtusu ve geri donus riskleri icin.",
    },
    finans: {
      name: "Finans",
      description: "Maddi kaygilar ve borc yonetimi uzerine.",
    },
    motivasyon: {
      name: "Motivasyon",
      description: "Kucuk basarilar ve hedef paylasimlari.",
    },
    gunluk: {
      name: "Gunluk",
      description: "Gunun nasil gectigini toplulukla paylas.",
    },
    dinleme: {
      name: "Dinleme",
      description: "Sadece dinlenmek ve dinlemek isteyenler icin.",
    },
  },
  en: {
    kriz: {
      name: "Chat",
      description: "Shared live chat with usernames for urgent moments.",
    },
    kumar: {
      name: "Gambling",
      description: "For gambling urges and relapse risk moments.",
    },
    finans: {
      name: "Finance",
      description: "For money stress and debt management support.",
    },
    motivasyon: {
      name: "Motivation",
      description: "Share small wins and next-step goals.",
    },
    gunluk: {
      name: "Daily Check-in",
      description: "Post how your day went with the community.",
    },
    dinleme: {
      name: "Listening",
      description: "For people who want to listen or be heard.",
    },
  },
};

export default function CommunityRoomsScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(COMMUNITY_ROOMS_COPY);
  const localizedRoomMeta = useLocalizedCopy(LOCALIZED_ROOM_META);

  const [counts, setCounts] = useState<RoomCounts>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const username = await getStoredUsername();
      if (!active) return;
      if (!username) {
        router.replace({
          pathname: "/community/username",
          params: { next: "/community/rooms" },
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    COMMUNITY_ROOMS.filter((room) => !HIDDEN_CHAT_ROOM_IDS.includes(room.id)).forEach((room) => {
      const unsub = listenToRoomOnlineCount(room.id, (count) => {
        setCounts((prev) => ({ ...prev, [room.id]: count }));
      });
      unsubs.push(unsub);
    });
    setReady(true);
    return () => unsubs.forEach((u) => u());
  }, []);

  const localizedRooms = useMemo(() => {
    return COMMUNITY_ROOMS.filter((room) => !HIDDEN_CHAT_ROOM_IDS.includes(room.id)).map((room) => {
      const local = localizedRoomMeta[room.id];
      return {
        ...room,
        name: local.name,
        description: local.description,
      };
    });
  }, [localizedRoomMeta]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>
      </View>

      <View style={styles.list}>
        {localizedRooms.map((room) => {
          const online = counts[room.id] ?? 0;
          return (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push(`/community/room/${room.id}`)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardEmoji}>{room.emoji}</Text>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{room.name}</Text>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {room.description}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                {ready ? (
                  <Text style={[styles.onlineCount, { color: colors.primary }]}> 
                    {`${online} ${copy.onlineSuffix}`}
                  </Text>
                ) : (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
                <Text style={[styles.joinLabel, { color: colors.primary }]}>{copy.join}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: Spacing.md },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: {
    fontSize: 26,
    fontFamily: Fonts.display,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardEmoji: { fontSize: 28, marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: Fonts.bodySemiBold, marginBottom: 2 },
  cardDesc: { fontSize: 13, fontFamily: Fonts.body },
  cardRight: { alignItems: "flex-end", marginLeft: 12 },
  onlineCount: { fontSize: 12, fontFamily: Fonts.bodyMedium, marginBottom: 4 },
  joinLabel: { fontSize: 14, fontFamily: Fonts.bodySemiBold },
});

