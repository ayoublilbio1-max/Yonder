import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentProps } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";
import { PressableScale } from "./PressableScale";

type Variant = "primary" | "secondary" | "danger" | "boost";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Eases down to 97 % while pressed (CSS-like), back up on release.
export function AppButton({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  style,
}: Props) {
  const colors = useTheme();

  const palette: Record<Variant, { bg: string; fg: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    secondary: { bg: colors.surface, fg: colors.text },
    danger: { bg: colors.danger, fg: colors.onDanger },
    boost: { bg: colors.boost, fg: colors.onBoost },
  };
  const { bg, fg } = palette[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      dimTo={0.9}
      style={style}
    >
      <View
        style={[
          styles.button,
          { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
          variant === "secondary" && {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
        <AppText variant="body" weight="semibold" color={fg}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
