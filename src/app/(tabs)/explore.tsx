import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { GoldSheet } from "../../deck/GoldSheet";
import { MatchModal } from "../../deck/MatchModal";
import { useSwipe } from "../../deck/SwipeProvider";
import {
  coverOf,
  HIGHLIGHTS,
  LOOKING_FOR,
  PASSIONS,
  type Category,
} from "../../explore/categories";
import { CategoryDeck } from "../../explore/CategoryDeck";
import { mainPhotoUri } from "../../profiles/data";
import { isLocked } from "../../profiles/extras";
import type { Profile } from "../../profiles/types";
import { useWallet } from "../../store/WalletProvider";
import { useTheme } from "../../theme/ThemeProvider";

// Explore (like Tinder Explore): categories of people — what they're looking for, highlights,
// and shared passions. Each opens its own swipe deck. "Active now" and "Nearby" are Gold.

export default function ExploreScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { ready, deck, me } = useSwipe();
  const { wallet } = useWallet();
  const [category, setCategory] = useState<Category | null>(null);
  const [match, setMatch] = useState<Profile | null>(null);
  const [goldOpen, setGoldOpen] = useState(false);

  const half = Math.floor((width - 16 * 2 - 12) / 2);

  const openCategory = (c: Category, count: number) => {
    if (c.gold && !wallet.gold) {
      if (__DEV__) console.log(`[explore] ${c.key} needs Gold`);
      setGoldOpen(true);
      return;
    }
    if (count === 0) {
      toast.show("No one new here right now. Try another category.");
      return;
    }
    setCategory(c);
  };

  const card = (c: Category, w: number, h: number) => {
    const people = deck.filter(c.test);
    const cover = coverOf(people);
    const locked = Boolean(c.gold && !wallet.gold);
    return (
      <Pressable
        key={c.key}
        onPress={() => openCategory(c, people.length)}
        accessibilityRole="button"
        accessibilityLabel={`${c.title}, ${people.length} people`}
        style={({ pressed }) => [
          styles.card,
          {
            width: w,
            height: h,
            backgroundColor: colors.surface,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        {cover ? (
          <Image
            source={{ uri: mainPhotoUri(cover) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            blurRadius={locked || isLocked(cover) ? 35 : 0}
            transition={200}
          />
        ) : null}
        <LinearGradient
          colors={[
            "transparent",
            colors.photoScrimMiddle,
            colors.photoScrimBottom,
          ]}
          locations={[0.35, 0.6, 1]}
          style={[StyleSheet.absoluteFill, styles.noTouch]}
        />
        <View style={[styles.cardTop, styles.noTouch]}>
          <View
            style={[styles.cardIcon, { backgroundColor: colors.photoScrimTop }]}
          >
            <Ionicons name={c.icon} size={16} color={colors.onPhoto} />
          </View>
          {locked ? (
            <View style={[styles.goldTag, { backgroundColor: colors.gold }]}>
              <Ionicons name="lock-closed" size={11} color={colors.onPhoto} />
              <AppText variant="caption" weight="bold" color={colors.onPhoto}>
                GOLD
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={[styles.cardText, styles.noTouch]}>
          <AppText
            variant="body"
            weight="bold"
            color={colors.onPhoto}
            numberOfLines={1}
          >
            {c.title}
          </AppText>
          <AppText
            variant="caption"
            color={colors.onPhotoMuted}
            numberOfLines={1}
          >
            {people.length} {people.length === 1 ? "person" : "people"} ·{" "}
            {c.subtitle}
          </AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.bg, paddingTop: insets.top + 12 },
      ]}
    >
      <AppText variant="title" style={styles.title}>
        Explore
      </AppText>

      {!ready ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              style={{ width: half, height: half * 1.2, borderRadius: 18 }}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Section title="Looking for" />
          <View style={styles.grid}>
            {LOOKING_FOR.map((c) => card(c, half, Math.round(half * 1.2)))}
          </View>

          <Section title="Highlights" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {HIGHLIGHTS.map((c) =>
              card(c, Math.round(width * 0.42), Math.round(width * 0.56)),
            )}
          </ScrollView>

          <Section title="Shared passions" />
          <View style={styles.grid}>
            {PASSIONS.map((c) => card(c, half, Math.round(half * 0.9)))}
          </View>
        </ScrollView>
      )}

      <CategoryDeck
        category={category}
        onClose={() => setCategory(null)}
        onMatch={setMatch}
      />

      <MatchModal
        profile={match}
        myPhoto={me.photos?.[0]}
        myName={me.firstName}
        onClose={() => setMatch(null)}
        onMessage={() => {
          const id = match?.id;
          setMatch(null);
          setCategory(null);
          if (id) router.push(`/chat/${id}` as Href);
        }}
      />

      <GoldSheet visible={goldOpen} onClose={() => setGoldOpen(false)} />
    </View>
  );
}

function Section({ title }: { title: string }) {
  return (
    <AppText variant="label" muted style={styles.section}>
      {title.toUpperCase()}
    </AppText>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  noTouch: {
    pointerEvents: "none",
  },
  title: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  content: {
    paddingBottom: 28,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
  },
  row: {
    gap: 12,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
  },
  cardTop: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  goldTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardText: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    gap: 2,
  },
});
