import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { Skeleton } from "../components/Skeleton";
import { mainPhotoUri, mediaOf } from "../profiles/data";
import { isLocked } from "../profiles/extras";
import { profileKm } from "../profiles/session";
import type { Profile } from "../profiles/types";
import { useTheme } from "../theme/ThemeProvider";

// The same profile card as on the Swipe page, without swiping (used on a match's profile page).
// Tap → full-screen photos.

type Props = {
  profile: Profile;
  height: number;
  onOpen: () => void;
};

export function ProfileCard({ profile, height, onOpen }: Props) {
  const colors = useTheme();
  const [loaded, setLoaded] = useState(false);
  const locked = isLocked(profile);
  const count = mediaOf(profile).length;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${profile.name}’s photos`}
      style={[styles.card, { height, backgroundColor: colors.surface }]}
    >
      {!loaded ? <Skeleton style={StyleSheet.absoluteFill} /> : null}
      <Image
        source={{ uri: mainPhotoUri(profile) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
        blurRadius={locked ? 60 : 0}
        onLoad={() => setLoaded(true)}
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
            {profile.name} hasn’t shared{" "}
            {profile.gender === "male" ? "his" : "her"} photos yet
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
      {!locked && count > 1 ? (
        <View
          style={[
            styles.countPill,
            styles.noTouch,
            { backgroundColor: colors.photoScrimTop },
          ]}
        >
          <Ionicons name="images-outline" size={14} color={colors.onPhoto} />
          <AppText variant="caption" weight="semibold" color={colors.onPhoto}>
            1/{count}
          </AppText>
        </View>
      ) : null}
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
            {profileKm(profile)} km away
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  noTouch: {
    pointerEvents: "none",
  },
  card: {
    marginHorizontal: 12,
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
});
