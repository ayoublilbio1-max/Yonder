import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { ChatProvider } from "../chat/ChatProvider";
import { useToast } from "../components/Toast";
import { SwipeProvider } from "../deck/SwipeProvider";
import { tr } from "../i18n/i18n";
import { clearDemoData, resumeSaves } from "./restart";
import { WalletProvider } from "./WalletProvider";

// Everything saved per account, available on every screen (tabs, a chat, settings…):
// wallet (demo purchases) → swipes (deck, matches) → chats.
// The key makes a fresh set for each account, again once onboarding is finished
// (so the deck reads the new answers), and again after Settings › Restart the demo.

const RestartContext = createContext<() => Promise<void>>(async () => {});

// Settings › Restart the demo (see store/restart.ts for what is cleared and kept).
export function useRestartDemo() {
  return useContext(RestartContext);
}

export function UserProviders({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const toast = useToast();
  const [round, setRound] = useState(0);
  const userId = session?.user.id ?? "signed-out";
  const onboarded = Boolean(session?.onboarded);
  const key = `${userId}:${onboarded ? "ready" : "new"}:${round}`;

  const restart = useCallback(async () => {
    if (!onboarded) return;
    await clearDemoData(userId);
    setRound((r) => r + 1); // fresh providers (and screens) read the cleared data
    toast.show(tr("Demo restarted. Everything is new again ✨"));
  }, [onboarded, userId, toast]);

  // The fresh providers are mounted: saving is allowed again.
  useEffect(() => {
    resumeSaves();
    if (__DEV__ && round > 0)
      console.log(`[restart] fresh providers · round ${round}`);
  }, [round]);

  return (
    <RestartContext.Provider value={restart}>
      <WalletProvider key={`w-${key}`} userId={userId}>
        <SwipeProvider key={`s-${key}`} userId={userId}>
          <ChatProvider key={`c-${key}`} userId={userId}>
            {children}
          </ChatProvider>
        </SwipeProvider>
      </WalletProvider>
    </RestartContext.Provider>
  );
}
