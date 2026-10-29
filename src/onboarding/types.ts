// The tester's own profile, filled in during onboarding.
// Saved on the phone per account (no server).

export type Gender = "man" | "woman";
export type Intent = "marriage" | "serious" | "friends" | "fun";
export type MaritalStatus = "never_married" | "divorced" | "widowed";
export type YesNo = "yes" | "no";
export type Frequency = "never" | "sometimes" | "often";
export type Education =
  | "high_school"
  | "vocational"
  | "bachelor"
  | "master"
  | "doctorate"
  | "other";

export type ProfileDraft = {
  // part 2a
  gender?: Gender;
  firstName?: string;
  birthday?: string; // YYYY-MM-DD
  intent?: Intent;
  maritalStatus?: MaritalStatus;
  hasChildren?: YesNo;
  heightCm?: number;
  smoking?: Frequency;
  drinking?: Frequency;
  religion?: string; // 'prefer_not' when skipped
  // part 2b
  profession?: string;
  education?: Education;
  nationalities?: string[]; // ISO country codes, max 2
  interests?: string[]; // [] when skipped
  personality?: string[]; // [] when skipped
  bio?: string; // '' when skipped
  photos?: string[]; // local file URIs, first = main photo
  phone?: string; // +212612345678
  phoneVerified?: boolean;
  // Profile tab (v0.15.0)
  photoVerified?: boolean; // blue check after the (simulated) selfie check
};
