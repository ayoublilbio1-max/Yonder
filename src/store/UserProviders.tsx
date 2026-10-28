import { type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { ChatProvider } from "../chat/ChatProvider";
import { SwipeProvider } from "../deck/SwipeProvider";
import { WalletProvider } from "./WalletProvider";

// Everything saved per account, available on every screen (tabs, a chat, settings…):
// wallet (demo purchases) → swipes (deck, matches) → chats.
// The key makes a fresh set for each account, and again once onboarding is finished
// (so the deck reads the new answers).
export function UserProviders({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "signed-out";
  const key = `${userId}:${session?.onboarded ? "ready" : "new"}`;

  return (
    <WalletProvider key={`w-${key}`} userId={userId}>
      <SwipeProvider key={`s-${key}`} userId={userId}>
        <ChatProvider key={`c-${key}`} userId={userId}>
          {children}
        </ChatProvider>
      </SwipeProvider>
    </WalletProvider>
  );
}
