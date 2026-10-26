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
import { signOutOfGoogle } from "./google";
import type { AuthUser, Session } from "./types";

const SESSION_KEY = "yonder.session";
const ONBOARDED_KEY = "yonder.onboardedUserIds"; // users who already finished onboarding

type AuthContextValue = {
  ready: boolean; // true once the saved session has been read
  session: Session | null;
  signIn: (user: AuthUser) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  session: null,
  signIn: async () => {},
  completeOnboarding: async () => {},
  signOut: async () => {},
});

async function readOnboardedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveSession(session: Session | null) {
  try {
    if (session)
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {
    if (__DEV__) console.log("[auth] save session failed", String(e));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;
    const t0 = Date.now();
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (!alive) return;
        const saved = raw ? (JSON.parse(raw) as Session) : null;
        setSession(saved);
        if (__DEV__) {
          console.log(
            `[auth] loaded in ${Date.now() - t0}ms · ${
              saved
                ? `${saved.user.email} (${saved.user.method}, onboarded=${saved.onboarded})`
                : "signed out"
            }`,
          );
        }
      })
      .catch((e) => {
        if (__DEV__) console.log("[auth] load failed, signed out", String(e));
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (user: AuthUser) => {
    const onboardedIds = await readOnboardedIds();
    const next: Session = {
      user,
      onboarded: onboardedIds.includes(user.id),
      signedInAt: Date.now(),
    };
    await saveSession(next);
    setSession(next);
    if (__DEV__)
      console.log(
        `[auth] signed in ${user.email} via ${user.method} · onboarded=${next.onboarded}`,
      );
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!session) return;
    const onboardedIds = await readOnboardedIds();
    if (!onboardedIds.includes(session.user.id)) {
      await AsyncStorage.setItem(
        ONBOARDED_KEY,
        JSON.stringify([...onboardedIds, session.user.id]),
      ).catch(() => {});
    }
    const next = { ...session, onboarded: true };
    await saveSession(next);
    setSession(next);
    if (__DEV__)
      console.log(`[auth] onboarding complete for ${session.user.email}`);
  }, [session]);

  const signOut = useCallback(async () => {
    const method = session?.user.method;
    if (method === "google") await signOutOfGoogle();
    await saveSession(null);
    setSession(null);
    if (__DEV__) console.log(`[auth] signed out (${method ?? "none"})`);
  }, [session]);

  const value = useMemo(
    () => ({ ready, session, signIn, completeOnboarding, signOut }),
    [ready, session, signIn, completeOnboarding, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
