import { useRouter, type Href } from "expo-router";
import { useEffect, type ComponentType, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChats } from "../chat/ChatProvider";
import { useSwipe } from "../deck/SwipeProvider";
import { tr } from "../i18n/i18n";
import { DURATION, EASE, EASE_IN_OUT, EASE_OUT } from "../motion/ease";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";
import { PressableScale } from "./PressableScale";
import {
  ChatsIcon,
  ExploreIcon,
  LikesIcon,
  ProfileIcon,
  SwipeIcon,
  type TabIconProps,
} from "./TabIcons";

// Every screen file in src/app/(tabs) MUST have an entry here.
// Key = the route name (file name without .tsx). href = where the tab goes.
export const TAB_CONFIG: Record<
  string,
  { label: string; href: Href; Icon: ComponentType<TabIconProps> }
> = {
  index: { label: "Swipe", href: "/", Icon: SwipeIcon },
  explore: { label: "Explore", href: "/explore", Icon: ExploreIcon },
  likes: { label: "Likes", href: "/likes", Icon: LikesIcon },
  chats: { label: "Chats", href: "/chats", Icon: ChatsIcon },
  profile: { label: "Profile", href: "/profile", Icon: ProfileIcon },
};

type TabRoute = { key: string; name: string; params?: object };

// Only `state` is required. On SDK 58 expo-router may not pass `navigation`
// to a custom tab bar, so we navigate with the router instead.
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation?: {
    emit?: (event: {
      type: string;
      target?: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented?: boolean };
    navigate?: (name: string, params?: object) => void;
  };
};

export function TabBar(props: TabBarProps) {
  const { state, navigation } = props;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Badges: unread messages on Chats, likes not seen yet on Likes (seen once the Likes tab is open).
  const { threads } = useChats();
  const { newLikes, markLikesSeen } = useSwipe();
  const unread = Object.values(threads).reduce(
    (sum, t) => sum + (t.unread ?? 0),
    0,
  );
  const badges: Record<string, number> = { chats: unread, likes: newLikes };
  const likesOpen = state.routes[state.index]?.name === "likes";
  useEffect(() => {
    if (likesOpen && newLikes > 0) markLikesSeen();
  }, [likesOpen, newLikes, markLikesSeen]);

  const propKeys = Object.keys(props).join(", ");
  const emitType = typeof navigation?.emit;
  useEffect(() => {
    if (__DEV__)
      console.log(
        `[tabs] tab bar props: ${propKeys} · navigation.emit=${emitType}`,
      );
  }, [propKeys, emitType]);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) {
          if (__DEV__)
            console.log(
              `[tabs] skipped "${route.name}" — add it to TAB_CONFIG in TabBar.tsx`,
            );
          return null;
        }

        const focused = state.index === index;
        const color = focused ? colors.tabActive : colors.tabInactive;
        const { Icon, label } = config;
        const count = badges[route.name] ?? 0;

        const onPress = () => {
          // Let screens listen to tabPress (e.g. scroll to top) when navigation is available.
          const event = navigation?.emit?.({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (focused || event?.defaultPrevented) return;

          if (navigation?.navigate) {
            navigation.navigate(route.name, route.params);
          } else {
            router.navigate(config.href);
          }
          if (__DEV__) console.log(`[tabs] → ${route.name}`);
        };

        const onLongPress = () => {
          navigation?.emit?.({ type: "tabLongPress", target: route.key });
        };

        return (
          <PressableScale
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={count ? `${tr(label)}, ${count}` : tr(label)}
            scaleTo={0.92}
            style={styles.item}
          >
            <TabIcon focused={focused}>
              <Icon focused={focused} color={color} cutColor={colors.tabBar} />
              {count > 0 ? <Badge count={count} /> : null}
            </TabIcon>
            <AppText
              variant="caption"
              weight={focused ? "semibold" : "medium"}
              color={color}
            >
              {tr(label)}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

// Small number at the top right of a tab icon (99+ above 99). It fades in and out, no bounce.
function Badge({ count }: { count: number }) {
  const colors = useTheme();
  return (
    <Animated.View
      entering={ZoomIn.duration(DURATION.quick).easing(EASE_OUT)}
      exiting={FadeOut.duration(DURATION.press).easing(EASE_IN_OUT)}
      pointerEvents="none"
      style={[
        styles.badge,
        { backgroundColor: colors.primary, borderColor: colors.tabBar },
      ]}
    >
      <AppText
        variant="caption"
        weight="bold"
        color={colors.onPrimary}
        style={styles.badgeText}
      >
        {count > 99 ? "99+" : count}
      </AppText>
    </Animated.View>
  );
}

// The selected tab's icon grows a little with a CSS-like ease (no jump).
function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: ReactNode;
}) {
  const on = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    on.set(
      withTiming(focused ? 1 : 0, {
        duration: DURATION.quick + 40,
        easing: EASE,
      }),
    );
  }, [focused, on]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + on.get() * 0.08 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  badge: {
    position: "absolute",
    top: -6,
    left: 15,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 52,
  },
});
