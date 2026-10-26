import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../auth/AuthProvider";
import { displayName, METHOD_LABEL } from "../../auth/types";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useTheme } from "../../theme/ThemeProvider";

// Temporary first onboarding screen (part 1). Part 2 replaces it with the profile questions.
export default function OnboardingStartScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { session, completeOnboarding, signOut } = useAuth();

  if (!session) return null;
  const { user } = session;

  return (
    <Screen style={{ paddingBottom: insets.bottom + 20 }}>
      <View style={styles.body}>
        <AppText variant="display">You’re in, {displayName(user)}</AppText>
        <AppText variant="body" muted>
          Signed in with {METHOD_LABEL[user.method]} as {user.email}.
        </AppText>
        <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
          <AppText variant="bodySmall">
            Next comes your profile: photos, details and what you’re looking
            for. Those screens are added in the next update.
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton label="Continue to Yonder" onPress={completeOnboarding} />
        <AppButton label="Log out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 10,
  },
  note: {
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  actions: {
    gap: 12,
  },
});
