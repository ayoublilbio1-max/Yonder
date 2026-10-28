import Ionicons from "@expo/vector-icons/Ionicons";
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { useTheme } from "../theme/ThemeProvider";
import type { ChatMedia } from "./ChatProvider";
import { formatDuration, keepFile } from "./media";

// Photo / video / voice bubbles in a chat, the full-screen media viewer and the voice recorder.

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const BUBBLE_W = 230;

function sizeOf(media: ChatMedia) {
  const ratio =
    media.width && media.height ? media.height / media.width : 4 / 3;
  return {
    width: BUBBLE_W,
    height: Math.round(BUBBLE_W * Math.min(1.5, Math.max(0.6, ratio))),
  };
}

// ---------- photo ----------
export function PhotoBubble({
  media,
  onOpen,
}: {
  media: ChatMedia;
  onOpen: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="imagebutton"
      accessibilityLabel="Open photo"
    >
      <Image
        source={{ uri: media.uri }}
        style={[
          styles.media,
          sizeOf(media),
          { backgroundColor: colors.surface },
        ]}
        contentFit="cover"
        transition={150}
      />
    </Pressable>
  );
}

// ---------- video (first frame + play icon; tap → full screen) ----------
export function VideoBubble({
  media,
  onOpen,
}: {
  media: ChatMedia;
  onOpen: () => void;
}) {
  const colors = useTheme();
  const player = useVideoPlayer(media.uri, (p) => {
    p.muted = true;
  });
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel="Play video"
    >
      <View
        style={[
          styles.media,
          sizeOf(media),
          { backgroundColor: colors.viewerBg },
        ]}
      >
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={[StyleSheet.absoluteFill, styles.center, styles.noTouch]}>
          <View
            style={[styles.play, { backgroundColor: colors.photoScrimTop }]}
          >
            <Ionicons name="play" size={26} color={colors.onPhoto} />
          </View>
        </View>
        {media.durationMs ? (
          <View
            style={[
              styles.duration,
              styles.noTouch,
              { backgroundColor: colors.photoScrimTop },
            ]}
          >
            <AppText variant="caption" weight="semibold" color={colors.onPhoto}>
              {formatDuration(media.durationMs)}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ---------- voice ----------
export function AudioBubble({
  media,
  mine,
}: {
  media: ChatMedia;
  mine: boolean;
}) {
  const colors = useTheme();
  const player = useAudioPlayer(media.uri);
  const status = useAudioPlayerStatus(player);
  const fg = mine ? colors.onPrimary : colors.text;
  const track = mine ? colors.photoScrimMiddle : colors.border;

  const totalMs = status.duration
    ? status.duration * 1000
    : (media.durationMs ?? 0);
  const progress = status.duration
    ? Math.min(1, status.currentTime / status.duration)
    : 0;

  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0).catch(() => {});
      if (__DEV__) console.log("[media] voice finished");
    }
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <View
      style={[
        styles.audio,
        { backgroundColor: mine ? colors.primary : colors.surface },
      ]}
    >
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? "Pause" : "Play"}
        hitSlop={8}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={26}
          color={fg}
        />
      </Pressable>
      <View style={[styles.audioTrack, { backgroundColor: track }]}>
        <View
          style={[
            styles.audioFill,
            {
              backgroundColor: fg,
              width: `${Math.round(progress * 100)}%` as const,
            },
          ]}
        />
      </View>
      <AppText variant="caption" weight="semibold" color={fg}>
        {formatDuration(
          status.playing || status.currentTime > 0
            ? status.currentTime * 1000
            : totalMs,
        )}
      </AppText>
    </View>
  );
}

// ---------- full screen ----------
export function FullMedia({
  media,
  onClose,
}: {
  media: ChatMedia | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={media !== null}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {media ? <FullMediaContent media={media} onClose={onClose} /> : null}
    </Modal>
  );
}

function FullMediaContent({
  media,
  onClose,
}: {
  media: ChatMedia;
  onClose: () => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.full, { backgroundColor: colors.viewerBg }]}>
      {media.kind === "video" ? (
        <FullVideo uri={media.uri} />
      ) : (
        <Image
          source={{ uri: media.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />
      )}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={10}
        style={[
          styles.close,
          { top: insets.top + 10, backgroundColor: colors.photoScrimTop },
        ]}
      >
        <Ionicons name="close" size={24} color={colors.onPhoto} />
      </Pressable>
    </View>
  );
}

function FullVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls
    />
  );
}

// ---------- recorder (replaces the input while recording) ----------
type RecorderProps = {
  onDone: (media: ChatMedia | null) => void; // null = cancelled / failed
  onError: (message: string) => void;
};

export function VoiceRecorder({ onDone, onError }: RecorderProps) {
  const colors = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 200);
  const [starting, setStarting] = useState(true);
  const blink = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    blink.set(
      withRepeat(
        withSequence(
          withTiming(0.25, { duration: 600, easing: EASE }),
          withTiming(1, { duration: 600, easing: EASE }),
        ),
        -1,
      ),
    );
    (async () => {
      try {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (__DEV__) console.log("[media] microphone permission", perm.status);
        if (!perm.granted) {
          onError("Allow the microphone to send voice messages");
          onDone(null);
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          interruptionMode: "mixWithOthers",
        });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        setStarting(false);
        if (__DEV__) console.log("[media] recording…");
      } catch (e) {
        if (__DEV__) console.log("[media] record failed", String(e));
        onError("Couldn’t start recording");
        onDone(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // run once when the recorder appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = async (keep: boolean) => {
    const duration = state.durationMillis;
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
      });
      const uri = recorder.uri;
      if (!keep || !uri || duration < 800) {
        if (uri) {
          try {
            new File(uri).delete();
          } catch {
            // already gone
          }
        }
        if (__DEV__)
          console.log(
            `[media] voice ${keep ? "too short" : "cancelled"} (${duration}ms)`,
          );
        if (keep) onError("Hold on a bit longer to record a voice message");
        onDone(null);
        return;
      }
      const saved = keepFile(uri, "voice", uri.split(".").pop() || "m4a");
      if (__DEV__)
        console.log(`[media] voice ${Math.round(duration / 1000)}s saved`);
      onDone({ kind: "audio", uri: saved, durationMs: duration });
    } catch (e) {
      if (__DEV__) console.log("[media] stop failed", String(e));
      onError("Couldn’t save the voice message");
      onDone(null);
    }
  };

  const dotStyle = useAnimatedStyle(() => ({ opacity: blink.get() }));

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.recorder}>
      <Pressable
        onPress={() => finish(false)}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        hitSlop={8}
        style={styles.recBtn}
      >
        <Ionicons name="trash-outline" size={24} color={colors.danger} />
      </Pressable>
      <View
        style={[
          styles.recBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Animated.View
          style={[styles.recDot, { backgroundColor: colors.danger }, dotStyle]}
        />
        <AppText variant="body" weight="semibold">
          {starting ? "Starting…" : formatDuration(state.durationMillis)}
        </AppText>
        <AppText variant="caption" muted style={styles.flex}>
          {starting ? "" : "Recording"}
        </AppText>
      </View>
      <Pressable
        onPress={() => finish(true)}
        disabled={starting}
        accessibilityRole="button"
        accessibilityLabel="Send voice message"
        style={[
          styles.recSend,
          { backgroundColor: colors.primary, opacity: starting ? 0.5 : 1 },
        ]}
      >
        <Ionicons name="send" size={20} color={colors.onPrimary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  noTouch: {
    pointerEvents: "none",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  media: {
    borderRadius: 18,
    overflow: "hidden",
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  duration: {
    position: "absolute",
    right: 8,
    bottom: 8,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  audio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 230,
  },
  audioTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  audioFill: {
    height: 4,
    borderRadius: 2,
  },
  full: {
    flex: 1,
  },
  close: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  recorder: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recBtn: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  recBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
