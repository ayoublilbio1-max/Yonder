import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, type ComponentType } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { AppTextInput } from "../components/AppTextInput";
import { useTheme } from "../theme/ThemeProvider";
import { useOnboarding } from "./OnboardingProvider";
import { OptionCards, OptionList } from "./OptionList";
import {
  CHILDREN_OPTIONS,
  cmToFeet,
  DRINKING_OPTIONS,
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  INTENT_OPTIONS,
  MARITAL_OPTIONS,
  MONTHS,
  RELIGION_OPTIONS,
  SMOKING_OPTIONS,
} from "./options";
import { PhoneStep } from "./PhoneStep";
import { PhotosStep } from "./PhotosStep";
import { StepLayout } from "./StepLayout";
import type { StepId } from "./steps";
import {
  BioStep,
  EducationStep,
  InterestsStep,
  NationalityStep,
  PersonalityStep,
  ProfessionStep,
} from "./stepScreensMore";
import type { Gender } from "./types";
import { useAdvance } from "./useAdvance";
import { WheelColumn } from "./WheelColumn";

// ───────────────────────── gender ─────────────────────────

function GenderStep() {
  const colors = useTheme();
  const { draft, update } = useOnboarding();
  const advance = useAdvance("gender");

  const choices: {
    value: Gender;
    label: string;
    icon: "man-outline" | "woman-outline";
  }[] = [
    { value: "man", label: "I’m a man", icon: "man-outline" },
    { value: "woman", label: "I’m a woman", icon: "woman-outline" },
  ];

  return (
    <StepLayout
      stepId="gender"
      title="Are you a man or a woman?"
      subtitle="We’ll show you people who are looking for you."
    >
      <View style={styles.genderRow}>
        {choices.map((c) => {
          const selected = draft.gender === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => {
                update({ gender: c.value });
                advance();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.genderCard,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.genderIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Ionicons name={c.icon} size={44} color={colors.primary} />
              </View>
              <AppText variant="body" weight="semibold">
                {c.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </StepLayout>
  );
}

// ───────────────────────── name ─────────────────────────

// Letters (including accents like é, ü, ñ), spaces, apostrophes and hyphens.
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ '’-]*$/;

function NameStep() {
  const { session } = useAuth();
  const { draft, update } = useOnboarding();
  const advance = useAdvance("name");
  const fromAccount = session?.user.name.trim().split(/\s+/)[0] ?? "";
  const [name, setName] = useState(draft.firstName ?? fromAccount);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) return setError("Enter at least 2 letters.");
    if (!NAME_PATTERN.test(clean)) return setError("Use letters only.");
    setError(null);
    update({ firstName: clean });
    advance(0);
  };

  return (
    <StepLayout
      stepId="name"
      title="What’s your first name?"
      subtitle="This is how it appears on your profile."
      footer={
        <AppButton
          label="Continue"
          onPress={submit}
          disabled={name.trim().length < 2}
        />
      }
    >
      <AppTextInput
        label="First name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          if (error) setError(null);
        }}
        placeholder="Your first name"
        autoCapitalize="words"
        autoComplete="given-name"
        maxLength={30}
        returnKeyType="done"
        onSubmitEditing={submit}
        error={error}
      />
    </StepLayout>
  );
}

// ───────────────────────── birthday ─────────────────────────

const MIN_AGE = 18;
const MAX_AGE = 99;

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function ageOn(year: number, monthIndex: number, day: number, now: Date) {
  let age = now.getFullYear() - year;
  if (
    now.getMonth() < monthIndex ||
    (now.getMonth() === monthIndex && now.getDate() < day)
  )
    age -= 1;
  return age;
}

function BirthdayStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("birthday");
  const colors = useTheme();

  const now = new Date();
  const thisYear = now.getFullYear();
  const years = Array.from(
    { length: MAX_AGE - MIN_AGE + 1 },
    (_, i) => thisYear - MAX_AGE + i,
  );

  const saved = draft.birthday?.split("-").map(Number);
  const [year, setYear] = useState(saved?.[0] ?? thisYear - 25);
  const [month, setMonth] = useState(saved ? saved[1] - 1 : 5);
  const [day, setDay] = useState(saved?.[2] ?? 15);

  const days = daysInMonth(year, month);
  const safeDay = Math.min(day, days);
  const age = ageOn(year, month, safeDay, now);
  const tooYoung = age < MIN_AGE;

  const submit = () => {
    if (tooYoung) return;
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    if (__DEV__) console.log(`[onboarding] birthday ${iso} · age ${age}`);
    update({ birthday: iso });
    advance(0);
  };

  return (
    <StepLayout
      stepId="birthday"
      title="When were you born?"
      subtitle="Only your age is shown on your profile."
      footer={
        <AppButton label="Continue" onPress={submit} disabled={tooYoung} />
      }
    >
      <View style={styles.wheels}>
        <WheelColumn
          label="Month"
          width={92}
          items={MONTHS}
          index={month}
          onChange={setMonth}
        />
        <WheelColumn
          key={`days-${days}`}
          label="Day"
          width={72}
          items={Array.from({ length: days }, (_, i) => String(i + 1))}
          index={safeDay - 1}
          onChange={(i) => setDay(i + 1)}
        />
        <WheelColumn
          label="Year"
          width={92}
          items={years.map(String)}
          index={Math.max(0, years.indexOf(year))}
          onChange={(i) => setYear(years[i])}
        />
      </View>
      <AppText
        variant="body"
        weight="medium"
        align="center"
        color={tooYoung ? colors.danger : colors.textMuted}
      >
        {tooYoung
          ? `You must be ${MIN_AGE} or older to use Yonder.`
          : `You’re ${age}`}
      </AppText>
    </StepLayout>
  );
}

// ───────────────────────── single-choice lists ─────────────────────────

function IntentStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("intent");
  return (
    <StepLayout
      stepId="intent"
      title="What brings you to Yonder?"
      subtitle="We’ll show you people who want the same."
    >
      <OptionCards
        options={INTENT_OPTIONS}
        selected={draft.intent}
        onSelect={(v) => {
          update({ intent: v });
          advance();
        }}
      />
    </StepLayout>
  );
}

function MaritalStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("marital");
  return (
    <StepLayout stepId="marital" title="What’s your marital status?">
      <OptionList
        options={MARITAL_OPTIONS}
        selected={draft.maritalStatus}
        onSelect={(v) => {
          update({ maritalStatus: v });
          advance();
        }}
      />
    </StepLayout>
  );
}

function ChildrenStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("children");
  return (
    <StepLayout stepId="children" title="Do you have children?">
      <OptionList
        options={CHILDREN_OPTIONS}
        selected={draft.hasChildren}
        onSelect={(v) => {
          update({ hasChildren: v });
          advance();
        }}
      />
    </StepLayout>
  );
}

function SmokingStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("smoking");
  return (
    <StepLayout stepId="smoking" title="Do you smoke?">
      <OptionList
        options={SMOKING_OPTIONS}
        selected={draft.smoking}
        onSelect={(v) => {
          update({ smoking: v });
          advance();
        }}
      />
    </StepLayout>
  );
}

function DrinkingStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("drinking");
  return (
    <StepLayout stepId="drinking" title="Do you drink alcohol?">
      <OptionList
        options={DRINKING_OPTIONS}
        selected={draft.drinking}
        onSelect={(v) => {
          update({ drinking: v });
          advance();
        }}
      />
    </StepLayout>
  );
}

function ReligionStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("religion");
  return (
    <StepLayout
      stepId="religion"
      title="What’s your religion?"
      subtitle="Optional. You can skip this question."
      footer={
        <AppButton
          label="Skip"
          variant="secondary"
          onPress={() => {
            update({ religion: "prefer_not" });
            advance(0);
          }}
        />
      }
    >
      <OptionList
        options={RELIGION_OPTIONS}
        selected={draft.religion}
        onSelect={(v) => {
          update({ religion: v });
          advance();
        }}
      />
    </StepLayout>
  );
}

// ───────────────────────── height ─────────────────────────

const HEIGHT_ROW = 58;
const HEIGHTS = Array.from(
  { length: HEIGHT_MAX_CM - HEIGHT_MIN_CM + 1 },
  (_, i) => HEIGHT_MIN_CM + i,
);

function HeightStep() {
  const colors = useTheme();
  const { draft, update } = useOnboarding();
  const advance = useAdvance("height");

  const start = draft.heightCm ?? (draft.gender === "man" ? 178 : 165);
  const startIndex = Math.max(0, HEIGHTS.indexOf(start) - 3);

  return (
    <StepLayout stepId="height" title="How tall are you?" scroll={false}>
      <FlatList
        data={HEIGHTS}
        keyExtractor={(cm) => String(cm)}
        initialScrollIndex={startIndex}
        getItemLayout={(_, index) => ({
          length: HEIGHT_ROW,
          offset: HEIGHT_ROW * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: cm }) => {
          const selected = draft.heightCm === cm;
          return (
            <Pressable
              onPress={() => {
                update({ heightCm: cm });
                advance();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.heightRow,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <AppText
                variant="body"
                weight={selected ? "bold" : "semibold"}
                color={selected ? colors.primary : colors.text}
              >
                {cm} cm{" "}
                <AppText
                  variant="body"
                  color={selected ? colors.primary : colors.textSubtle}
                >
                  ·
                </AppText>{" "}
                {cmToFeet(cm)}
              </AppText>
              {selected ? (
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        }}
      />
    </StepLayout>
  );
}

// ───────────────────────── map ─────────────────────────

export const STEP_SCREENS: Record<StepId, ComponentType> = {
  gender: GenderStep,
  name: NameStep,
  birthday: BirthdayStep,
  intent: IntentStep,
  marital: MaritalStep,
  children: ChildrenStep,
  height: HeightStep,
  smoking: SmokingStep,
  drinking: DrinkingStep,
  religion: ReligionStep,
  profession: ProfessionStep,
  education: EducationStep,
  nationality: NationalityStep,
  interests: InterestsStep,
  personality: PersonalityStep,
  bio: BioStep,
  photos: PhotosStep,
  phone: PhoneStep,
};

const styles = StyleSheet.create({
  genderRow: {
    flexDirection: "row",
    gap: 14,
  },
  genderCard: {
    flex: 1,
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 26,
  },
  genderIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  wheels: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  heightRow: {
    height: HEIGHT_ROW,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
