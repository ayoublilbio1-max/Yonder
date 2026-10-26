import {
    GoogleSignin,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "../constants/app";
import type { AuthUser } from "./types";

// Real Google sign-in (free "original" API).
// If it fails for any reason, the welcome screen opens the demo account chooser instead.

export type GoogleResult =
  | { kind: "success"; user: AuthUser }
  | { kind: "cancelled" }
  | { kind: "failed"; reason: string };

type GoogleUserFields = {
  id?: string;
  name?: string | null;
  givenName?: string | null;
  email?: string;
  photo?: string | null;
};

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  configured = true;
  if (__DEV__) console.log("[google] configured");
}

const CANCEL_CODES = [
  statusCodes?.SIGN_IN_CANCELLED,
  statusCodes?.IN_PROGRESS,
  "12501",
].filter(Boolean);

export async function signInWithGoogle(): Promise<GoogleResult> {
  const t0 = Date.now();
  try {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = (await GoogleSignin.signIn()) as unknown as {
      type?: string;
      data?: { user?: GoogleUserFields } | null;
      user?: GoogleUserFields;
    };

    if (response?.type === "cancelled") {
      if (__DEV__) console.log(`[google] cancelled after ${Date.now() - t0}ms`);
      return { kind: "cancelled" };
    }

    // v13+ returns { type: 'success', data: { user } }; older versions return { user } directly.
    const g = response?.data?.user ?? response?.user;
    if (!g?.email) {
      if (__DEV__)
        console.log("[google] no user in response", JSON.stringify(response));
      return { kind: "failed", reason: "Google returned no account." };
    }

    const user: AuthUser = {
      id: `google_${g.id ?? g.email}`,
      name: g.name ?? g.givenName ?? "",
      email: g.email,
      photo: g.photo ?? null,
      method: "google",
    };
    if (__DEV__)
      console.log(
        `[google] signed in as ${user.email} in ${Date.now() - t0}ms`,
      );
    return { kind: "success", user };
  } catch (e) {
    const err = e as { code?: string | number; message?: string };
    const code = err?.code != null ? String(err.code) : "";
    if (CANCEL_CODES.includes(code)) {
      if (__DEV__) console.log(`[google] cancelled (code ${code})`);
      return { kind: "cancelled" };
    }
    if (__DEV__)
      console.log(
        `[google] failed code=${code} message=${err?.message ?? String(e)}`,
      );
    return {
      kind: "failed",
      reason: code
        ? `Google error ${code}`
        : "Google sign-in is not available.",
    };
  }
}

export async function signOutOfGoogle() {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
    if (__DEV__) console.log("[google] signed out");
  } catch (e) {
    if (__DEV__) console.log("[google] sign out failed", String(e));
  }
}
