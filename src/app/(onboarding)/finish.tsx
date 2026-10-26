import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState, type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../auth/AuthProvider";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import {
    cmToFeet,
    DRINKING_OPTIONS,
    INTENT_OPTIONS,
    labelOf,
    MARITAL_OPTIONS,
    RELIGION_OPTIONS,
    SMOKING_OPTIONS,
} from "../../onboarding/options";
import { firstUnanswered, stepHref } from "../../onboarding/steps";
import { useTheme } from "../../theme/ThemeProvider";

type SummaryRow = {
  icon: ComponentProps<typeof Ionicons>["name"];
  text: string;
};

function ageFrom(iso: string | undefined) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d))
    age -= 1;
  return age;
}

// Last onboarding screen: a short summary, then into the app.
export default function OnboardingFinishScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { loaded, draft } = useOnboarding();
  const [busy, setBusy] = useState(false);

  if (!loaded) return null;

  const missing = firstUnanswered(draft);
  const age = ageFrom(draft.birthday);

  const allRows: SummaryRow[] = [
    {
      icon: "person-outline",
      text: `${draft.firstName ?? ""}${age != null ? `, ${age}` : ""}`,
    },
    { icon: "heart-outline", text: labelOf(INTENT_OPTIONS, draft.intent) },
    {
      icon: "ribbon-outline",
      text: labelOf(MARITAL_OPTIONS, draft.maritalStatus),
    },
    {
      icon: "resize-outline",
      text: draft.heightCm
        ? `${draft.heightCm} cm · ${cmToFeet(draft.heightCm)}`
        : "",
    },
    {
      icon: "flame-outline",
      text: draft.smoking
        ? `Smoking: ${labelOf(SMOKING_OPTIONS, draft.smoking)}`
        : "",
    },
    {
      icon: "wine-outline",
      text: draft.drinking
        ? `Drinking: ${labelOf(DRINKING_OPTIONS, draft.drinking)}`
        : "",
    },
    {
      icon: "sparkles-outline",
      text:
        draft.religion && draft.religion !== "prefer_not"
          ? labelOf(RELIGION_OPTIONS, draft.religion)
          : "",
    },
  ];
  const rows = allRows.filter((r) => r.text);

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    if (__DEV__) console.log("[onboarding] finished", JSON.stringify(draft));
    await completeOnboarding(); // the root layout moves on to the app
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      <View style={styles.body}>
        <View style={[styles.check, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="checkmark" size={44} color={colors.primary} />
        </View>
        <AppText variant="display">
          Nice to meet you, {draft.firstName ?? "there"}!
        </AppText>
        <AppText variant="body" muted>
          Here’s your profile so far. You can change it any time.
        </AppText>

        <View
          style={[
            styles.summary,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {rows.map((r) => (
            <View key={r.icon} style={styles.summaryRow}>
              <Ionicons name={r.icon} size={20} color={colors.primary} />
              <AppText variant="body" style={styles.flex}>
                {r.text}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {missing ? (
          <AppButton
            label="Answer the missing question"
            onPress={() => router.push(stepHref(missing))}
          />
        ) : (
          <AppButton
            label={busy ? "Please wait…" : "Start exploring"}
            onPress={finish}
            disabled={busy}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  check: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  actions: {
    gap: 10,
  },
});
