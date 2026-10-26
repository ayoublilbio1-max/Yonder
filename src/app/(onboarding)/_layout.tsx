import { Stack } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";

// Profile setup screens, shown after sign-in until onboarding is complete.
export default function OnboardingLayout() {
  const colors = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="start" />
    </Stack>
  );
}
