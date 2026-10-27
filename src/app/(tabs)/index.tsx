import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentRef,
} from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmModal } from "../../components/ConfirmModal";
import { NotInDemoModal } from "../../components/NotInDemoModal";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { actionGradients } from "../../constants/colors";
import { ComplimentSheet } from "../../deck/ComplimentSheet";
import { EmptyDeck } from "../../deck/EmptyDeck";
import { MediaViewer } from "../../deck/MediaViewer";
import { ProfileSections } from "../../deck/ProfileSections";
import { ReportSheet } from "../../deck/ReportSheet";
import { SwipeCard, type FlingFn } from "../../deck/SwipeCard";
import { useSwipe, type SwipeAction } from "../../deck/SwipeProvider";
import { mainPhotoUri } from "../../profiles/data";
import { isLocked } from "../../profiles/extras";
import type { Profile } from "../../profiles/types";
import { useTheme } from "../../theme/ThemeProvider";

type IconName = ComponentProps<typeof Ionicons>["name"];
type Gradient = readonly [string, string];

const BAR_HEIGHT = 96; // fixed swipe buttons above the tab bar (incl. fade)

// Swipe (home), Muzz style: top bar · card · the whole profile below in one scroll,
// with the swipe buttons fixed above the tab bar (they never scroll away).
export default function SwipeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const toast = useToast();
  const {
    ready,
    deck,
    swipe,
    rewindLast,
    canRewind,
    me,
    saved,
    toggleFavorite,
    block,
    saveCompliment,
  } = useSwipe();
  const progress = useSharedValue(0);
  const flingRef = useRef<FlingFn | null>(null);
  const busyRef = useRef(false); // a card is flying out: ignore more taps until it's gone
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [notInDemo, setNotInDemo] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [reporting, setReporting] = useState<Profile | null>(null);
  const [blocking, setBlocking] = useState<Profile | null>(null);
  const [complimenting, setComplimenting] = useState<Profile | null>(null);

  const top = deck[0];
  const next = deck[1];
  const cardHeight = Math.round(height * 0.6);

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

  // New top profile → back to the top of the page.
  const topId = top?.id;
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    busyRef.current = false;
  }, [topId]);

  const onSwiped = (action: SwipeAction) => {
    busyRef.current = false;
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
    if (busyRef.current) {
      if (__DEV__)
        console.log(`[deck] ${action} tap ignored (card still moving)`);
      return;
    }
    busyRef.current = true;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    if (flingRef.current) flingRef.current(action);
    else onSwiped(action);
  };

  const rewind = () => {
    if (busyRef.current) return;
    const back = rewindLast();
    if (back)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const openMedia = () => {
    if (!top) return;
    if (isLocked(top)) {
      toast.show(`${top.name}’s photos unlock after you match`);
      if (__DEV__) console.log(`[deck] locked tap ${top.id}`);
      return;
    }
    if (__DEV__) console.log(`[viewer] open ${top.id}`);
    setViewing(top);
  };

  const share = async () => {
    if (!top) return;
    try {
      const res = await Share.share({
        message: `Check out ${top.name}, ${top.age} on Yonder (demo profile).`,
      });
      if (__DEV__) console.log(`[deck] share ${top.id} → ${res.action}`);
    } catch (e) {
      if (__DEV__) console.log("[deck] share failed", String(e));
    }
  };

  const favorite = () => {
    if (!top) return;
    const on = toggleFavorite(top.id);
    toast.show(
      on
        ? `${top.name} added to your favorites`
        : `${top.name} removed from favorites`,
    );
  };

  const hide = (p: Profile, reason: string, message: string) => {
    block(p.id, reason);
    toast.show(message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
  };

  const topBar = (
    <View
      style={[
        styles.topBar,
        { paddingTop: insets.top + 6, backgroundColor: colors.bg },
      ]}
    >
      <TopButton
        icon="options-outline"
        label="Filters"
        onPress={() => setNotInDemo("Filters")}
      />
      <TopButton
        icon="swap-vertical"
        label="Sort"
        onPress={() => setNotInDemo("Sort")}
      />
      <View style={styles.flex} />
      <TopButton
        icon="flash"
        label="Boost"
        color={colors.boost}
        onPress={() => setNotInDemo("Boost")}
      />
      <TopButton
        icon="notifications-outline"
        label="Notifications"
        onPress={() => setNotInDemo("Notifications")}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {topBar}

      {!ready ? (
        <View style={styles.pad}>
          <Skeleton style={[styles.skeletonCard, { height: cardHeight }]} />
          <Skeleton style={styles.skeletonRow} />
          <Skeleton style={styles.skeletonBlock} />
        </View>
      ) : !top ? (
        <View style={[styles.flex, styles.pad]}>
          <EmptyDeck />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={[styles.cardBox, { height: cardHeight }]}>
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
              onOpen={openMedia}
              registerFling={(fn) => {
                flingRef.current = fn;
              }}
            />
          </View>

          <ProfileSections
            key={top.id}
            profile={top}
            me={me}
            isFavorite={saved.favorites.includes(top.id)}
            onFavorite={favorite}
            onBlock={() => setBlocking(top)}
            onReport={() => setReporting(top)}
            onShare={share}
          />
        </ScrollView>
      )}

      {ready && top ? (
        <View style={styles.bar}>
          <LinearGradient
            colors={[colors.bgFade, colors.bg]}
            locations={[0, 0.45]}
            style={[StyleSheet.absoluteFill, styles.noTouch]}
          />
          <View style={styles.actions}>
            <ActionButton
              icon="refresh"
              gradient={actionGradients.rewind}
              size={50}
              label="Rewind"
              onPress={rewind}
              disabled={!canRewind}
            />
            <ActionButton
              icon="close"
              gradient={actionGradients.pass}
              size={64}
              label="Pass"
              onPress={() => press("pass")}
            />
            <ActionButton
              icon="star"
              gradient={actionGradients.superLike}
              size={50}
              label="Super like"
              onPress={() => press("superlike")}
            />
            <ActionButton
              icon="heart"
              gradient={actionGradients.like}
              size={64}
              label="Like"
              onPress={() => press("like")}
            />
            <ActionButton
              icon="chatbubble-ellipses"
              gradient={actionGradients.compliment}
              size={50}
              label="Send compliment"
              onPress={() => setComplimenting(top)}
            />
          </View>
        </View>
      ) : null}

      <MediaViewer
        profile={viewing}
        onClose={() => setViewing(null)}
        onReport={() => {
          const p = viewing;
          setViewing(null);
          setReporting(p);
        }}
      />

      <ReportSheet
        profile={reporting}
        onClose={() => setReporting(null)}
        onReport={(reason) => {
          const p = reporting;
          setReporting(null);
          if (p)
            hide(
              p,
              `report: ${reason}`,
              `Thanks. ${p.name} was reported and hidden.`,
            );
        }}
      />

      <ConfirmModal
        visible={blocking !== null}
        icon="ban-outline"
        title={`Block ${blocking?.name ?? ""}?`}
        message="You won’t see each other on Yonder again. They won’t be told."
        confirmLabel="Block"
        onCancel={() => setBlocking(null)}
        onConfirm={() => {
          const p = blocking;
          setBlocking(null);
          if (p) hide(p, "block", `${p.name} is blocked`);
        }}
      />

      <ComplimentSheet
        profile={complimenting}
        onClose={() => setComplimenting(null)}
        onSent={(text) => {
          const p = complimenting;
          setComplimenting(null);
          if (!p) return;
          saveCompliment(p.id, text);
          toast.show(`Compliment sent to ${p.name}`);
          // A compliment is also a like: the card leaves the deck.
          if (top && top.id === p.id) press("like");
          else swipe(p.id, "like");
        }}
      />

      <NotInDemoModal
        visible={notInDemo !== null}
        feature={notInDemo ?? ""}
        onClose={() => setNotInDemo(null)}
      />
    </View>
  );
}

function TopButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.topButton,
        { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={21} color={color ?? colors.text} />
    </Pressable>
  );
}

function ActionButton({
  icon,
  gradient,
  size,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  gradient: Gradient;
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
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.action,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: gradient[1], // Android needs a background to draw the shadow
          shadowColor: gradient[1],
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.88 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.actionFill, { borderRadius: size / 2 }]}
      >
        <Ionicons name={icon} size={size * 0.5} color={colors.onPhoto} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 12,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  topButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingBottom: BAR_HEIGHT + 8, // the last section stays above the fixed buttons
  },
  cardBox: {
    marginHorizontal: 12,
  },
  skeletonCard: {
    borderRadius: 22,
  },
  skeletonRow: {
    height: 60,
    borderRadius: 30,
  },
  skeletonBlock: {
    height: 120,
    borderRadius: 18,
  },
  noTouch: {
    pointerEvents: "none",
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    justifyContent: "flex-end",
    pointerEvents: "box-none", // taps between the buttons reach the page
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 8,
    paddingBottom: 12,
    pointerEvents: "box-none",
  },
  action: {
    elevation: 6,
  },
  actionFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
