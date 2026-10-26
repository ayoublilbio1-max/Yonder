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
import type { ProfileDraft } from "./types";

// Keeps the onboarding answers and saves them on every change, so the tester
// can close the app and continue where they left off.
// Mount it with key={userId} so each account has its own draft.

export const profileDraftKey = (userId: string) =>
  `yonder.profileDraft.${userId}`;

type OnboardingContextValue = {
  loaded: boolean;
  draft: ProfileDraft;
  update: (patch: Partial<ProfileDraft>) => void;
};

const OnboardingContext = createContext<OnboardingContextValue>({
  loaded: false,
  draft: {},
  update: () => {},
});

export function OnboardingProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const storageKey = profileDraftKey(userId);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>({});

  useEffect(() => {
    let alive = true;
    const t0 = Date.now();
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!alive) return;
        const saved = raw ? (JSON.parse(raw) as ProfileDraft) : {};
        setDraft(saved);
        if (__DEV__)
          console.log(
            `[onboarding] draft loaded in ${Date.now() - t0}ms · ${Object.keys(saved).length} answers`,
          );
      })
      .catch((e) => {
        if (__DEV__) console.log("[onboarding] draft load failed", String(e));
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [storageKey]);

  // Save after every change (only once the saved draft has been read).
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(draft)).catch((e) => {
      if (__DEV__) console.log("[onboarding] draft save failed", String(e));
    });
  }, [draft, loaded, storageKey]);

  const update = useCallback((patch: Partial<ProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    if (__DEV__) console.log("[onboarding] answer", JSON.stringify(patch));
  }, []);

  const value = useMemo(
    () => ({ loaded, draft, update }),
    [loaded, draft, update],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
