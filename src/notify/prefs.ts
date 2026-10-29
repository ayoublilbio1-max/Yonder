import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

// Which notifications Yonder may send (Settings › Notifications). One setting for the whole phone.

export type NotifyType =
  | "welcome"
  | "matches"
  | "messages"
  | "likes"
  | "boost"
  | "daily";

export type NotifyPrefs = {
  enabled: boolean; // main switch
  preview: boolean; // show the message text in a message notification
} & Record<NotifyType, boolean>;

export const DEFAULT_PREFS: NotifyPrefs = {
  enabled: true,
  preview: true,
  welcome: true,
  matches: true,
  messages: true,
  likes: true,
  boost: true,
  daily: true,
};

export const NOTIFY_ROWS: { key: NotifyType; title: string; text: string }[] = [
  { key: "matches", title: "New matches", text: "When you match with someone" },
  {
    key: "messages",
    title: "Messages",
    text: "New messages and photos from your matches",
  },
  {
    key: "likes",
    title: "Likes and super likes",
    text: "When someone likes or super likes you",
  },
  { key: "boost", title: "Boosts", text: "When your boost starts and ends" },
  {
    key: "welcome",
    title: "Welcome",
    text: "A hello each time you open Yonder",
  },
  {
    key: "daily",
    title: "Daily picks",
    text: "New people near you, once a day at 7 pm",
  },
];

const KEY = "yonder.notifyPrefs";
let prefs: NotifyPrefs = DEFAULT_PREFS;
let loaded = false;
const listeners = new Set<() => void>();
const loadedWaiters: (() => void)[] = [];

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw)
      prefs = {
        ...DEFAULT_PREFS,
        ...(JSON.parse(raw) as Partial<NotifyPrefs>),
      };
    if (__DEV__)
      console.log(`[notify] prefs loaded · ${prefs.enabled ? "on" : "off"}`);
  })
  .catch(() => {})
  .finally(() => {
    loaded = true;
    listeners.forEach((l) => l());
    loadedWaiters.splice(0).forEach((w) => w());
  });

export function getNotifyPrefs() {
  return prefs;
}

// Resolves once the saved settings have been read (the welcome notification waits for it).
export function notifyPrefsReady(): Promise<void> {
  return loaded
    ? Promise.resolve()
    : new Promise((resolve) => loadedWaiters.push(resolve));
}

export function setNotifyPrefs(patch: Partial<NotifyPrefs>) {
  prefs = { ...prefs, ...patch };
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => {});
  if (__DEV__) console.log("[notify] prefs", JSON.stringify(patch));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useNotifyPrefs(): NotifyPrefs {
  return useSyncExternalStore(
    subscribe,
    () => prefs,
    () => prefs,
  );
}
