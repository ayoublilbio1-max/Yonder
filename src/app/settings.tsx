import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState, type ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { FeedbackModal } from "../components/FeedbackModal";
import { APP_NAME, APP_VERSION, DEVELOPER } from "../constants/app";
import { useTheme, useThemeMode, type ThemeMode } from "../theme/ThemeProvider";

type IconName = ComponentProps<typeof Ionicons>["name"];

const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string; icon: IconName }[] =
  [
    { mode: "system", label: "Follow phone", icon: "phone-portrait-outline" },
    { mode: "light", label: "Light", icon: "sunny-outline" },
    { mode: "dark", label: "Dark", icon: "moon-outline" },
  ];

export default function SettingsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, setMode } = useThemeMode();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="title">Settings</AppText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <AppText variant="label" muted style={styles.sectionTitle}>
          APPEARANCE
        </AppText>
        <View
          style={[
            styles.group,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {APPEARANCE_OPTIONS.map((option, i) => {
            const selected = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.row,
                  i > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <Ionicons name={option.icon} size={22} color={colors.text} />
                <AppText variant="body" style={styles.rowText}>
                  {option.label}
                </AppText>
                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={selected ? colors.primary : colors.textSubtle}
                />
              </Pressable>
            );
          })}
        </View>

        <AppText variant="label" muted style={styles.sectionTitle}>
          HELP
        </AppText>
        <View
          style={[
            styles.group,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => setFeedbackOpen(true)}
            accessibilityRole="button"
            style={styles.row}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="medium">
                Feedback
              </AppText>
              <AppText variant="bodySmall" muted>
                Report a bug or tell us what to improve
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSubtle}
            />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <AppText variant="bodySmall" muted align="center">
            {APP_NAME} {APP_VERSION}
          </AppText>
          <AppText variant="bodySmall" muted align="center">
            Developed with{" "}
            <AppText variant="bodySmall" color={colors.primary}>
              ♥
            </AppText>{" "}
            by {DEVELOPER}
          </AppText>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: {
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 36,
    gap: 2,
  },
});
