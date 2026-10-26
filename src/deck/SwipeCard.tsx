import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppText } from "../components/AppText";
import { Skeleton } from "../components/Skeleton";
import { INTENT_ICON, INTENT_LABEL, mediaOf } from "../profiles/data";
import { distanceKm } from "../profiles/session";
import type { Profile } from "../profiles/types";
import { useTheme } from "../theme/ThemeProvider";
import type { SwipeAction } from "./SwipeProvider";

export type FlingFn = (action: SwipeAction) => void;

type Props = {
  profile: Profile;
  isTop: boolean;
  progress: SharedValue<number>; // 0..1 how far the top card has moved (grows the card under it)
  onSwiped: (action: SwipeAction) => void;
  registerFling?: (fn: FlingFn | null) => void; // lets the buttons swipe the top card
};

const SWIPE_X = 110; // px past which a drag counts as a swipe
const SWIPE_UP = 140;
const FLING_VELOCITY = 900;
const DURATION = 240;

export function SwipeCard({
  profile,
  isTop,
  progress,
  onSwiped,
  registerFling,
}: Props) {
  const colors = useTheme();
  const { width, height } = useWindowDimensions();
  const media = useMemo(() => mediaOf(profile), [profile]);
  const [index, setIndex] = useState(0);
  const [loadedUri, setLoadedUri] = useState<string | null>(null);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const fling = (action: SwipeAction) => {
    "worklet";
    const toX =
      action === "like" ? width * 1.6 : action === "pass" ? -width * 1.6 : 0;
    const toY = action === "superlike" ? -height * 1.3 : ty.get();
    progress.set(withTiming(1, { duration: DURATION }));
    tx.set(withTiming(toX, { duration: DURATION }));
    ty.set(
      withTiming(toY, { duration: DURATION }, (finished) => {
        if (finished) scheduleOnRN(onSwiped, action);
      }),
    );
  };

  // Let the action buttons swipe this card while it's on top.
  useEffect(() => {
    if (!isTop || !registerFling) return;
    registerFling(fling);
    return () => registerFling(null);
  });

  const pan = usePanGesture({
    enabled: isTop,
    activeOffsetX: [-12, 12],
    activeOffsetY: [-12, 12],
    onUpdate: (e) => {
      "worklet";
      tx.set(e.translationX);
      ty.set(e.translationY);
      progress.set(
        Math.min(
          1,
          Math.max(Math.abs(e.translationX), -e.translationY) / (width * 0.5),
        ),
      );
    },
    onDeactivate: (e) => {
      "worklet";
      if (e.translationX > SWIPE_X || e.velocityX > FLING_VELOCITY)
        fling("like");
      else if (e.translationX < -SWIPE_X || e.velocityX < -FLING_VELOCITY)
        fling("pass");
      else if (e.translationY < -SWIPE_UP) fling("superlike");
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
  }, [isTop, width]);

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.get(), [20, SWIPE_X], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      tx.get(),
      [-SWIPE_X, -20],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      ty.get(),
      [-SWIPE_UP, -30],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const current = media[Math.min(index, media.length - 1)];
  const go = (dir: 1 | -1) =>
    setIndex((i) => Math.max(0, Math.min(media.length - 1, i + dir)));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.card, { backgroundColor: colors.surface }, cardStyle]}
      >
        {/* media */}
        {loadedUri !== current.uri && current.type === "photo" ? (
          <Skeleton style={StyleSheet.absoluteFill} />
        ) : null}
        {current.type === "photo" ? (
          <Image
            source={{ uri: current.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
            blurRadius={profile.blurred ? 60 : 0}
            onLoad={() => setLoadedUri(current.uri)}
            onError={() => {
              if (__DEV__)
                console.log(
                  `[deck] photo failed ${profile.id} ${current.uri.split("/").pop()}`,
                );
            }}
          />
        ) : (
          <CardVideo uri={current.uri} active={isTop} />
        )}

        {/* blurred profile: lock (rule 9.3) */}
        {profile.blurred ? (
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
          locations={[0.45, 0.65, 1]}
          style={[StyleSheet.absoluteFill, styles.noTouch]}
        />

        {/* progress segments */}
        {media.length > 1 ? (
          <View style={[styles.segments, styles.noTouch]}>
            {media.map((m, i) => (
              <View
                key={m.uri}
                style={[
                  styles.segment,
                  {
                    backgroundColor:
                      i === index ? colors.onPhoto : colors.photoScrimTop,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}

        {/* tap left / right to change photo */}
        <View style={styles.tapZones}>
          <Pressable
            style={styles.flex}
            onPress={() => go(-1)}
            accessibilityLabel="Previous photo"
          />
          <Pressable
            style={styles.flex}
            onPress={() => go(1)}
            accessibilityLabel="Next photo"
          />
        </View>

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
            styles.stampBottom,
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
          <View
            style={[styles.chip, { backgroundColor: colors.photoScrimTop }]}
          >
            <Ionicons
              name={INTENT_ICON[profile.intent]}
              size={14}
              color={colors.onPhoto}
            />
            <AppText variant="caption" weight="semibold" color={colors.onPhoto}>
              {INTENT_LABEL[profile.intent]}
            </AppText>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// Muted looping video, only playing while the card is on top.
function CardVideo({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
    if (__DEV__)
      console.log(
        `[deck] video ${active ? "play" : "pause"} ${uri.split("/").slice(-2).join("/")}`,
      );
  }, [active, player, uri]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
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
  flex: {
    flex: 1,
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
  segments: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  tapZones: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 140, // leaves the info area at the bottom free
    flexDirection: "row",
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
    transform: [{ rotate: "-18deg" }],
  },
  stampRight: {
    top: 48,
    right: 24,
    transform: [{ rotate: "18deg" }],
  },
  stampBottom: {
    bottom: 170,
    alignSelf: "center",
  },
  info: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    gap: 4,
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
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 6,
  },
});
