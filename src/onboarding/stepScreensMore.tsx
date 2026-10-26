import { getLocales } from "expo-localization";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { useToast } from "../components/Toast";
import { fonts } from "../constants/fonts";
import { useTheme } from "../theme/ThemeProvider";
import { ChipGroup } from "./ChipGroup";
import { COUNTRIES_BY_NATIONALITY, flagOf } from "./countries";
import {
  INTEREST_GROUPS,
  MAX_INTERESTS,
  MAX_TRAITS,
  PERSONALITY_TRAITS,
} from "./interests";
import { useOnboarding } from "./OnboardingProvider";
import { OptionList } from "./OptionList";
import { BIO_MAX, EDUCATION_OPTIONS, PROFESSIONS } from "./options";
import { SearchList, type SearchItem } from "./SearchList";
import { StepLayout } from "./StepLayout";
import { useAdvance } from "./useAdvance";

// Part 2b questions (photos and phone are in their own files).

function SkipButton({ onPress }: { onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      style={styles.skip}
    >
      <AppText variant="body" weight="semibold" color={colors.textMuted}>
        Skip
      </AppText>
    </Pressable>
  );
}

// ───────────────────────── profession ─────────────────────────

const PROFESSION_ITEMS: SearchItem[] = PROFESSIONS.map((p) => ({
  key: p,
  label: p,
}));

export function ProfessionStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("profession");

  const choose = (label: string) => {
    update({ profession: label });
    advance();
  };

  return (
    <StepLayout
      stepId="profession"
      title="What’s your profession?"
      scroll={false}
    >
      <SearchList
        items={PROFESSION_ITEMS}
        selected={draft.profession ? [draft.profession] : []}
        onPress={choose}
        onCustom={(text) => choose(text.slice(0, 40))}
        customHint="Not in the list? Tap here and write your own."
        placeholder="Search or write your job"
      />
    </StepLayout>
  );
}

// ───────────────────────── education ─────────────────────────

export function EducationStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("education");
  return (
    <StepLayout stepId="education" title="What’s your education level?">
      <OptionList
        options={EDUCATION_OPTIONS}
        selected={draft.education}
        onSelect={(v) => {
          update({ education: v });
          advance();
        }}
      />
    </StepLayout>
  );
}

// ───────────────────────── nationality ─────────────────────────

const MAX_NATIONALITIES = 2;
const NATIONALITY_ITEMS: SearchItem[] = COUNTRIES_BY_NATIONALITY.map((c) => ({
  key: c.code,
  label: c.nationality,
  left: flagOf(c.code),
}));

export function NationalityStep() {
  const toast = useToast();
  const { draft, update } = useOnboarding();
  const advance = useAdvance("nationality");
  const [selected, setSelected] = useState<string[]>(draft.nationalities ?? []);

  // The phone's region (e.g. MA on a Moroccan phone) is suggested first.
  const suggested = useMemo(() => {
    const region = getLocales()[0]?.regionCode;
    return region ? [region.toUpperCase()] : [];
  }, []);

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      setSelected(selected.filter((c) => c !== code));
      return;
    }
    if (selected.length >= MAX_NATIONALITIES) {
      toast.show(`You can choose up to ${MAX_NATIONALITIES} nationalities.`);
      return;
    }
    setSelected([...selected, code]);
  };

  return (
    <StepLayout
      stepId="nationality"
      title="What’s your nationality?"
      subtitle="Choose up to two countries you’re a citizen of."
      scroll={false}
      footer={
        <AppButton
          label={selected.length ? `Confirm (${selected.length})` : "Confirm"}
          disabled={selected.length === 0}
          onPress={() => {
            update({ nationalities: selected });
            advance(0);
          }}
        />
      }
    >
      <SearchList
        items={NATIONALITY_ITEMS}
        selected={selected}
        onPress={toggle}
        multi
        suggested={suggested}
        placeholder="Search nationalities"
      />
    </StepLayout>
  );
}

// ───────────────────────── interests / personality ─────────────────────────

function useChipSelection(
  initial: string[] | undefined,
  max: number,
  noun: string,
) {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(initial ?? []);
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key));
      return;
    }
    if (selected.length >= max) {
      toast.show(`You can choose up to ${max} ${noun}.`);
      return;
    }
    setSelected([...selected, key]);
  };
  return { selected, toggle };
}

export function InterestsStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("interests");
  const { selected, toggle } = useChipSelection(
    draft.interests,
    MAX_INTERESTS,
    "interests",
  );

  return (
    <StepLayout
      stepId="interests"
      title="What are your interests?"
      subtitle={`Choose up to ${MAX_INTERESTS} to make your profile stand out.`}
      footer={
        <>
          <AppButton
            label={`Select (${selected.length}/${MAX_INTERESTS})`}
            disabled={selected.length === 0}
            onPress={() => {
              update({ interests: selected });
              advance(0);
            }}
          />
          <SkipButton
            onPress={() => {
              update({ interests: [] });
              advance(0);
            }}
          />
        </>
      }
    >
      <View style={styles.groups}>
        {INTEREST_GROUPS.map((g) => (
          <View key={g.title} style={styles.group}>
            <AppText variant="heading">{g.title}</AppText>
            <ChipGroup chips={g.chips} selected={selected} onToggle={toggle} />
          </View>
        ))}
      </View>
    </StepLayout>
  );
}

export function PersonalityStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("personality");
  const { selected, toggle } = useChipSelection(
    draft.personality,
    MAX_TRAITS,
    "traits",
  );

  return (
    <StepLayout
      stepId="personality"
      title="How would you describe your personality?"
      subtitle={`Choose up to ${MAX_TRAITS} traits.`}
      footer={
        <>
          <AppButton
            label={`Select (${selected.length}/${MAX_TRAITS})`}
            disabled={selected.length === 0}
            onPress={() => {
              update({ personality: selected });
              advance(0);
            }}
          />
          <SkipButton
            onPress={() => {
              update({ personality: [] });
              advance(0);
            }}
          />
        </>
      }
    >
      <ChipGroup
        chips={PERSONALITY_TRAITS}
        selected={selected}
        onToggle={toggle}
      />
    </StepLayout>
  );
}

// ───────────────────────── bio ─────────────────────────

export function BioStep() {
  const colors = useTheme();
  const { draft, update } = useOnboarding();
  const advance = useAdvance("bio");
  const [bio, setBio] = useState(draft.bio ?? "");
  const trimmed = bio.trim();

  return (
    <StepLayout
      stepId="bio"
      title="Write a short bio"
      subtitle="A few words about you, what you love and what you’re looking for."
      footer={
        <>
          <AppButton
            label="Add bio"
            disabled={trimmed.length < 10}
            onPress={() => {
              update({ bio: trimmed });
              advance(0);
            }}
          />
          <SkipButton
            onPress={() => {
              update({ bio: "" });
              advance(0);
            }}
          />
        </>
      }
    >
      <View
        style={[
          styles.bioBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TextInput
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
          placeholder="e.g. Coffee lover, weekend hiker, always planning the next trip."
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          multiline
          textAlignVertical="top"
          style={[
            styles.bioInput,
            { color: colors.text, fontFamily: fonts.regular },
          ]}
        />
      </View>
      <AppText variant="caption" muted align="right" style={styles.counter}>
        {bio.length}/{BIO_MAX}
        {trimmed.length > 0 && trimmed.length < 10
          ? " · at least 10 characters"
          : ""}
      </AppText>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  skip: {
    alignItems: "center",
    paddingVertical: 8,
  },
  groups: {
    gap: 24,
  },
  group: {
    gap: 12,
  },
  bioBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    minHeight: 160,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bioInput: {
    flex: 1,
    minHeight: 140,
    fontSize: 16,
    lineHeight: 22,
  },
  counter: {
    marginTop: 6,
  },
});
