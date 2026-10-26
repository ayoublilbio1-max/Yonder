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
import { profileDraftKey } from "../onboarding/OnboardingProvider";
import type { ProfileDraft } from "../onboarding/types";
import type { Profile, ProfileGender } from "../profiles/types";
import { buildDeck } from "./buildDeck";

// Swipe state for one account.
// - decisions (like / pass / super like) are saved on the phone, for matches later;
// - profiles swiped in this app session leave the deck until the app is closed (rule 9.1),
//   except with Rewind (rule 9.5).
// Mount it with key={userId}.

export type SwipeAction = "like" | "pass" | "superlike";
type Swiped = { id: string; action: SwipeAction };

const decisionsKey = (userId: string) => `yonder.swipes.${userId}`;

type SwipeContextValue = {
  ready: boolean;
  show: ProfileGender; // who the tester sees
  deck: Profile[];
  swipe: (id: string, action: SwipeAction) => void;
  rewindLast: () => Profile | null;
  canRewind: boolean;
  rewindPassed: () => number;
  decisions: Record<string, SwipeAction>;
};

const SwipeContext = createContext<SwipeContextValue | null>(null);

export function SwipeProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState<ProfileGender>("female");
  const [decisions, setDecisions] = useState<Record<string, SwipeAction>>({});
  const [sessionSwiped, setSessionSwiped] = useState<Swiped[]>([]);

  // Load the tester's gender (from onboarding) and saved decisions.
  useEffect(() => {
    let alive = true;
    const t0 = Date.now();
    Promise.all([
      AsyncStorage.getItem(profileDraftKey(userId)),
      AsyncStorage.getItem(decisionsKey(userId)),
    ])
      .then(([draftRaw, decisionsRaw]) => {
        if (!alive) return;
        const draft = draftRaw ? (JSON.parse(draftRaw) as ProfileDraft) : {};
        const nextShow: ProfileGender =
          draft.gender === "woman" ? "male" : "female";
        setShow(nextShow);
        const saved = decisionsRaw
          ? (JSON.parse(decisionsRaw) as Record<string, SwipeAction>)
          : {};
        setDecisions(saved);
        if (__DEV__) {
          console.log(
            `[deck] loaded in ${Date.now() - t0}ms · tester=${draft.gender ?? "unknown"} → showing ${nextShow} · ${Object.keys(saved).length} saved decisions`,
          );
        }
      })
      .catch((e) => {
        if (__DEV__) console.log("[deck] load failed", String(e));
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  // Save decisions after every change.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(decisionsKey(userId), JSON.stringify(decisions)).catch(
      () => {},
    );
  }, [decisions, ready, userId]);

  const hiddenIds = useMemo(
    () => new Set(sessionSwiped.map((s) => s.id)),
    [sessionSwiped],
  );
  const deck = useMemo(
    () => (ready ? buildDeck(show, hiddenIds) : []),
    [ready, show, hiddenIds],
  );

  const swipe = useCallback((id: string, action: SwipeAction) => {
    setSessionSwiped((prev) => [...prev, { id, action }]);
    setDecisions((prev) => ({ ...prev, [id]: action }));
    if (__DEV__) console.log(`[deck] ${action} ${id}`);
  }, []);

  const rewindLast = useCallback(() => {
    const last = sessionSwiped[sessionSwiped.length - 1];
    if (!last) return null;
    setSessionSwiped((prev) => prev.slice(0, -1));
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[last.id];
      return next;
    });
    if (__DEV__) console.log(`[deck] rewind ${last.id} (${last.action})`);
    return buildDeck(show, new Set()).find((p) => p.id === last.id) ?? null;
  }, [sessionSwiped, show]);

  const rewindPassed = useCallback(() => {
    const passed = sessionSwiped.filter((s) => s.action === "pass").length;
    setSessionSwiped((prev) => prev.filter((s) => s.action !== "pass"));
    if (__DEV__) console.log(`[deck] rewind ${passed} passed profiles`);
    return passed;
  }, [sessionSwiped]);

  const value = useMemo(
    () => ({
      ready,
      show,
      deck,
      swipe,
      rewindLast,
      canRewind: sessionSwiped.length > 0,
      rewindPassed,
      decisions,
    }),
    [
      ready,
      show,
      deck,
      swipe,
      rewindLast,
      sessionSwiped.length,
      rewindPassed,
      decisions,
    ],
  );

  return (
    <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>
  );
}

export function useSwipe() {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error("useSwipe must be used inside SwipeProvider");
  return ctx;
}
