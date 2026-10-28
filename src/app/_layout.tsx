import * as NavigationBar from "expo-navigation-bar";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
  type Href,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { ToastProvider } from "../components/Toast";
import { HIDE_ANDROID_NAV_BAR } from "../constants/app";
import { UserProviders } from "../store/UserProviders";
import {
  ThemeProvider,
  useIsDark,
  useTheme,
  useThemeMode,
} from "../theme/ThemeProvider";

// expo-navigation-bar changed its API across SDKs (setButtonStyleAsync → setStyle).
// Use whichever this SDK has. 'light' = light buttons (dark theme), 'dark' = dark buttons (light theme).
const navBarModule = NavigationBar as unknown as Record<string, unknown>;
let loggedNavBarApi = false;

function setNavBarButtons(style: "light" | "dark"): Promise<string> {
  if (__DEV__ && !loggedNavBarApi) {
    loggedNavBarApi = true;
    const fns = Object.keys(navBarModule).filter(
      (k) => typeof navBarModule[k] === "function",
    );
    console.log(`[navbar] module functions: ${fns.join(", ")}`);
  }
  const setStyle = navBarModule.setStyle;
  if (typeof setStyle === "function") {
    return Promise.resolve((setStyle as (s: string) => unknown)(style)).then(
      () => "setStyle",
    );
  }
  const setButtonStyleAsync = navBarModule.setButtonStyleAsync;
  if (typeof setButtonStyleAsync === "function") {
    return (setButtonStyleAsync as (s: string) => Promise<void>)(style).then(
      () => "setButtonStyleAsync",
    );
  }
  return Promise.reject(
    new Error("no button style function in expo-navigation-bar"),
  );
}

// Splash: keep it up until the saved theme + session are loaded and the first screen is chosen,
// then fade it out ONCE.
const APP_START = Date.now();
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const colors = useTheme();
  const isDark = useIsDark();
  const { ready: themeReady } = useThemeMode();
  const { ready: authReady, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();
  const splashHidden = useRef(false);

  const ready = themeReady && authReady;
  const navMounted = Boolean(navState?.key);

  // Send the user to the right place:
  // signed out → welcome · signed in but not onboarded → onboarding · onboarded → the app.
  useEffect(() => {
    if (!ready || !navMounted) return; // never navigate before the navigator is mounted
    const group = segments[0] as string | undefined;
    const inAuth = group === "(auth)";
    const inOnboarding = group === "(onboarding)";

    let target: Href | null = null;
    if (!session) {
      if (!inAuth) target = "/welcome" as Href;
    } else if (!session.onboarded) {
      if (!inOnboarding) target = "/start" as Href;
    } else if (inAuth || inOnboarding) {
      target = "/" as Href;
    }

    if (target) {
      // Clear the history first so Back can't return to the previous section.
      if (typeof router.canDismiss === "function" && router.canDismiss())
        router.dismissAll();
      router.replace(target);
      if (__DEV__)
        console.log(`[route] ${group ?? "(root)"} → ${String(target)}`);
    }

    // Hide the splash once only, right after the first screen is chosen.
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync()
      .then(() => {
        if (__DEV__)
          console.log(`[splash] hidden after ${Date.now() - APP_START}ms`);
      })
      .catch((e) => {
        if (__DEV__) console.log("[splash] hide failed", String(e));
      });
  }, [ready, navMounted, session, segments, router]);

  // Android bottom navigation bar: hidden or shown, from HIDE_ANDROID_NAV_BAR in constants/app.ts.
  // Re-applied when the app comes back to the foreground, because Android can change it.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const apply = () => {
      if (HIDE_ANDROID_NAV_BAR) {
        NavigationBar.setVisibilityAsync("hidden")
          .then(() => {
            if (__DEV__) console.log("[navbar] hidden");
          })
          .catch((e) => {
            if (__DEV__) console.log("[navbar] hide failed", String(e));
          });
      } else {
        const buttons = isDark ? "light" : "dark";
        NavigationBar.setVisibilityAsync("visible")
          .then(() => setNavBarButtons(buttons))
          .then((api) => {
            if (__DEV__)
              console.log(`[navbar] visible · ${buttons} buttons (via ${api})`);
          })
          .catch((e) => {
            if (__DEV__) console.log("[navbar] show failed", String(e));
          });
      }
    };
    apply();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") apply();
    });
    return () => sub.remove();
  }, [isDark]);

  // Root window background follows the theme (no white flash between screens).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  if (!ready) return null; // splash is still showing

  return (
    <ToastProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <UserProviders>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
          <Stack.Screen
            name="(onboarding)"
            options={{ animation: "fade", gestureEnabled: false }}
          />
          <Stack.Screen name="settings" />
          <Stack.Screen name="chat/[id]" />
        </Stack>
      </UserProviders>
    </ToastProvider>
  );
}
