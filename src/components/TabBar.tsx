import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import { useEffect, type ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";
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

        const onPress = () => {
          // Let screens listen to tabPress (e.g. scroll to top) when navigation is available.
          const event = navigation?.emit?.({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (focused || event?.defaultPrevented) return;

          Haptics.selectionAsync().catch(() => {});
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
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.item}
          >
            <Icon focused={focused} color={color} cutColor={colors.tabBar} />
            <AppText
              variant="caption"
              weight={focused ? "semibold" : "medium"}
              color={color}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 52,
  },
});
