import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

// App passcode (Settings › Passcode): 4 digits, one per account, kept in SecureStore
// (encrypted by Android). Asked when Yonder starts and when you come back after a minute away.

export const PASSCODE_LENGTH = 4;

// SecureStore keys may only contain letters, numbers, ".", "-" and "_".
const keyOf = (userId: string) => `yonder_passcode_${userId.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

// Whether the signed-in account has a passcode (so Settings shows the switch right away).
let current: { userId: string; on: boolean } = { userId: '', on: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function getPasscode(userId: string) {
  try {
    const code = await SecureStore.getItemAsync(keyOf(userId));
    current = { userId, on: Boolean(code) };
    emit();
    return code;
  } catch (e) {
    if (__DEV__) console.log('[passcode] read failed', String(e));
    return null;
  }
}

export async function setPasscode(userId: string, code: string) {
  await SecureStore.setItemAsync(keyOf(userId), code);
  current = { userId, on: true };
  emit();
  if (__DEV__) console.log('[passcode] set');
}

export async function clearPasscode(userId: string) {
  await SecureStore.deleteItemAsync(keyOf(userId)).catch(() => {});
  current = { userId, on: false };
  emit();
  if (__DEV__) console.log('[passcode] removed');
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function usePasscodeOn(userId: string) {
  const snap = useSyncExternalStore(subscribe, () => current, () => current);
  return snap.userId === userId && snap.on;
}

// Is the lock screen showing? The welcome notification waits until the app is open
// (it says how many people like you, so it never shows over the lock screen).
let lockOpen = false;
const openWaiters: (() => void)[] = [];

export function setLockOpen(open: boolean) {
  lockOpen = open;
  if (open) openWaiters.splice(0).forEach((w) => w());
}

export function waitUntilUnlocked(): Promise<void> {
  return lockOpen ? Promise.resolve() : new Promise((resolve) => openWaiters.push(resolve));
}
