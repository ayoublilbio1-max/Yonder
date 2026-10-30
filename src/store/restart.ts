import AsyncStorage from "@react-native-async-storage/async-storage";
import { cancelBoostEnd } from "../notify/notify";

// Settings › Restart the demo: a client can try everything again from the start.
// Cleared: swipes, matches, likes, favorites, blocked profiles, chats, compliments, boosts, Gold
// and purchases. Kept: the account, your profile and photos, passcode, filters, sort, privacy
// and every app setting (language, theme, units, sounds, notifications).
//
// While the data is cleared, the providers stop saving (else a late chat reply could write the
// old data back); UserProviders then mounts fresh providers, which read the empty data.

let paused = false;

export function savesPaused() {
  return paused;
}

export function resumeSaves() {
  paused = false;
}

export const deckKey = (userId: string) => `yonder.deck.${userId}`;
export const chatsKey = (userId: string) => `yonder.chats.${userId}`;
export const walletKey = (userId: string) => `yonder.wallet.${userId}`;

// deck settings that are choices, not demo progress
const KEEP = [
  "visibility",
  "shareLink",
  "blockedContacts",
  "sort",
  "filters",
] as const;

export async function clearDemoData(userId: string) {
  paused = true;
  try {
    const raw = await AsyncStorage.getItem(deckKey(userId));
    const old = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const kept: Record<string, unknown> = {};
    KEEP.forEach((k) => {
      if (old[k] !== undefined) kept[k] = old[k];
    });
    await AsyncStorage.setItem(deckKey(userId), JSON.stringify(kept));
    await AsyncStorage.multiRemove([chatsKey(userId), walletKey(userId)]);
    await cancelBoostEnd(); // a boost bought before the restart doesn't "end" later
    if (__DEV__)
      console.log(
        `[restart] demo data cleared · kept ${Object.keys(kept).join(", ") || "nothing"}`,
      );
  } catch (e) {
    if (__DEV__) console.log("[restart] failed", String(e));
  }
}
