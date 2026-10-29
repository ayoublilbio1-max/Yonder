import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DURATION, EASE_OUT } from "../motion/ease";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";

// Base for every popup in the app (never the native Alert):
// icon in a soft circle, title, optional message, then the buttons/content.
// The card fades in and grows from 94 % with a CSS-like ease-out (no bounce).

type Props = {
  visible: boolean;
  onClose: () => void;
  icon: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBg: string;
  title: string;
  message?: string;
  children?: ReactNode;
};

export function ThemedModal({
  visible,
  onClose,
  icon,
  iconColor,
  iconBg,
  title,
  message,
  children,
}: Props) {
  const colors = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <Card>
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={30} color={iconColor} />
          </View>
          <AppText variant="title" align="center">
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" muted align="center">
              {message}
            </AppText>
          ) : null}
          {children ? <View style={styles.content}>{children}</View> : null}
        </Card>
      </View>
    </Modal>
  );
}

// Mounted each time the popup opens → plays the "appear" ease once.
function Card({ children }: { children: ReactNode }) {
  const colors = useTheme();
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(
      withTiming(1, { duration: DURATION.sheet - 60, easing: EASE_OUT }),
    );
  }, [shown]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ scale: 0.94 + shown.get() * 0.06 }],
  }));

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: colors.card }, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  content: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 10,
  },
});
