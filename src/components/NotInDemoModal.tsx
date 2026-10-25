import { APP_NAME } from "../constants/app";
import { useTheme } from "../theme/ThemeProvider";
import { AppButton } from "./AppButton";
import { ThemedModal } from "./ThemedModal";

// Opened by any feature that isn't built in the demo (never says "coming soon").

type Props = {
  visible: boolean;
  feature: string; // e.g. "Boost"
  onClose: () => void;
};

export function NotInDemoModal({ visible, feature, onClose }: Props) {
  const colors = useTheme();

  return (
    <ThemedModal
      visible={visible}
      onClose={onClose}
      icon="sparkles-outline"
      iconColor={colors.primary}
      iconBg={colors.primarySoft}
      title="Not in the demo"
      message={`${feature} isn't included in this demo of ${APP_NAME}. Everything else you see works like the real app.`}
    >
      <AppButton label="Got it" onPress={onClose} />
    </ThemedModal>
  );
}
