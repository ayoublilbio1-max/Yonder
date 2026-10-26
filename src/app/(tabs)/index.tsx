import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { NotInDemoModal } from "../../components/NotInDemoModal";
import { Skeleton } from "../../components/Skeleton";
import { EmptyDeck } from "../../deck/EmptyDeck";
import { SwipeCard, type FlingFn } from "../../deck/SwipeCard";
import { useSwipe, type SwipeAction } from "../../deck/SwipeProvider";
import { mainPhotoUri } from "../../profiles/data";
import { useTheme } from "../../theme/ThemeProvider";

type IconName = ComponentProps<typeof Ionicons>["name"];

// Swipe (home): the deck + action buttons.
export default function SwipeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { ready, deck, swipe, rewindLast, canRewind } = useSwipe();
  const progress = useSharedValue(0);
  const flingRef = useRef<FlingFn | null>(null);
  const [notInDemo, setNotInDemo] = useState<string | null>(null);

  const top = deck[0];
  const next = deck[1];

  // Load the next profiles' main photos in advance so they appear instantly.
  const upcoming = deck
    .slice(1, 5)
    .map((p) => mainPhotoUri(p))
    .join("|");
  useEffect(() => {
    if (!upcoming) return;
    const urls = upcoming.split("|");
    Image.prefetch(urls).catch(() => {});
    if (__DEV__) console.log(`[deck] prefetch ${urls.length} photos`);
  }, [upcoming]);

  const onSwiped = (action: SwipeAction) => {
    if (!top) return;
    progress.set(0);
    if (action === "superlike")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    swipe(top.id, action);
  };

  const press = (action: SwipeAction) => {
    if (!top) return;
    if (flingRef.current) flingRef.current(action);
    else onSwiped(action);
  };

  const rewind = () => {
    const back = rewindLast();
    if (back)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.bg, paddingTop: insets.top + 6 },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="title" weight="bold" color={colors.primary}>
          Yonder
        </AppText>
        <Pressable
          onPress={() => setNotInDemo("Filters")}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          hitSlop={10}
          style={[styles.headerButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.deck}>
        {!ready ? (
          <Skeleton style={styles.skeletonCard} />
        ) : !top ? (
          <EmptyDeck />
        ) : (
          <>
            {next ? (
              <SwipeCard
                key={next.id}
                profile={next}
                isTop={false}
                progress={progress}
                onSwiped={onSwiped}
              />
            ) : null}
            <SwipeCard
              key={top.id}
              profile={top}
              isTop
              progress={progress}
              onSwiped={onSwiped}
              registerFling={(fn) => {
                flingRef.current = fn;
              }}
            />
          </>
        )}
      </View>

      {ready && top ? (
        <View style={styles.actions}>
          <ActionButton
            icon="refresh"
            color={colors.rewind}
            size={48}
            label="Rewind"
            onPress={rewind}
            disabled={!canRewind}
          />
          <ActionButton
            icon="close"
            color={colors.stampNope}
            size={62}
            label="Pass"
            onPress={() => press("pass")}
          />
          <ActionButton
            icon="star"
            color={colors.superLike}
            size={48}
            label="Super like"
            onPress={() => press("superlike")}
          />
          <ActionButton
            icon="heart"
            color={colors.primary}
            size={62}
            label="Like"
            onPress={() => press("like")}
          />
          <ActionButton
            icon="flash"
            color={colors.boost}
            size={48}
            label="Boost"
            onPress={() => setNotInDemo("Boost")}
          />
        </View>
      ) : null}

      <NotInDemoModal
        visible={notInDemo !== null}
        feature={notInDemo ?? ""}
        onClose={() => setNotInDemo(null)}
      />
    </View>
  );
}

function ActionButton({
  icon,
  color,
  size,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  color: string;
  size: number;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.action,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.35 : 1,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deck: {
    flex: 1,
    marginHorizontal: 12,
  },
  skeletonCard: {
    flex: 1,
    borderRadius: 22,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 12,
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
  },
});
