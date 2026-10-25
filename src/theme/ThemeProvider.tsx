import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemeColors } from "../constants/colors";

// Settings › Appearance: follow the phone, or force light / dark.
export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "yonder.themeMode";

type ThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  ready: boolean; // true once the saved mode has been read
};

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "system",
  setMode: () => {},
  ready: false,
});

// Appearance.setColorScheme makes useColorScheme(), <StatusBar style="auto" />
// and native views all follow the chosen mode.
function applyMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode === "system" ? "unspecified" : mode);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const t0 = Date.now();
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        const loaded: ThemeMode =
          saved === "light" || saved === "dark" ? saved : "system";
        if (!alive) return;
        applyMode(loaded);
        setModeState(loaded);
        if (__DEV__)
          console.log(
            `[theme] loaded mode "${loaded}" in ${Date.now() - t0}ms`,
          );
      })
      .catch((e) => {
        if (__DEV__)
          console.log("[theme] load failed, using system", String(e));
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    applyMode(next);
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((e) => {
      if (__DEV__) console.log("[theme] save failed", String(e));
    });
    if (__DEV__) console.log(`[theme] mode now "${next}"`);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, ready }),
    [mode, setMode, ready],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

// Settings screen: read / change the mode.
export function useThemeMode() {
  return useContext(ThemeModeContext);
}

// Every screen: const colors = useTheme();
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkColors : lightColors;
}

export function useIsDark() {
  return useColorScheme() === "dark";
}
