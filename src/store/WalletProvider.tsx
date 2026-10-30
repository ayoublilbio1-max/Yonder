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
import { notifyBoost } from "../notify/notify";
import { playSound } from "../sound/sounds";
import { savesPaused, walletKey } from "./restart";

// Demo purchases for one account, saved on the phone: compliments (1 free per day + packs),
// boosts (3 hours each) and Gold (v0.9.0). Nothing is ever charged.
// Mount it with key={userId}.

type Wallet = {
  compliments: number; // bought, not used yet
  freeComplimentDay: string | null; // YYYY-MM-DD when the free one was used
  boosts: number;
  boostEndsAt: number | null;
  gold: boolean;
  purchases: Purchase[]; // Settings › Manage purchases (newest first)
};

export type Purchase = { id: string; at: number; title: string; total: number };

const EMPTY: Wallet = {
  compliments: 0,
  freeComplimentDay: null,
  boosts: 0,
  boostEndsAt: null,
  gold: false,
  purchases: [],
};
const today = () => new Date().toISOString().slice(0, 10);

export const COMPLIMENT_PACKS = [
  { qty: 3, price: 2.99 },
  { qty: 10, price: 7.99, tag: "Popular" },
  { qty: 25, price: 14.99, tag: "Best value" },
];

export const BOOST_HOURS = 3;
const BOOST_MS = BOOST_HOURS * 60 * 60 * 1000;

export const BOOST_PACKS = [
  { qty: 1, each: 1.49 },
  { qty: 5, each: 1.39, tag: "Popular" },
  { qty: 10, each: 1.19, tag: "Best value" },
];

type WalletContextValue = {
  ready: boolean;
  wallet: Wallet;
  freeComplimentLeft: boolean;
  complimentsLeft: number; // free + bought
  spendCompliment: () => boolean;
  addCompliments: (qty: number) => void;
  addBoosts: (qty: number, startOne: boolean) => void; // a purchase; startOne = turn one on now
  startBoost: () => boolean;
  update: (patch: Partial<Wallet>) => void;
  recordPurchase: (title: string, total: number) => void; // called by the demo checkout
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<Wallet>(EMPTY);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(walletKey(userId))
      .then((raw) => {
        if (!alive) return;
        const loaded = raw
          ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Wallet>) }
          : EMPTY;
        setWallet(loaded);
        if (__DEV__)
          console.log(
            `[wallet] loaded · ${loaded.compliments} compliments · ${loaded.boosts} boosts · gold=${loaded.gold}`,
          );
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!ready || savesPaused()) return;
    AsyncStorage.setItem(walletKey(userId), JSON.stringify(wallet)).catch(
      () => {},
    );
  }, [wallet, ready, userId]);

  const freeComplimentLeft = wallet.freeComplimentDay !== today();

  const spendCompliment = useCallback(() => {
    if (wallet.freeComplimentDay !== today()) {
      setWallet((w) => ({ ...w, freeComplimentDay: today() }));
      if (__DEV__) console.log("[wallet] used the free compliment of the day");
      return true;
    }
    if (wallet.compliments > 0) {
      setWallet((w) => ({ ...w, compliments: w.compliments - 1 }));
      if (__DEV__)
        console.log(
          `[wallet] used a bought compliment · ${wallet.compliments - 1} left`,
        );
      return true;
    }
    return false;
  }, [wallet.freeComplimentDay, wallet.compliments]);

  const addCompliments = useCallback((qty: number) => {
    setWallet((w) => ({ ...w, compliments: w.compliments + qty }));
    if (__DEV__) console.log(`[wallet] +${qty} compliments (demo purchase)`);
  }, []);

  const addBoosts = useCallback(
    (qty: number, startOne: boolean) => {
      const active = (wallet.boostEndsAt ?? 0) > Date.now();
      const endsAt = Date.now() + BOOST_MS;
      setWallet((w) => {
        if (startOne && !active)
          return { ...w, boosts: w.boosts + qty - 1, boostEndsAt: endsAt };
        return { ...w, boosts: w.boosts + qty };
      });
      if (startOne) setTimeout(() => playSound("boost"), 700); // after the payment sound
      if (startOne && !active) notifyBoost(endsAt);
      if (__DEV__)
        console.log(
          `[boost] +${qty} boosts (demo purchase) · start now=${startOne}`,
        );
    },
    [wallet.boostEndsAt],
  );

  const startBoost = useCallback(() => {
    const active = (wallet.boostEndsAt ?? 0) > Date.now();
    if (active || wallet.boosts <= 0) return false;
    const endsAt = Date.now() + BOOST_MS;
    setWallet((w) => ({ ...w, boosts: w.boosts - 1, boostEndsAt: endsAt }));
    playSound("boost");
    notifyBoost(endsAt);
    if (__DEV__)
      console.log(
        `[boost] started for ${BOOST_HOURS}h · ${wallet.boosts - 1} left`,
      );
    return true;
  }, [wallet.boostEndsAt, wallet.boosts]);

  const update = useCallback(
    (patch: Partial<Wallet>) => setWallet((w) => ({ ...w, ...patch })),
    [],
  );

  const recordPurchase = useCallback((title: string, total: number) => {
    const item: Purchase = {
      id: `pur_${Date.now().toString(36)}`,
      at: Date.now(),
      title,
      total,
    };
    setWallet((w) => ({
      ...w,
      purchases: [item, ...w.purchases].slice(0, 50),
    }));
    if (__DEV__) console.log(`[wallet] purchase saved · ${title} · ${total}`);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      wallet,
      freeComplimentLeft,
      complimentsLeft: wallet.compliments + (freeComplimentLeft ? 1 : 0),
      spendCompliment,
      addCompliments,
      addBoosts,
      startBoost,
      update,
      recordPurchase,
    }),
    [
      ready,
      wallet,
      freeComplimentLeft,
      spendCompliment,
      addCompliments,
      addBoosts,
      startBoost,
      update,
      recordPurchase,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

// Milliseconds left on the running boost (0 = no boost). Ticks every second while one is on.
export function useBoostLeft() {
  const { wallet } = useWallet();
  const endsAt = wallet.boostEndsAt ?? 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt <= Date.now()) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endsAt) {
        clearInterval(timer);
        if (__DEV__) console.log("[boost] ended");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return Math.max(0, endsAt - now);
}

// 2:59:41
export function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatUsd(amount: number) {
  return `USD ${amount.toFixed(2)}`;
}
