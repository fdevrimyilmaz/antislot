import { type Href, router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  type FlatListProps,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { haptics } from "@/services/haptics";

const { width: SCREEN_W } = Dimensions.get("window");

type Slide = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  cta: string;
  route: Href;
};

const SLIDES: Slide[] = [
  {
    key: "self-exclusion",
    icon: "lock-closed",
    title: "Self-Exclusion — Karar kilidi",
    body:
      "Sakin anında 24 saat ila 1 yıl arası bir süre seç; uygulama içindeki yıkıcı işlemleri kendin için kilitle. Süresi dolmadan değişmez — kendi sözünü koruma altına alır.",
    cta: "Şimdi gör",
    route: "/self-exclusion" as Href,
  },
  {
    key: "risk-windows",
    icon: "time",
    title: "Risk Pencereleri",
    body:
      "Hafta sonu geceleri, maç akşamları, maaş günü — senin için en riskli zamanları işaretle. Pencere aktifken uygulama uyarı verir, SOS yolu kısalır.",
    cta: "Pencere ekle",
    route: "/risk-windows" as Href,
  },
  {
    key: "curriculum",
    icon: "leaf",
    title: "30 Günlük Yol",
    body:
      "Beyin bilimi, beceri, kimlik ve gelecek planı… 30 günde günlük 4–6 dakikalık yapılandırılmış bir iyileşme yolculuğu.",
    cta: "Yolculuğu başlat",
    route: "/curriculum" as Href,
  },
  {
    key: "notifications",
    icon: "notifications",
    title: "Hatırlatıcılar",
    body:
      "Risk penceresi başlangıcı + sabah check-in için cihazında yerel hatırlatıcı kur. Sunucuya bağlanmaz, kişisel veri dışarı çıkmaz.",
    cta: "Bildirimleri aç",
    route: "/notifications" as Href,
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function WelcomeTour({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const isLast = index === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== index) {
      haptics.selection();
      setIndex(next);
    }
  };

  const handleNext = () => {
    haptics.tapLight();
    if (isLast) {
      onClose();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const handleSkip = () => {
    haptics.tapLight();
    onClose();
  };

  const handleCta = (slide: Slide) => {
    haptics.tapMedium();
    onClose();
    // Defer so the modal animates out before navigating.
    setTimeout(() => router.push(slide.route), 220);
  };

  const renderItem: FlatListProps<Slide>["renderItem"] = ({ item }) => (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View
        style={[
          styles.slideContent,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <LinearGradient
          colors={colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconWrap}
        >
          <Ionicons name={item.icon} size={32} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{item.body}</Text>
        <Button
          title={item.cta}
          onPress={() => handleCta(item)}
          variant="primary"
          fullWidth
          rightIcon="arrow-forward"
          style={styles.ctaBtn}
        />
      </View>
    </View>
  );

  const dots = useMemo(
    () =>
      SLIDES.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === index ? colors.primary : colors.cardBorder,
              width: i === index ? 18 : 6,
            },
          ]}
        />
      )),
    [index, colors]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
              YENİ ÖZELLİKLER · {index + 1}/{SLIDES.length}
            </Text>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Atla"
            >
              <Text style={[styles.skip, { color: colors.textMuted }]}>Atla</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(s) => s.key}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            getItemLayout={(_, i) => ({
              length: SCREEN_W,
              offset: SCREEN_W * i,
              index: i,
            })}
          />

          <View style={styles.bottomRow}>
            <View style={styles.dotsRow}>{dots}</View>
            <Button
              title={isLast ? "Tamam" : "Sonraki"}
              onPress={handleNext}
              variant={isLast ? "primary" : "secondary"}
              rightIcon={isLast ? "checkmark" : "arrow-forward"}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "transparent",
    paddingTop: 14,
    paddingBottom: 22,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  skip: { fontSize: 13, fontWeight: "700" },

  slide: {
    paddingHorizontal: 22,
  },
  slideContent: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 18,
  },
  ctaBtn: { width: "100%" },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});
