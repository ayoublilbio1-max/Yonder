import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatTime, useChats } from "../../chat/ChatProvider";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { Skeleton } from "../../components/Skeleton";
import { GoldSheet } from "../../deck/GoldSheet";
import { useSwipe } from "../../deck/SwipeProvider";
import { mainPhotoUri } from "../../profiles/data";
import { isLocked } from "../../profiles/extras";
import type { Profile } from "../../profiles/types";
import { useWallet } from "../../store/WalletProvider";
import { useTheme } from "../../theme/ThemeProvider";

// Chats (like Muzz): a blurred "likes you" circle + "New matches" in a row on top, then the
// conversations (All / Unread / Read), newest first, with the last message and an unread count.

type Row = {
  profile: Profile;
  last: string;
  at: number;
  unread: number;
  mine: boolean;
};
type Filter = "all" | "unread" | "read";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

export default function ChatsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { ready: swipeReady, saved, likedYou } = useSwipe();
  const { wallet } = useWallet();
  const [filter, setFilter] = useState<Filter>("all");
  const [goldOpen, setGoldOpen] = useState(false);
  const { ready, threads, typing, profileFor } = useChats();

  const matchIds = Object.entries(saved.matches)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const fresh: Profile[] = [];
  const rows: Row[] = [];
  matchIds.forEach((id) => {
    const p = profileFor(id);
    if (!p) return;
    const t = threads[id];
    const visible = t?.messages.filter((m) => m.from !== "system") ?? [];
    const lastMsg = t?.messages[t.messages.length - 1];
    if (!visible.length || !lastMsg) {
      fresh.push(p);
      return;
    }
    rows.push({
      profile: p,
      last: typing[id] ? "typing…" : lastMsg.text,
      at: lastMsg.at,
      unread: t?.unread ?? 0,
      mine: lastMsg.from === "me",
    });
  });
  rows.sort((a, b) => b.at - a.at);
  const unreadCount = rows.filter((r) => r.unread > 0).length;
  const shown = rows.filter((r) =>
    filter === "all"
      ? true
      : filter === "unread"
        ? r.unread > 0
        : r.unread === 0,
  );

  const openLikes = () => {
    if (__DEV__)
      console.log(
        `[chat] likes circle · ${likedYou.length} · gold=${wallet.gold}`,
      );
    if (wallet.gold) router.navigate("/likes" as Href);
    else setGoldOpen(true);
  };

  const open = (id: string) => {
    if (__DEV__) console.log(`[chat] open ${id}`);
    router.push(`/chat/${id}` as Href);
  };

  const loading = !ready || !swipeReady;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.bg, paddingTop: insets.top + 12 },
      ]}
    >
      <AppText variant="title" style={styles.title}>
        Chats
      </AppText>

      {loading ? (
        <View style={styles.pad}>
          <View style={styles.freshRow}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={styles.freshSkeleton} />
            ))}
          </View>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} style={styles.rowSkeleton} />
          ))}
        </View>
      ) : matchIds.length === 0 && likedYou.length === 0 ? (
        <Animated.View entering={FadeIn.duration(250)} style={styles.empty}>
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={40}
              color={colors.primary}
            />
          </View>
          <AppText variant="heading" align="center">
            No matches yet
          </AppText>
          <AppText variant="body" muted align="center">
            When you and someone like each other, you can chat here.
          </AppText>
          <AppButton
            label="Start swiping"
            icon="heart"
            onPress={() => router.navigate("/" as Href)}
            style={styles.emptyButton}
          />
        </Animated.View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(r) => r.profile.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              {likedYou.length || fresh.length ? (
                <>
                  <AppText variant="label" muted style={styles.section}>
                    NEW MATCHES
                  </AppText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.freshRow}
                  >
                    {likedYou.length ? (
                      <Pressable
                        onPress={openLikes}
                        accessibilityRole="button"
                        style={styles.fresh}
                      >
                        <View
                          style={[
                            styles.freshRing,
                            { borderColor: colors.gold },
                          ]}
                        >
                          <View
                            style={[
                              styles.likesCircle,
                              { backgroundColor: colors.surface },
                            ]}
                          >
                            <Image
                              source={{ uri: mainPhotoUri(likedYou[0]) }}
                              style={StyleSheet.absoluteFill}
                              contentFit="cover"
                              blurRadius={wallet.gold ? 0 : 40}
                              cachePolicy="memory-disk"
                            />
                            <View
                              style={[StyleSheet.absoluteFill, styles.lock]}
                            >
                              <Ionicons
                                name="heart"
                                size={22}
                                color={colors.onPhoto}
                              />
                            </View>
                          </View>
                        </View>
                        <AppText
                          variant="caption"
                          weight="semibold"
                          color={colors.gold}
                          numberOfLines={1}
                        >
                          {likedYou.length}{" "}
                          {likedYou.length === 1 ? "like" : "likes"}
                        </AppText>
                      </Pressable>
                    ) : null}
                    {fresh.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => open(p.id)}
                        accessibilityRole="button"
                        style={styles.fresh}
                      >
                        <View
                          style={[
                            styles.freshRing,
                            { borderColor: colors.primary },
                          ]}
                        >
                          <Avatar profile={p} size={64} />
                        </View>
                        <AppText
                          variant="caption"
                          weight="medium"
                          numberOfLines={1}
                        >
                          {p.name}
                        </AppText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null}

              <AppText variant="label" muted style={styles.section}>
                MESSAGES
              </AppText>
              <View style={styles.chips}>
                {FILTERS.map((f) => {
                  const on = filter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: on ? colors.primary : colors.surface,
                          borderColor: on ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="semibold"
                        color={on ? colors.onPrimary : colors.text}
                      >
                        {f.label}
                        {f.key === "unread" && unreadCount
                          ? ` (${unreadCount})`
                          : ""}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <AppText
              variant="bodySmall"
              muted
              align="center"
              style={styles.noMessages}
            >
              {rows.length === 0
                ? "Say hi to your new matches 👋"
                : filter === "unread"
                  ? "No unread messages"
                  : "No read chats yet"}
            </AppText>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item.profile.id)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.surface : "transparent" },
              ]}
            >
              <Avatar profile={item.profile} size={56} />
              <View style={styles.rowText}>
                <View style={styles.rowTop}>
                  <AppText
                    variant="body"
                    weight={item.unread ? "bold" : "semibold"}
                    numberOfLines={1}
                    style={styles.flex}
                  >
                    {item.profile.name}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={item.unread ? colors.primary : colors.textSubtle}
                  >
                    {chatTime(item.at)}
                  </AppText>
                </View>
                <View style={styles.rowTop}>
                  <AppText
                    variant="bodySmall"
                    numberOfLines={1}
                    color={item.unread ? colors.text : colors.textMuted}
                    weight={item.unread ? "medium" : "regular"}
                    style={styles.flex}
                  >
                    {item.mine ? `You: ${item.last}` : item.last}
                  </AppText>
                  {item.unread ? (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight="bold"
                        color={colors.onPrimary}
                      >
                        {item.unread}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      <GoldSheet
        visible={goldOpen}
        variant="likes"
        likers={likedYou}
        onClose={() => setGoldOpen(false)}
      />
    </View>
  );
}

function Avatar({ profile, size }: { profile: Profile; size: number }) {
  const colors = useTheme();
  const locked = isLocked(profile);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: colors.surface,
      }}
    >
      <Image
        source={{ uri: mainPhotoUri(profile) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        blurRadius={locked ? 30 : 0}
        transition={150}
      />
      {locked ? (
        <View style={[StyleSheet.absoluteFill, styles.lock]}>
          <Ionicons
            name="lock-closed"
            size={size * 0.3}
            color={colors.onPhoto}
          />
        </View>
      ) : null}
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
  title: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  pad: {
    paddingHorizontal: 20,
    gap: 14,
  },
  list: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  freshRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 20,
  },
  fresh: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  freshRing: {
    padding: 2,
    borderWidth: 2,
    borderRadius: 40,
  },
  likesCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  freshSkeleton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  rowSkeleton: {
    height: 64,
    borderRadius: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  lock: {
    alignItems: "center",
    justifyContent: "center",
  },
  noMessages: {
    marginTop: 24,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyButton: {
    alignSelf: "stretch",
    marginTop: 14,
  },
});
