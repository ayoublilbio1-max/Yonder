import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../components/PressableScale";
import { DURATION, EASE_OUT } from "../motion/ease";
import { useTheme } from "../theme/ThemeProvider";
import { clearPasscode, getPasscode, setPasscode } from "./passcode";
import { PinPad } from "./PinPad";

// Settings › Passcode: turn on (new + confirm), change (current + new + confirm), turn off (current).

export type PasscodeMode = "set" | "change" | "remove";
type Step = "current" | "new" | "confirm";

type Props = {
  mode: PasscodeMode | null; // null = closed
  userId: string;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function PasscodeSetup({ mode, userId, onClose, onDone }: Props) {
  return (
    <Modal
      visible={mode !== null}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {mode ? (
        <Flow
          key={mode}
          mode={mode}
          userId={userId}
          onClose={onClose}
          onDone={onDone}
        />
      ) : null}
    </Modal>
  );
}

function Flow({
  mode,
  userId,
  onClose,
  onDone,
}: {
  mode: PasscodeMode;
  userId: string;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(mode === "set" ? "new" : "current");
  const [first, setFirst] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const wrong = (msg: string) => {
    setError(msg);
    setResetKey((k) => k + 1);
  };

  const onCode = async (code: string) => {
    if (step === "current") {
      const saved = await getPasscode(userId);
      if (code !== saved) return wrong("Wrong passcode. Try again.");
      if (mode === "remove") {
        await clearPasscode(userId);
        onDone("Passcode turned off");
        return;
      }
      setError(null);
      setStep("new");
      setResetKey((k) => k + 1);
      return;
    }
    if (step === "new") {
      setFirst(code);
      setError(null);
      setStep("confirm");
      setResetKey((k) => k + 1);
      return;
    }
    if (code !== first) {
      setStep("new");
      setFirst("");
      return wrong("The codes didn’t match. Start again.");
    }
    await setPasscode(userId, code);
    onDone(mode === "change" ? "Passcode changed" : "Passcode turned on");
  };

  const title =
    step === "current"
      ? "Enter your passcode"
      : step === "new"
        ? mode === "change"
          ? "Choose a new passcode"
          : "Choose a passcode"
        : "Type it again";
  const subtitle =
    step === "current"
      ? "To make changes, type your current passcode."
      : step === "new"
        ? "4 digits. You’ll type it each time you open Yonder."
        : "Just to be sure.";

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.top}>
        <PressableScale
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          scaleTo={0.88}
          style={[styles.close, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </PressableScale>
      </View>
      <Animated.View
        key={step}
        entering={FadeIn.duration(DURATION.quick + 40).easing(EASE_OUT)}
        style={styles.body}
      >
        <PinPad
          title={title}
          subtitle={subtitle}
          error={error}
          resetKey={resetKey}
          onDone={onCode}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  top: {
    paddingHorizontal: 16,
  },
  close: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
});
