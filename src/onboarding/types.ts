// The tester's own profile, filled in during onboarding.
// Saved on the phone per account (no server).

export type Gender = "man" | "woman";
export type Intent = "marriage" | "serious" | "friends" | "fun";
export type MaritalStatus = "never_married" | "divorced" | "widowed";
export type YesNo = "yes" | "no";
export type Frequency = "never" | "sometimes" | "often";

export type ProfileDraft = {
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
};
