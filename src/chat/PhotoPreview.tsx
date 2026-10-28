import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { useTheme } from "../theme/ThemeProvider";
import type { ChatMedia } from "./ChatProvider";
import type { PhotoTimer } from "./media";

// Before a photo is sent: see it full screen and choose a timer (like Snapchat / Instagram).
// Off = a normal photo · View once · 5 s · 10 s.

const OPTIONS: { key: PhotoTimer | "off"; label: string }[] = [
  { key: "off", label: "Off" },
  { key: "once", label: "View once" },
  { key: 5, label: "5 s" },
  { key: 10, label: "10 s" },
];

type Props = {
  media: ChatMedia | null; // null = closed
  onCancel: () => void;
  onSend: (media: ChatMedia) => void;
};

export function PhotoPreview({ media, onCancel, onSend }: Props) {
  return (
    <Modal
      visible={media !== null}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {media ? (
        <PreviewContent media={media} onCancel={onCancel} onSend={onSend} />
      ) : null}
    </Modal>
  );
}

function PreviewContent({
  media,
  onCancel,
  onSend,
}: {
  media: ChatMedia;
  onCancel: () => void;
  onSend: (m: ChatMedia) => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [timer, setTimer] = useState<PhotoTimer | "off">("off");

  return (
    <View style={[styles.root, { backgroundColor: colors.viewerBg }]}>
      <Image
        source={{ uri: media.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
      />

      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          hitSlop={10}
          style={[styles.circle, { backgroundColor: colors.photoScrimTop }]}
        >
          <Ionicons name="close" size={24} color={colors.onPhoto} />
        </Pressable>
      </View>

      <View
        style={[
          styles.bottom,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: colors.photoScrimTop,
          },
        ]}
      >
        <View style={styles.timerHead}>
          <Ionicons name="timer-outline" size={18} color={colors.onPhoto} />
          <AppText variant="bodySmall" weight="semibold" color={colors.onPhoto}>
            Timer
          </AppText>
          <AppText
            variant="caption"
            color={colors.onPhotoMuted}
            style={styles.flex}
          >
            {timer === "off"
              ? "A normal photo"
              : timer === "once"
                ? "They can open it once"
                : `They can see it for ${timer} seconds, once`}
          </AppText>
        </View>
        <View style={styles.chips}>
          {OPTIONS.map((o) => {
            const on = timer === o.key;
            return (
              <Pressable
                key={String(o.key)}
                onPress={() => setTimer(o.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.onPhoto : "transparent",
                    borderColor: colors.onPhoto,
                  },
                ]}
              >
                <AppText
                  variant="bodySmall"
                  weight="semibold"
                  color={on ? colors.viewerBg : colors.onPhoto}
                >
                  {o.label}
                </AppText>
              </Pressable>
            );
          })}
          <View style={styles.flex} />
          <Pressable
            onPress={() =>
              onSend(timer === "off" ? media : { ...media, timer })
            }
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="send" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "space-between",
  },
  flex: {
    flex: 1,
  },
  top: {
    paddingHorizontal: 16,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  timerHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
