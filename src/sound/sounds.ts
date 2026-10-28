import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import { useSyncExternalStore } from "react";

// Short UI sounds (original, made for Yonder): only for big moments — a match, a boost starting
// and a payment. Swipes are silent (vibration only). They mix with the tester's music (never pause
// it) and can be turned off in Settings › Sounds.

export type SoundName = "match" | "boost" | "purchase";

const FILES: Record<SoundName, number> = {
  match: require("../../assets/sounds/match.wav"),
  boost: require("../../assets/sounds/boost.wav"),
  purchase: require("../../assets/sounds/purchase.wav"),
};

const VOLUME: Record<SoundName, number> = {
  match: 1,
  boost: 0.95,
  purchase: 0.95,
};

// 2 players per sound: playing it again quickly uses the other one instead of cutting / skipping.
const POOL = 2;

const KEY = "yonder.sounds"; // 'on' | 'off' (one setting for the whole phone)
let enabled = true;
const listeners = new Set<() => void>();
const players: Partial<Record<SoundName, AudioPlayer[]>> = {};
const nextIndex: Partial<Record<SoundName, number>> = {};
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

function poolFor(name: SoundName) {
  let list = players[name];
  if (!list) {
    list = Array.from({ length: POOL }, () => {
      const p = createAudioPlayer(FILES[name]);
      p.volume = VOLUME[name];
      return p;
    });
    players[name] = list;
  }
  return list;
}

// Load every sound when the Swipe page opens, so the first one is ready.
export function preloadSounds() {
  if (!modeSet) {
    modeSet = true;
    setAudioModeAsync({ interruptionMode: "mixWithOthers" }).catch((e) => {
      if (__DEV__) console.log("[sound] audio mode failed", String(e));
    });
    (Object.keys(FILES) as SoundName[]).forEach(poolFor);
    if (__DEV__) console.log("[sound] preloaded");
  }
}

function start(p: AudioPlayer) {
  // Back to the beginning first (a finished player stays at its end), THEN play.
  p.seekTo(0)
    .then(() => p.play())
    .catch(() => p.play());
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    const list = poolFor(name);
    const i = nextIndex[name] ?? 0;
    nextIndex[name] = (i + 1) % list.length;
    const p = list[i];
    if (p.isLoaded) {
      start(p);
    } else {
      // Not loaded yet (first seconds after opening the app): play as soon as it is.
      const sub = p.addListener("playbackStatusUpdate", (status) => {
        if (status.isLoaded) {
          sub.remove();
          start(p);
        }
      });
    }
    if (__DEV__)
      console.log(
        `[sound] ${name} · player ${i + 1}/${list.length} · loaded=${p.isLoaded}`,
      );
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
