import { Stack } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { OnboardingProvider } from "../../onboarding/OnboardingProvider";
import { useTheme } from "../../theme/ThemeProvider";

// Profile setup screens, shown after sign-in until onboarding is complete.
// key={userId}: each account gets its own saved answers.
export default function OnboardingLayout() {
  const colors = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id ?? "signed-out";

  return (
    <OnboardingProvider key={userId} userId={userId}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="start" />
        <Stack.Screen name="step/[id]" />
        <Stack.Screen name="finish" options={{ gestureEnabled: false }} />
      </Stack>
    </OnboardingProvider>
  );
}
