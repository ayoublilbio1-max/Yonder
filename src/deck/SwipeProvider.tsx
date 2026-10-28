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
import {
  applyFilters,
  DEFAULT_FILTERS,
  withoutGold,
  type FilterResult,
  type Filters,
} from "../filters/filters";
import { profileDraftKey } from "../onboarding/OnboardingProvider";
import type { ProfileDraft } from "../onboarding/types";
import type { Profile, ProfileGender } from "../profiles/types";
import { useWallet } from "../store/WalletProvider";
import { buildDeck } from "./buildDeck";
import { sortDeck, type SortKey } from "./sort";

// Swipe state for one account, saved on the phone:
// - decisions (like / pass / super like) for matches later;
// - favorites, blocked / reported profiles (never shown again), compliments sent;
// - profiles swiped in this app session leave the deck until the app closes (rule 9.1), except with Rewind.
// Mount it with key={userId}.

export type SwipeAction = "like" | "pass" | "superlike";
type Swiped = { id: string; action: SwipeAction };

type Saved = {
  decisions: Record<string, SwipeAction>;
  favorites: string[];
  blocked: string[];
  compliments: Record<string, string>;
  sort: SortKey;
  filters: Filters;
  notificationsSeenAt: number; // last time the list was opened (ms)
};

const EMPTY: Saved = {
  decisions: {},
  favorites: [],
  blocked: [],
  compliments: {},
  sort: "recommended",
  filters: DEFAULT_FILTERS,
  notificationsSeenAt: 0,
};
const storageKey = (userId: string) => `yonder.deck.${userId}`;

type SwipeContextValue = {
  ready: boolean;
  show: ProfileGender; // who the tester sees
  me: ProfileDraft; // the tester's own onboarding answers (for "Your similarities")
  deck: Profile[];
  swipe: (id: string, action: SwipeAction) => void;
  rewindLast: () => Profile | null;
  canRewind: boolean;
  rewindPassed: () => number;
  saved: Saved;
  toggleFavorite: (id: string) => boolean; // returns the new state
  block: (id: string, reason: string) => void;
  saveCompliment: (id: string, text: string) => void;
  setSort: (sort: SortKey) => void;
  setFilters: (filters: Filters) => void;
  filterNotice: FilterResult["notice"];
  markNotificationsSeen: () => void;
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
  const [me, setMe] = useState<ProfileDraft>({});
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [sessionSwiped, setSessionSwiped] = useState<Swiped[]>([]);
  const { wallet } = useWallet(); // WalletProvider wraps SwipeProvider in (tabs)/_layout
  const [round, setRound] = useState(0); // +1 each time filters are applied → reshuffled deck
  const [lastTopId, setLastTopId] = useState<string | null>(null); // never the same face first after a reshuffle

  useEffect(() => {
    let alive = true;
    const t0 = Date.now();
    Promise.all([
      AsyncStorage.getItem(profileDraftKey(userId)),
      AsyncStorage.getItem(storageKey(userId)),
    ])
      .then(([draftRaw, savedRaw]) => {
        if (!alive) return;
        const draft = draftRaw ? (JSON.parse(draftRaw) as ProfileDraft) : {};
        const parsed = savedRaw ? (JSON.parse(savedRaw) as Partial<Saved>) : {};
        const loaded: Saved = {
          ...EMPTY,
          ...parsed,
          filters: { ...DEFAULT_FILTERS, ...parsed.filters },
        };
        setMe(draft);
        setSaved(loaded);
        if (__DEV__) {
          console.log(
            `[deck] loaded in ${Date.now() - t0}ms · tester=${draft.gender ?? "unknown"} · ${Object.keys(loaded.decisions).length} decisions · ${loaded.favorites.length} favorites · ${loaded.blocked.length} blocked`,
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

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(storageKey(userId), JSON.stringify(saved)).catch(
      () => {},
    );
  }, [saved, ready, userId]);

  const show: ProfileGender = me.gender === "woman" ? "male" : "female";

  const hiddenIds = useMemo(
    () => new Set([...sessionSwiped.map((s) => s.id), ...saved.blocked]),
    [sessionSwiped, saved.blocked],
  );
  // Full session order → filters (rule 9.4) → hide swiped / blocked → sort.
  const pool = useMemo(
    () => (ready ? buildDeck(show, new Set(), round) : []),
    [ready, show, round],
  );
  const activeFilters = useMemo(
    () => (wallet.gold ? saved.filters : withoutGold(saved.filters)),
    [wallet.gold, saved.filters],
  );
  const filtered = useMemo(
    () => applyFilters(pool, activeFilters, show),
    [pool, activeFilters, show],
  );
  const deck = useMemo(() => {
    const list = sortDeck(
      filtered.list.filter((p) => !hiddenIds.has(p.id)),
      saved.sort,
      me,
    );
    if (lastTopId && list.length > 1 && list[0].id === lastTopId)
      [list[0], list[1]] = [list[1], list[0]];
    return list;
  }, [filtered, hiddenIds, saved.sort, me, lastTopId]);

  const swipe = useCallback((id: string, action: SwipeAction) => {
    setSessionSwiped((prev) => [...prev, { id, action }]);
    setLastTopId(null); // the reshuffle swap is only for the first card after Apply
    setSaved((prev) => ({
      ...prev,
      decisions: { ...prev.decisions, [id]: action },
    }));
    if (__DEV__) console.log(`[deck] ${action} ${id}`);
  }, []);

  const rewindLast = useCallback(() => {
    const last = sessionSwiped[sessionSwiped.length - 1];
    if (!last) return null;
    setSessionSwiped((prev) => prev.slice(0, -1));
    setSaved((prev) => {
      const decisions = { ...prev.decisions };
      delete decisions[last.id];
      return { ...prev, decisions };
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

  const toggleFavorite = useCallback(
    (id: string) => {
      const next = !saved.favorites.includes(id);
      setSaved((prev) => ({
        ...prev,
        favorites: next
          ? [...prev.favorites, id]
          : prev.favorites.filter((f) => f !== id),
      }));
      if (__DEV__) console.log(`[deck] favorite ${id} → ${next}`);
      return next;
    },
    [saved.favorites],
  );

  const block = useCallback((id: string, reason: string) => {
    setSaved((prev) => ({
      ...prev,
      blocked: prev.blocked.includes(id) ? prev.blocked : [...prev.blocked, id],
    }));
    if (__DEV__) console.log(`[deck] blocked ${id} · ${reason}`);
  }, []);

  const saveCompliment = useCallback((id: string, text: string) => {
    setSaved((prev) => ({
      ...prev,
      compliments: { ...prev.compliments, [id]: text },
    }));
    if (__DEV__)
      console.log(`[deck] compliment to ${id} (${text.length} chars)`);
  }, []);

  const setSort = useCallback((sort: SortKey) => {
    setSaved((prev) => ({ ...prev, sort }));
    if (__DEV__) console.log(`[sort] ${sort}`);
  }, []);

  const topNow = deck[0]?.id ?? null;
  const setFilters = useCallback(
    (filters: Filters) => {
      setSaved((prev) => ({ ...prev, filters }));
      setLastTopId(topNow);
      setRound((r) => r + 1);
      if (__DEV__)
        console.log(
          "[filters] applied · deck reshuffled",
          JSON.stringify(filters),
        );
    },
    [topNow],
  );

  const markNotificationsSeen = useCallback(() => {
    setSaved((prev) => ({ ...prev, notificationsSeenAt: Date.now() }));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      show,
      me,
      deck,
      swipe,
      rewindLast,
      canRewind: sessionSwiped.length > 0,
      rewindPassed,
      saved,
      toggleFavorite,
      block,
      saveCompliment,
      setSort,
      setFilters,
      filterNotice: filtered.notice,
      markNotificationsSeen,
    }),
    [
      ready,
      show,
      me,
      deck,
      swipe,
      rewindLast,
      sessionSwiped.length,
      rewindPassed,
      saved,
      toggleFavorite,
      block,
      saveCompliment,
      setSort,
      setFilters,
      filtered.notice,
      markNotificationsSeen,
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
