// Who is signed in. Everything is saved on the phone only (no server).

export type AuthMethod = "google" | "google-demo" | "apple-demo" | "email";

export type AuthUser = {
  id: string;
  name: string; // can be '' for email accounts until onboarding asks for it
  email: string;
  photo: string | null;
  method: AuthMethod;
};

export type Session = {
  user: AuthUser;
  onboarded: boolean; // false → the onboarding screens are shown first
  signedInAt: number;
};

export const METHOD_LABEL: Record<AuthMethod, string> = {
  google: "Google",
  "google-demo": "Google (demo account)",
  "apple-demo": "Apple (demo)",
  email: "Email",
};

export function displayName(user: AuthUser) {
  return user.name.trim() || user.email.split("@")[0];
}
