import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
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
import { SvgXml } from "react-native-svg";
import { AppText } from "../../components/AppText";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { EXPLORE_ART } from "../../constants/exploreArt";
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
import type { Profile } from "../../profiles/types";
import { useWallet } from "../../store/WalletProvider";
import { useTheme } from "../../theme/ThemeProvider";

// Explore (like Tinder Explore): categories of people — what they're looking for, highlights,
// and shared passions. Each opens its own swipe deck. "Active now" and "Nearby" are Gold.
// Card: a glossy illustration on top of a blurred photo of someone in the category, tinted to the theme.

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
            blurRadius={40}
            transition={200}
          />
        ) : null}
        {/* theme tint over the blurred photo (light card in light mode, dark in dark mode) */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.tint,
            { backgroundColor: colors.card },
          ]}
        />
        <View style={[styles.art, styles.noTouch, { height: h * 0.62 }]}>
          <SvgXml
            xml={EXPLORE_ART[c.key] ?? null}
            width={Math.min(w * 0.7, h * 0.55)}
            height={Math.min(w * 0.7, h * 0.55)}
          />
        </View>
        {locked ? (
          <View
            style={[
              styles.goldTag,
              styles.noTouch,
              { backgroundColor: colors.gold },
            ]}
          >
            <Ionicons name="lock-closed" size={11} color={colors.onPhoto} />
            <AppText variant="caption" weight="bold" color={colors.onPhoto}>
              GOLD
            </AppText>
          </View>
        ) : null}
        <View style={[styles.cardText, styles.noTouch]}>
          <AppText
            variant="body"
            weight="bold"
            numberOfLines={2}
            style={styles.flex}
          >
            {c.title}
          </AppText>
          <AppText variant="body" weight="semibold" muted>
            {people.length}
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
  tint: {
    opacity: 0.72,
  },
  art: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  goldTag: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flex: {
    flex: 1,
  },
  cardText: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
});
