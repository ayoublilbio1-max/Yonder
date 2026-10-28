import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatTime, useChats, type ChatMessage } from "../../chat/ChatProvider";
import { AppText } from "../../components/AppText";
import { useToast } from "../../components/Toast";
import { fonts } from "../../constants/fonts";
import { MediaViewer } from "../../deck/MediaViewer";
import { mainPhotoUri } from "../../profiles/data";
import { isLocked } from "../../profiles/extras";
import type { Profile } from "../../profiles/types";
import { useTheme } from "../../theme/ThemeProvider";

// One chat with a match. Newest messages at the bottom, typing dots while they "write",
// "Request photos" for locked profiles (rule 9.3). The keyboard pushes the input up.

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const MAX = 500;

export default function ChatScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { threads, typing, profileFor, send, requestPhotos, setActive } =
    useChats();
  const [text, setText] = useState("");
  const [viewing, setViewing] = useState<Profile | null>(null);

  const profile = id ? profileFor(id) : null;
  const thread = id ? threads[id] : undefined;
  const messages = thread?.messages ?? [];
  const locked = profile ? isLocked(profile) : false;
  const isTyping = id ? Boolean(typing[id]) : false;

  // This chat is on screen: its new messages are read.
  useEffect(() => {
    if (!id) return;
    setActive(id);
    if (__DEV__) console.log(`[chat] screen ${id}`);
    return () => setActive(null);
  }, [id, setActive]);

  if (!profile || !id) {
    return (
      <View
        style={[styles.screen, styles.center, { backgroundColor: colors.bg }]}
      >
        <AppText variant="body" muted>
          This chat isn’t available.
        </AppText>
      </View>
    );
  }

  const him = profile.gender === "male";
  const onSend = () => {
    if (!text.trim()) return;
    send(id, text);
    setText("");
  };

  const openPhotos = () => {
    if (locked) {
      toast.show(
        `${profile.name} hasn’t shared ${him ? "his" : "her"} photos yet`,
      );
      return;
    }
    setViewing(profile);
  };

  // FlatList is inverted (newest at the bottom, starts scrolled down).
  const data = [...messages].reverse();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            borderBottomColor: colors.border,
            backgroundColor: colors.bg,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={openPhotos}
          accessibilityRole="button"
          style={styles.headerWho}
        >
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            <Image
              source={{ uri: mainPhotoUri(profile) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              blurRadius={locked ? 30 : 0}
              transition={200}
            />
          </View>
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              <AppText variant="body" weight="semibold" numberOfLines={1}>
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
            <AppText
              variant="caption"
              color={isTyping ? colors.primary : colors.textMuted}
            >
              {isTyping ? "typing…" : profile.city}
            </AppText>
          </View>
        </Pressable>
      </View>

      {locked ? (
        <View
          style={[
            styles.lockBar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
          <AppText variant="caption" muted style={styles.flex}>
            {profile.name}’s photos are private. They’re shared as you get to
            know each other.
          </AppText>
          <Pressable
            onPress={() => requestPhotos(id)}
            disabled={thread?.requested}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.requestBtn,
              {
                backgroundColor: colors.primary,
                opacity: thread?.requested ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <AppText variant="caption" weight="bold" color={colors.onPrimary}>
              {thread?.requested ? "Requested" : "Request photos"}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <FlatList
          data={data}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          ListHeaderComponent={isTyping ? <TypingBubble /> : null}
          ListFooterComponent={
            <View style={styles.matchNote}>
              <AppText variant="caption" muted align="center">
                You matched with {profile.name}. Say hi 👋
              </AppText>
            </View>
          }
          renderItem={({ item, index }) => (
            <Bubble msg={item} newer={data[index - 1]} />
          )}
        />

        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.bg,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}
        >
          <View
            style={[
              styles.inputBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX))}
              placeholder="Type a message…"
              placeholderTextColor={colors.textSubtle}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              multiline
              style={[
                styles.input,
                { color: colors.text, fontFamily: fonts.regular },
              ]}
            />
          </View>
          <SendButton enabled={text.trim().length > 0} onPress={onSend} />
        </View>
      </KeyboardAvoidingView>

      <MediaViewer
        profile={viewing}
        onClose={() => setViewing(null)}
        onReport={() => {
          setViewing(null);
          toast.show("Reporting from a chat comes with the profile page");
        }}
      />
    </View>
  );
}

function Bubble({ msg, newer }: { msg: ChatMessage; newer?: ChatMessage }) {
  const colors = useTheme();
  if (msg.from === "system") {
    return (
      <Animated.View entering={FadeIn.duration(250)} style={styles.system}>
        <AppText variant="caption" weight="medium" muted align="center">
          {msg.text}
        </AppText>
      </Animated.View>
    );
  }
  const mine = msg.from === "me";
  // show the time under the last bubble of a group (same sender, within 5 minutes)
  const lastOfGroup =
    !newer || newer.from !== msg.from || newer.at - msg.at > 5 * 60_000;
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.bubbleWrap, mine ? styles.right : styles.left]}
    >
      <View
        style={[
          styles.bubble,
          mine
            ? {
                backgroundColor: colors.primary,
                borderBottomRightRadius: lastOfGroup ? 6 : 20,
              }
            : {
                backgroundColor: colors.surface,
                borderBottomLeftRadius: lastOfGroup ? 6 : 20,
              },
        ]}
      >
        <AppText variant="body" color={mine ? colors.onPrimary : colors.text}>
          {msg.text}
        </AppText>
      </View>
      {lastOfGroup ? (
        <AppText
          variant="caption"
          color={colors.textSubtle}
          style={styles.time}
        >
          {chatTime(msg.at)}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

// Three dots that rise and fall softly, one after the other.
function TypingBubble() {
  const colors = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.bubbleWrap, styles.left]}
    >
      <View
        style={[
          styles.bubble,
          styles.typing,
          { backgroundColor: colors.surface },
        ]}
      >
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 160} />
        ))}
      </View>
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const colors = useTheme();
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 320, easing: EASE }),
            withTiming(0, { duration: 320, easing: EASE }),
          ),
          -1,
        ),
      ),
    );
  }, [v, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + v.get() * 0.65,
    transform: [{ translateY: -3 * v.get() }],
  }));
  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: colors.textMuted }, style]}
    />
  );
}

// Grows softly when there is something to send.
function SendButton({
  enabled,
  onPress,
}: {
  enabled: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  const on = useSharedValue(enabled ? 1 : 0);
  useEffect(() => {
    on.set(withTiming(enabled ? 1 : 0, { duration: 180, easing: EASE }));
  }, [enabled, on]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + on.get() * 0.6,
    transform: [{ scale: 0.9 + on.get() * 0.1 }],
  }));
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel="Send"
    >
      <Animated.View
        style={[styles.send, { backgroundColor: colors.primary }, style]}
      >
        <Ionicons name="send" size={20} color={colors.onPrimary} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerWho: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  requestBtn: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  messages: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  matchNote: {
    paddingVertical: 16,
  },
  system: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: "85%",
  },
  bubbleWrap: {
    maxWidth: "80%",
    marginVertical: 1,
  },
  left: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  right: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  time: {
    marginTop: 3,
    marginHorizontal: 6,
    marginBottom: 6,
  },
  typing: {
    flexDirection: "row",
    gap: 5,
    paddingVertical: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingVertical: 10,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
