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

// Demo purchases for one account, saved on the phone: compliments (1 free per day + packs),
// boosts and Gold (used from v0.8.1). Nothing is ever charged.
// Mount it with key={userId}.

type Wallet = {
  compliments: number; // bought, not used yet
  freeComplimentDay: string | null; // YYYY-MM-DD when the free one was used
  boosts: number;
  boostEndsAt: number | null;
  gold: boolean;
};

const EMPTY: Wallet = {
  compliments: 0,
  freeComplimentDay: null,
  boosts: 0,
  boostEndsAt: null,
  gold: false,
};
const walletKey = (userId: string) => `yonder.wallet.${userId}`;
const today = () => new Date().toISOString().slice(0, 10);

export const COMPLIMENT_PACKS = [
  { qty: 3, price: 2.99 },
  { qty: 10, price: 7.99, tag: "Popular" },
  { qty: 25, price: 14.99, tag: "Best value" },
];

type WalletContextValue = {
  ready: boolean;
  wallet: Wallet;
  freeComplimentLeft: boolean;
  complimentsLeft: number; // free + bought
  spendCompliment: () => boolean;
  addCompliments: (qty: number) => void;
  update: (patch: Partial<Wallet>) => void;
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
    if (!ready) return;
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

  const update = useCallback(
    (patch: Partial<Wallet>) => setWallet((w) => ({ ...w, ...patch })),
    [],
  );

  const value = useMemo(
    () => ({
      ready,
      wallet,
      freeComplimentLeft,
      complimentsLeft: wallet.compliments + (freeComplimentLeft ? 1 : 0),
      spendCompliment,
      addCompliments,
      update,
    }),
    [
      ready,
      wallet,
      freeComplimentLeft,
      spendCompliment,
      addCompliments,
      update,
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

export function formatUsd(amount: number) {
  return `USD ${amount.toFixed(2)}`;
}
