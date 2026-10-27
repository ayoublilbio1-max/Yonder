import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { mediaOf } from "../profiles/data";
import type { MediaItem, Profile } from "../profiles/types";
import { useTheme } from "../theme/ThemeProvider";

// Full-screen photos + video of one profile: swipe left / right, dots follow, X and Report on top.

type Props = {
  profile: Profile | null; // null = closed
  onClose: () => void;
  onReport: () => void;
};

export function MediaViewer({ profile, onClose, onReport }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const media = useMemo(() => (profile ? mediaOf(profile) : []), [profile]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      setIndex(i);
      if (__DEV__)
        console.log(
          `[viewer] ${profile?.id} media ${i + 1}/${media.length} (${media[i]?.type})`,
        );
    }
  };

  const close = () => {
    setIndex(0);
    onClose();
  };

  return (
    <Modal
      visible={profile !== null}
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={[styles.root, { backgroundColor: colors.viewerBg }]}>
        <FlatList
          data={media}
          keyExtractor={(m) => m.uri}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          renderItem={({ item, index: i }) => (
            <View style={{ width, height }}>
              <MediaPage item={item} active={i === index} />
            </View>
          )}
        />

        <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            style={[styles.circle, { backgroundColor: colors.photoScrimTop }]}
          >
            <Ionicons name="close" size={24} color={colors.onPhoto} />
          </Pressable>
          {profile ? (
            <AppText
              variant="heading"
              color={colors.onPhoto}
              numberOfLines={1}
              style={styles.title}
            >
              {profile.name}, {profile.age}
            </AppText>
          ) : null}
          <Pressable
            onPress={onReport}
            accessibilityRole="button"
            accessibilityLabel="Report"
            hitSlop={10}
            style={[styles.circle, { backgroundColor: colors.photoScrimTop }]}
          >
            <Ionicons name="flag-outline" size={20} color={colors.onPhoto} />
          </Pressable>
        </View>

        {media.length > 1 ? (
          <View style={[styles.dots, { bottom: insets.bottom + 28 }]}>
            {media.map((m, i) => (
              <View
                key={m.uri}
                style={[
                  styles.dot,
                  i === index ? styles.dotActive : null,
                  {
                    backgroundColor:
                      i === index ? colors.onPhoto : colors.onPhotoMuted,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function MediaPage({ item, active }: { item: MediaItem; active: boolean }) {
  if (item.type === "video")
    return <VideoPage uri={item.uri} active={active} />;
  return (
    <Image
      source={{ uri: item.uri }}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      cachePolicy="memory-disk"
    />
  );
}

function VideoPage({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
  },
});
