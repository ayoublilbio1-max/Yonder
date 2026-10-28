import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { Skeleton } from "../../components/Skeleton";
import { GoldSheet } from "../../deck/GoldSheet";
import { MatchModal } from "../../deck/MatchModal";
import { ProfileModal } from "../../deck/ProfileModal";
import { useSwipe } from "../../deck/SwipeProvider";
import { withOverrides } from "../../filters/filters";
import { mainPhotoUri, profileById } from "../../profiles/data";
import { isLocked } from "../../profiles/extras";
import type { Profile } from "../../profiles/types";
import { useWallet } from "../../store/WalletProvider";
import { useTheme } from "../../theme/ThemeProvider";

// Likes (like Muzz): "Likes you" — people who liked you (blurred without Gold) — and your Favorites.
// Liking someone who likes you is an instant match.

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
type Tab = "likes" | "favorites";

export default function LikesScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { ready, likedYou, saved, swipe, me } = useSwipe();
  const { wallet } = useWallet();
  const [tab, setTab] = useState<Tab>("likes");
  const [open, setOpen] = useState<Profile | null>(null);
  const [match, setMatch] = useState<Profile | null>(null);
  const [goldOpen, setGoldOpen] = useState(false);

  const favorites = saved.favorites
    .map((id) => profileById(id))
    .filter((p): p is Profile => Boolean(p))
    .filter((p) => !saved.blocked.includes(p.id))
    .map(withOverrides);

  const cardW = Math.floor((width - 16 * 2 - 12) / 2);
  const cardH = Math.round(cardW * 1.35);
  const blurred = tab === "likes" && !wallet.gold;
  const data = tab === "likes" ? likedYou : favorites;

  const tapCard = (p: Profile) => {
    if (blurred) {
      setGoldOpen(true);
      return;
    }
    if (__DEV__) console.log(`[likes] open ${p.id} (${tab})`);
    setOpen(p);
  };

  const decide = (action: "like" | "pass") => {
    const p = open;
    if (!p) return;
    setOpen(null);
    const matched = swipe(p.id, action);
    if (__DEV__)
      console.log(`[likes] ${action} ${p.id}${matched ? " → MATCH" : ""}`);
    if (matched) setMatch(p);
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.bg, paddingTop: insets.top + 12 },
      ]}
    >
      <AppText variant="title" style={styles.title}>
        Likes
      </AppText>
      <Tabs
        tab={tab}
        onChange={setTab}
        likes={likedYou.length}
        favorites={favorites.length}
      />

      {!ready ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              style={{ width: cardW, height: cardH, borderRadius: 18 }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          key={tab}
          data={data}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            data.length === 0 && styles.flexGrow,
          ]}
          ListHeaderComponent={
            blurred && likedYou.length ? (
              <Pressable
                onPress={() => setGoldOpen(true)}
                accessibilityRole="button"
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.goldSoft,
                    borderColor: colors.gold,
                  },
                ]}
              >
                <Ionicons name="star" size={22} color={colors.gold} />
                <View style={styles.flex}>
                  <AppText variant="body" weight="semibold">
                    See who likes you
                  </AppText>
                  <AppText variant="caption" muted>
                    Match with them instantly with Yonder Gold.
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.gold}
                />
              </Pressable>
            ) : undefined
          }
          ListEmptyComponent={
            <Animated.View entering={FadeIn.duration(250)} style={styles.empty}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Ionicons
                  name={tab === "likes" ? "heart-outline" : "star-outline"}
                  size={38}
                  color={colors.primary}
                />
              </View>
              <AppText variant="heading" align="center">
                {tab === "likes" ? "No new likes yet" : "No favorites yet"}
              </AppText>
              <AppText variant="body" muted align="center">
                {tab === "likes"
                  ? "Keep swiping. People who like you show up here."
                  : "Tap Favorite on a profile to keep it here."}
              </AppText>
              <AppButton
                label="Go to Swipe"
                icon="heart"
                onPress={() => router.navigate("/" as Href)}
                style={styles.emptyButton}
              />
            </Animated.View>
          }
          renderItem={({ item }) => (
            <Card
              profile={item}
              width={cardW}
              height={cardH}
              blurred={blurred}
              matched={Boolean(saved.matches[item.id])}
              onPress={() => tapCard(item)}
            />
          )}
        />
      )}

      <ProfileModal
        profile={open}
        matched={open ? Boolean(saved.matches[open.id]) : false}
        liked={
          open
            ? saved.decisions[open.id] === "like" ||
              saved.decisions[open.id] === "superlike"
            : false
        }
        onClose={() => setOpen(null)}
        onLike={() => decide("like")}
        onPass={() => decide("pass")}
        onOpenChat={() => {
          const id = open?.id;
          setOpen(null);
          if (id) router.push(`/chat/${id}` as Href);
        }}
      />

      <MatchModal
        profile={match}
        myPhoto={me.photos?.[0]}
        myName={me.firstName}
        onClose={() => setMatch(null)}
        onMessage={() => {
          const id = match?.id;
          setMatch(null);
          if (id) router.push(`/chat/${id}` as Href);
        }}
      />

      <GoldSheet
        visible={goldOpen}
        variant="likes"
        likers={likedYou}
        onClose={() => setGoldOpen(false)}
      />
    </View>
  );
}

function Card({
  profile,
  width,
  height,
  blurred,
  matched,
  onPress,
}: {
  profile: Profile;
  width: number;
  height: number;
  blurred: boolean;
  matched: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  const hidden = blurred || isLocked(profile);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        blurred ? "Someone who likes you" : `${profile.name}, ${profile.age}`
      }
      style={({ pressed }) => [
        styles.card,
        {
          width,
          height,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Image
        source={{ uri: mainPhotoUri(profile) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        blurRadius={hidden ? 45 : 0}
        transition={180}
      />
      <LinearGradient
        colors={["transparent", colors.photoScrimBottom]}
        locations={[0.55, 1]}
        style={[StyleSheet.absoluteFill, styles.noTouch]}
      />
      {blurred ? (
        <View style={[StyleSheet.absoluteFill, styles.center, styles.noTouch]}>
          <Ionicons name="lock-closed" size={26} color={colors.onPhoto} />
        </View>
      ) : (
        <View style={[styles.cardInfo, styles.noTouch]}>
          <View style={styles.nameRow}>
            <AppText
              variant="body"
              weight="bold"
              color={colors.onPhoto}
              numberOfLines={1}
              style={styles.shrink}
            >
              {profile.name}, {profile.age}
            </AppText>
            {profile.verified ? (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.verified}
              />
            ) : null}
          </View>
          {matched ? (
            <AppText variant="caption" weight="semibold" color={colors.onPhoto}>
              Matched ✓
            </AppText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

// "Likes you (7) | Favorites (2)" — the pink line slides with a CSS-like ease.
function Tabs({
  tab,
  onChange,
  likes,
  favorites,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  likes: number;
  favorites: number;
}) {
  const colors = useTheme();
  const [w, setW] = useState(0);
  const x = useSharedValue(tab === "likes" ? 0 : 1);
  useEffect(() => {
    x.set(withTiming(tab === "likes" ? 0 : 1, { duration: 240, easing: EASE }));
  }, [tab, x]);
  const lineStyle = useAnimatedStyle(() => ({
    width: w / 2,
    transform: [{ translateX: (x.get() * w) / 2 }],
  }));
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <View
      style={[styles.tabs, { borderBottomColor: colors.border }]}
      onLayout={onLayout}
    >
      {(["likes", "favorites"] as Tab[]).map((t) => (
        <Pressable
          key={t}
          onPress={() => onChange(t)}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === t }}
          style={styles.tabBtn}
        >
          <AppText
            variant="body"
            weight="semibold"
            color={tab === t ? colors.primary : colors.textMuted}
          >
            {t === "likes"
              ? `Likes you (${likes})`
              : `Favorites (${favorites})`}
          </AppText>
        </Pressable>
      ))}
      <Animated.View
        style={[styles.tabLine, { backgroundColor: colors.primary }, lineStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  noTouch: {
    pointerEvents: "none",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
  },
  tabLine: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 3,
    borderRadius: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 4,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
  },
  cardInfo: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyButton: {
    alignSelf: "stretch",
    marginTop: 14,
  },
});
