import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentProps } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { AppButton } from "./AppButton";
import { ThemedModal } from "./ThemedModal";

// Themed confirmation (never the native Alert): icon, title, message, Cancel + red Delete.

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  icon = "trash-outline",
  onConfirm,
  onCancel,
}: Props) {
  const colors = useTheme();

  return (
    <ThemedModal
      visible={visible}
      onClose={onCancel}
      icon={icon}
      iconColor={colors.danger}
      iconBg={colors.dangerSoft}
      title={title}
      message={message}
    >
      <AppButton
        label={confirmLabel}
        variant="danger"
        onPress={() => {
          if (__DEV__) console.log(`[confirm] "${title}" → confirmed`);
          onConfirm();
        }}
      />
      <AppButton
        label={cancelLabel}
        variant="secondary"
        onPress={() => {
          if (__DEV__) console.log(`[confirm] "${title}" → cancelled`);
          onCancel();
        }}
      />
    </ThemedModal>
  );
}
