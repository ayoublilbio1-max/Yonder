import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from './types';
import { tr } from '../i18n/i18n';

// Simulated email accounts, saved on this phone only.
// The list lives in AsyncStorage; each password is kept in SecureStore (encrypted by Android).

const ACCOUNTS_KEY = 'yonder.emailAccounts';

type EmailAccount = { id: string; email: string; createdAt: number };

export type EmailResult =
  | { ok: true; user: AuthUser }
  | { ok: false; field: 'email' | 'password'; error: string };

export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// null = the password is OK
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return tr('Use at least 8 characters.');
  if (!/[a-zA-Z]/.test(password)) return tr('Add at least one letter.');
  if (!/[0-9]/.test(password)) return tr('Add at least one number.');
  return null;
}

// SecureStore keys may only contain letters, numbers, ".", "-" and "_".
function passwordKey(email: string) {
  return `yonder_pw_${email.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

async function loadAccounts(): Promise<EmailAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as EmailAccount[]) : [];
  } catch (e) {
    if (__DEV__) console.log('[email] load accounts failed', String(e));
    return [];
  }
}

function toUser(account: EmailAccount): AuthUser {
  return { id: account.id, name: '', email: account.email, photo: null, method: 'email' };
}

export async function signUpWithEmail(rawEmail: string, password: string): Promise<EmailResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return { ok: false, field: 'email', error: tr('Enter a valid email address.') };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, field: 'password', error: problem };

  const accounts = await loadAccounts();
  if (accounts.some((a) => a.email === email)) {
    return { ok: false, field: 'email', error: tr('An account with this email already exists. Log in instead.') };
  }

  const account: EmailAccount = { id: `email_${Date.now().toString(36)}`, email, createdAt: Date.now() };
  await SecureStore.setItemAsync(passwordKey(email), password);
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  if (__DEV__) console.log(`[email] signed up ${email} (${accounts.length + 1} accounts on this phone)`);
  return { ok: true, user: toUser(account) };
}

export async function logInWithEmail(rawEmail: string, password: string): Promise<EmailResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return { ok: false, field: 'email', error: tr('Enter a valid email address.') };
  if (!password) return { ok: false, field: 'password', error: tr('Enter your password.') };

  const accounts = await loadAccounts();
  const account = accounts.find((a) => a.email === email);
  if (!account) return { ok: false, field: 'email', error: tr('No account with this email. Sign up first.') };

  const saved = await SecureStore.getItemAsync(passwordKey(email));
  if (saved !== password) {
    if (__DEV__) console.log(`[email] wrong password for ${email}`);
    return { ok: false, field: 'password', error: tr('Wrong password. Try again.') };
  }
  if (__DEV__) console.log(`[email] logged in ${email}`);
  return { ok: true, user: toUser(account) };
}

// Settings › Delete my Yonder profile: the email account and its password are removed from this phone.
export async function deleteEmailAccount(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const accounts = await loadAccounts();
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.filter((a) => a.email !== email))).catch(() => {});
  await SecureStore.deleteItemAsync(passwordKey(email)).catch(() => {});
  if (__DEV__) console.log(`[email] deleted ${email}`);
}
