import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppText } from "../components/AppText";
import { Skeleton } from "../components/Skeleton";
import { mainPhotoUri, mediaOf } from "../profiles/data";
import {
  activityLabel,
  isGold,
  isJustJoined,
  isLocked,
  isRecentlyActive,
} from "../profiles/extras";
import { distanceKm } from "../profiles/session";
import type { Profile } from "../profiles/types";
import { useTheme } from "../theme/ThemeProvider";
import type { SwipeAction } from "./SwipeProvider";

// Profile card at the top of the Swipe page: swipe left / right, tap to open the photos.
// Vertical drags are left to the page so it can scroll (super like is a button only).

export type FlingFn = (action: SwipeAction) => void;

type Props = {
  profile: Profile;
  isTop: boolean;
  progress: SharedValue<number>; // 0..1 how far the top card has moved (grows the card under it)
  onSwiped: (action: SwipeAction) => void;
  onOpen?: () => void; // tap → full-screen media
  registerFling?: (fn: FlingFn | null) => void; // lets the buttons swipe the top card
};

const SWIPE_X = 110; // px past which a drag counts as a swipe
const FLING_VELOCITY = 900;
const DURATION = 300; // finger swipe: card flies out
// Button press: lean the card so the stamp shows, hold, then fly out.
const LEAN_MS = 260;
const HOLD_MS = 260;
const OUT_MS = 380;

export function SwipeCard({
  profile,
  isTop,
  progress,
  onSwiped,
  onOpen,
  registerFling,
}: Props) {
  const colors = useTheme();
  const { width, height } = useWindowDimensions();
  const [loaded, setLoaded] = useState(false);
  const locked = isLocked(profile);
  const mediaCount = mediaOf(profile).length;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  // Finger swipe: straight out.
  const fling = (action: SwipeAction) => {
    "worklet";
    const toX =
      action === "like" ? width * 1.6 : action === "pass" ? -width * 1.6 : 0;
    const toY = action === "superlike" ? -height * 1.2 : ty.get();
    progress.set(withTiming(1, { duration: DURATION }));
    tx.set(withTiming(toX, { duration: DURATION }));
    ty.set(
      withTiming(toY, { duration: DURATION }, (finished) => {
        if (finished) scheduleOnRN(onSwiped, action);
      }),
    );
  };

  // Button press: the card leans so LIKE / NOPE / SUPER LIKE is clearly seen, then leaves.
  const buttonFling = (action: SwipeAction) => {
    "worklet";
    const dir = action === "like" ? 1 : -1;
    progress.set(
      withDelay(LEAN_MS + HOLD_MS, withTiming(1, { duration: OUT_MS })),
    );
    if (action === "superlike") {
      ty.set(
        withSequence(
          withTiming(-height * 0.32, { duration: LEAN_MS }),
          withDelay(
            HOLD_MS,
            withTiming(-height * 1.2, { duration: OUT_MS }, (finished) => {
              if (finished) scheduleOnRN(onSwiped, action);
            }),
          ),
        ),
      );
      return;
    }
    tx.set(
      withSequence(
        withTiming(dir * SWIPE_X * 1.25, { duration: LEAN_MS }),
        withDelay(
          HOLD_MS,
          withTiming(dir * width * 1.6, { duration: OUT_MS }, (finished) => {
            if (finished) scheduleOnRN(onSwiped, action);
          }),
        ),
      ),
    );
    ty.set(
      withSequence(
        withTiming(-14, { duration: LEAN_MS }),
        withDelay(HOLD_MS, withTiming(40, { duration: OUT_MS })),
      ),
    );
  };

  // Let the action buttons swipe this card while it's on top.
  useEffect(() => {
    if (!isTop || !registerFling) return;
    registerFling(buttonFling);
    return () => registerFling(null);
  });

  const pan = usePanGesture({
    enabled: isTop,
    activeOffsetX: [-12, 12],
    failOffsetY: [-10, 10], // a vertical drag scrolls the page instead
    onUpdate: (e) => {
      "worklet";
      tx.set(e.translationX);
      ty.set(e.translationY * 0.3);
      progress.set(Math.min(1, Math.abs(e.translationX) / (width * 0.5)));
    },
    onDeactivate: (e) => {
      "worklet";
      if (e.translationX > SWIPE_X || e.velocityX > FLING_VELOCITY)
        fling("like");
      else if (e.translationX < -SWIPE_X || e.velocityX < -FLING_VELOCITY)
        fling("pass");
      else {
        tx.set(withSpring(0));
        ty.set(withSpring(0));
        progress.set(withTiming(0, { duration: 180 }));
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    if (!isTop) {
      const scale = interpolate(
        progress.get(),
        [0, 1],
        [0.94, 1],
        Extrapolation.CLAMP,
      );
      return { transform: [{ scale }] };
    }
    const rotate = interpolate(tx.get(), [-width, width], [-14, 14]);
    return {
      transform: [
        { translateX: tx.get() },
        { translateY: ty.get() },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Stamps fade in and "land" (shrink from 1.4 to 1) as the card moves.
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.get(), [20, SWIPE_X], [0, 1], Extrapolation.CLAMP),
    transform: [
      { rotate: "-18deg" },
      {
        scale: interpolate(
          tx.get(),
          [20, SWIPE_X],
          [1.4, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      tx.get(),
      [-SWIPE_X, -20],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      { rotate: "18deg" },
      {
        scale: interpolate(
          tx.get(),
          [-SWIPE_X, -20],
          [1, 1.4],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      ty.get(),
      [-height * 0.3, -40],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          ty.get(),
          [-height * 0.3, -40],
          [1, 1.4],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const gold = isGold(profile);
  const justJoined = isJustJoined(profile);
  const active = isRecentlyActive(profile);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.card, { backgroundColor: colors.surface }, cardStyle]}
      >
        {!loaded ? <Skeleton style={StyleSheet.absoluteFill} /> : null}
        <Image
          source={{ uri: mainPhotoUri(profile) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={120}
          cachePolicy="memory-disk"
          blurRadius={locked ? 60 : 0}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (__DEV__) console.log(`[deck] photo failed ${profile.id}`);
          }}
        />

        {/* tap anywhere → full-screen photos */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Open ${profile.name}’s photos`}
        />

        {locked ? (
          <View style={[styles.lockWrap, styles.noTouch]}>
            <View
              style={[
                styles.lockCircle,
                { backgroundColor: colors.photoScrimTop },
              ]}
            >
              <Ionicons name="lock-closed" size={30} color={colors.onPhoto} />
            </View>
            <AppText
              variant="bodySmall"
              weight="semibold"
              color={colors.onPhoto}
              align="center"
            >
              {profile.name} shares photos after you match
            </AppText>
          </View>
        ) : null}

        <LinearGradient
          colors={[
            "transparent",
            colors.photoScrimMiddle,
            colors.photoScrimBottom,
          ]}
          locations={[0.5, 0.7, 1]}
          style={[StyleSheet.absoluteFill, styles.noTouch]}
        />

        {/* media count */}
        {!locked && mediaCount > 1 ? (
          <View
            style={[
              styles.countPill,
              styles.noTouch,
              { backgroundColor: colors.photoScrimTop },
            ]}
          >
            <Ionicons name="images-outline" size={14} color={colors.onPhoto} />
            <AppText variant="caption" weight="semibold" color={colors.onPhoto}>
              1/{mediaCount}
            </AppText>
          </View>
        ) : null}

        {/* stamps */}
        <Animated.View
          style={[
            styles.stamp,
            styles.stampLeft,
            { borderColor: colors.stampLike },
            styles.noTouch,
            likeStyle,
          ]}
        >
          <AppText variant="display" color={colors.stampLike}>
            LIKE
          </AppText>
        </Animated.View>
        <Animated.View
          style={[
            styles.stamp,
            styles.stampRight,
            { borderColor: colors.stampNope },
            styles.noTouch,
            nopeStyle,
          ]}
        >
          <AppText variant="display" color={colors.stampNope}>
            NOPE
          </AppText>
        </Animated.View>
        <Animated.View
          style={[
            styles.stamp,
            styles.stampMiddle,
            { borderColor: colors.superLike },
            styles.noTouch,
            superStyle,
          ]}
        >
          <AppText variant="title" color={colors.superLike}>
            SUPER LIKE
          </AppText>
        </Animated.View>

        {/* info */}
        <View style={[styles.info, styles.noTouch]}>
          {gold || justJoined || active ? (
            <View style={styles.badges}>
              {gold ? (
                <View style={[styles.badge, { backgroundColor: colors.gold }]}>
                  <Ionicons name="star" size={12} color={colors.onPhoto} />
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={colors.onPhoto}
                  >
                    Gold
                  </AppText>
                </View>
              ) : null}
              {justJoined ? (
                <View
                  style={[styles.badge, { backgroundColor: colors.primary }]}
                >
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={colors.onPrimary}
                  >
                    Just joined
                  </AppText>
                </View>
              ) : null}
              {active ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.photoScrimTop },
                  ]}
                >
                  <View
                    style={[styles.dot, { backgroundColor: colors.online }]}
                  />
                  <AppText
                    variant="caption"
                    weight="semibold"
                    color={colors.onPhoto}
                  >
                    {activityLabel(profile)}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.nameRow}>
            <AppText
              variant="display"
              color={colors.onPhoto}
              numberOfLines={1}
              style={styles.shrink}
            >
              {profile.name}, {profile.age}
            </AppText>
            {profile.verified ? (
              <Ionicons
                name="checkmark-circle"
                size={26}
                color={colors.verified}
              />
            ) : null}
          </View>
          {profile.profession ? (
            <View style={styles.line}>
              <Ionicons
                name="briefcase-outline"
                size={16}
                color={colors.onPhotoMuted}
              />
              <AppText
                variant="body"
                color={colors.onPhotoMuted}
                numberOfLines={1}
              >
                {profile.profession}
              </AppText>
            </View>
          ) : null}
          <View style={styles.line}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.onPhotoMuted}
            />
            <AppText variant="body" color={colors.onPhotoMuted}>
              {distanceKm(profile.id)} km away
            </AppText>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  noTouch: {
    pointerEvents: "none",
  },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    overflow: "hidden",
  },
  shrink: {
    flexShrink: 1,
  },
  lockWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stamp: {
    position: "absolute",
    borderWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  stampLeft: {
    top: 48,
    left: 24,
  },
  stampRight: {
    top: 48,
    right: 24,
  },
  stampMiddle: {
    top: "40%",
    alignSelf: "center",
  },
  info: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    gap: 4,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
