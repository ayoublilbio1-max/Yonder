import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../auth/AuthProvider";
import { displayName } from "../../auth/types";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import {
  answeredCount,
  FINISH_HREF,
  firstUnanswered,
  STEP_IDS,
  stepHref,
} from "../../onboarding/steps";
import { useTheme } from "../../theme/ThemeProvider";

// First onboarding screen: welcome + Get started (or Continue where you left off).
export default function OnboardingStartScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { loaded, draft } = useOnboarding();
  const opening = useRef(false); // ignores a double tap (only one screen opens)

  if (!session || !loaded) return null;

  const done = answeredCount(draft);
  const resuming = done > 0;
  const name = draft.firstName ?? displayName(session.user);

  const start = () => {
    if (opening.current) return;
    opening.current = true;
    setTimeout(() => {
      opening.current = false;
    }, 800);
    const next = firstUnanswered(draft);
    if (__DEV__)
      console.log(
        `[onboarding] start · ${done}/${STEP_IDS.length} answered → ${next ?? "finish"}`,
      );
    router.push(next ? stepHref(next) : FINISH_HREF);
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
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Ionicons name="sparkles" size={44} color={colors.onPrimary} />
        </LinearGradient>

        <AppText variant="display">Hi {name}, welcome to Yonder</AppText>
        <AppText variant="body" muted>
          {resuming
            ? `You’ve answered ${done} of ${STEP_IDS.length} questions. Let’s finish your profile.`
            : "Tell us a little about yourself and we’ll show you great people nearby. It takes about 2 minutes."}
        </AppText>
        <AppText variant="bodySmall" muted>
          Signed in as {session.user.email}
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton
          label={resuming ? "Continue where you left off" : "Get started"}
          onPress={start}
        />
        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.logout}
        >
          <AppText variant="bodySmall" weight="semibold" muted>
            Not you? Log out
          </AppText>
        </Pressable>
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
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actions: {
    gap: 6,
  },
  logout: {
    alignItems: "center",
    paddingVertical: 10,
  },
});
