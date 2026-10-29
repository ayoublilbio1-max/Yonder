import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { AppText } from "../components/AppText";
import { PressableScale } from "../components/PressableScale";
import { DURATION, EASE, EASE_OUT } from "../motion/ease";
import { useTheme } from "../theme/ThemeProvider";
import { PASSCODE_LENGTH } from "./passcode";

// 4 dots + a number pad (Yonder's own keypad, so the phone keyboard never shows).
// onDone gets the 4 digits; change `resetKey` to empty the dots (e.g. after a wrong code).

type Props = {
  title: string;
  subtitle?: string;
  error?: string | null;
  resetKey: number;
  onDone: (code: string) => void;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function PinPad({ title, subtitle, error, resetKey, onDone }: Props) {
  const colors = useTheme();
  const [code, setCode] = useState("");
  const [lastReset, setLastReset] = useState(resetKey);

  // a new resetKey empties the dots (during render, no effect needed)
  if (lastReset !== resetKey) {
    setLastReset(resetKey);
    setCode("");
  }

  const press = (k: string) => {
    if (k === "del") {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (code.length >= PASSCODE_LENGTH) return;
    const next = code + k;
    setCode(next);
    if (next.length === PASSCODE_LENGTH) setTimeout(() => onDone(next), 160); // let the last dot fill first
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.lock, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="lock-closed" size={28} color={colors.primary} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      <AppText
        variant="body"
        align="center"
        color={error ? colors.danger : colors.textMuted}
        style={styles.subtitle}
      >
        {error ?? subtitle ?? " "}
      </AppText>
      <View style={styles.dots}>
        {Array.from({ length: PASSCODE_LENGTH }, (_, i) => (
          <Dot
            key={i}
            filled={i < code.length}
            error={Boolean(error) && code.length === 0}
          />
        ))}
      </View>
      <View style={styles.pad}>
        {KEYS.map((k, i) =>
          k === "" ? (
            <View key={i} style={styles.key} />
          ) : (
            <PressableScale
              key={i}
              onPress={() => press(k)}
              accessibilityRole="button"
              accessibilityLabel={k === "del" ? "Delete" : k}
              scaleTo={0.9}
              style={[
                styles.key,
                k !== "del" && { backgroundColor: colors.surface },
              ]}
            >
              {k === "del" ? (
                <Ionicons
                  name="backspace-outline"
                  size={26}
                  color={colors.text}
                />
              ) : (
                <AppText variant="title">{k}</AppText>
              )}
            </PressableScale>
          ),
        )}
      </View>
    </View>
  );
}

function Dot({ filled, error }: { filled: boolean; error: boolean }) {
  const colors = useTheme();
  const on = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    on.set(
      withTiming(filled ? 1 : 0, {
        duration: DURATION.press,
        easing: filled ? EASE_OUT : EASE,
      }),
    );
  }, [filled, on]);
  const style = useAnimatedStyle(() => ({
    opacity: on.get(),
    transform: [{ scale: 0.5 + on.get() * 0.5 }],
  }));
  return (
    <View
      style={[
        styles.dot,
        { borderColor: error ? colors.danger : colors.primary },
      ]}
    >
      <Animated.View
        style={[styles.dotFill, { backgroundColor: colors.primary }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  lock: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  subtitle: {
    marginTop: 6,
    minHeight: 24,
  },
  dots: {
    flexDirection: "row",
    gap: 18,
    marginVertical: 26,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotFill: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  pad: {
    width: 276,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  key: {
    width: 80,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
