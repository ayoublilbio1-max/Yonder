import { Stack } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";

// Signed-out screens: welcome + email sign up / log in.
export default function AuthLayout() {
  const colors = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: "fade" }} />
      <Stack.Screen name="email" />
    </Stack>
  );
}
