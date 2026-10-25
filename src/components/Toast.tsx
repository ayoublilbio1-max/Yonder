import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";

type ToastContextValue = { show: (message: string) => void };

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

const DURATION_MS = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    setKey((k) => k + 1);
    timer.current = setTimeout(() => setMessage(null), DURATION_MS);
    if (__DEV__) console.log("[toast] show", JSON.stringify(next));
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message !== null ? (
        <Animated.View
          key={key}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(200)}
          style={[styles.wrap, { bottom: insets.bottom + 96 }]}
        >
          <View style={[styles.toast, { backgroundColor: colors.toastBg }]}>
            <AppText
              variant="bodySmall"
              weight="medium"
              color={colors.toastText}
              align="center"
            >
              {message}
            </AppText>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    pointerEvents: "none",
  },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: 420,
  },
});
