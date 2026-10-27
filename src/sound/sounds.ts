import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createAudioPlayer,
    setAudioModeAsync,
    type AudioPlayer,
} from "expo-audio";
import { useSyncExternalStore } from "react";

// Short UI sounds (original, made for Yonder): swipe, match, boost, compliment, payment.
// They mix with the tester's music (never pause it) and can be turned off in Settings › Sounds.

export type SoundName =
  | "like"
  | "nope"
  | "superlike"
  | "match"
  | "boost"
  | "compliment"
  | "purchase";

const FILES: Record<SoundName, number> = {
  like: require("../../assets/sounds/like.wav"),
  nope: require("../../assets/sounds/nope.wav"),
  superlike: require("../../assets/sounds/superlike.wav"),
  match: require("../../assets/sounds/match.wav"),
  boost: require("../../assets/sounds/boost.wav"),
  compliment: require("../../assets/sounds/compliment.wav"),
  purchase: require("../../assets/sounds/purchase.wav"),
};

const VOLUME: Record<SoundName, number> = {
  like: 0.5,
  nope: 0.45,
  superlike: 0.6,
  match: 0.8,
  boost: 0.7,
  compliment: 0.6,
  purchase: 0.7,
};

const KEY = "yonder.sounds"; // 'on' | 'off' (one setting for the whole phone)
let enabled = true;
const listeners = new Set<() => void>();
const players: Partial<Record<SoundName, AudioPlayer>> = {};
let modeSet = false;

AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v === "off") {
      enabled = false;
      listeners.forEach((l) => l());
    }
    if (__DEV__) console.log(`[sound] loaded · ${enabled ? "on" : "off"}`);
  })
  .catch(() => {});

function playerFor(name: SoundName) {
  let p = players[name];
  if (!p) {
    p = createAudioPlayer(FILES[name]);
    p.volume = VOLUME[name];
    players[name] = p;
  }
  return p;
}

// Load the swipe sounds early so the first like plays without a delay.
export function preloadSounds() {
  if (!modeSet) {
    modeSet = true;
    setAudioModeAsync({ interruptionMode: "mixWithOthers" }).catch((e) => {
      if (__DEV__) console.log("[sound] audio mode failed", String(e));
    });
  }
  (["like", "nope", "superlike"] as SoundName[]).forEach(playerFor);
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    const p = playerFor(name);
    p.seekTo(0)
      .then(() => p.play())
      .catch(() => p.play());
    if (__DEV__) console.log(`[sound] ${name}`);
  } catch (e) {
    if (__DEV__) console.log(`[sound] ${name} failed`, String(e));
  }
}

export function setSoundsEnabled(on: boolean) {
  enabled = on;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, on ? "on" : "off").catch(() => {});
  if (__DEV__) console.log(`[sound] now ${on ? "on" : "off"}`);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSoundsEnabled() {
  return useSyncExternalStore(subscribe, () => enabled);
}
