import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentProps, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";

// Base for every popup in the app (never the native Alert):
// icon in a soft circle, title, optional message, then the buttons/content.

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
        <View style={[styles.card, { backgroundColor: colors.card }]}>
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
        </View>
      </View>
    </Modal>
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
