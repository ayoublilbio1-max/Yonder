import Ionicons from "@expo/vector-icons/Ionicons";
import { getLocales } from "expo-localization";
import { useMemo, useState, type ReactNode } from "react";
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { PressableScale } from "../components/PressableScale";
import { Sheet } from "../components/Sheet";
import { fonts } from "../constants/fonts";
import { DURATION, EASE_OUT } from "../motion/ease";
import { ChipGroup } from "../onboarding/ChipGroup";
import { COUNTRIES_BY_NATIONALITY, flagOf } from "../onboarding/countries";
import {
    INTEREST_GROUPS,
    MAX_INTERESTS,
    MAX_TRAITS,
    PERSONALITY_TRAITS,
} from "../onboarding/interests";
import { OptionCards, OptionList } from "../onboarding/OptionList";
import {
    BIO_MAX,
    cmToFeet,
    DRINKING_OPTIONS,
    EDUCATION_OPTIONS,
    HEIGHT_MAX_CM,
    HEIGHT_MIN_CM,
    INTENT_OPTIONS,
    MARITAL_OPTIONS,
    PROFESSIONS,
    RELIGION_OPTIONS,
    SMOKING_OPTIONS,
    type Option,
} from "../onboarding/options";
import { SearchList, type SearchItem } from "../onboarding/SearchList";
import type { ProfileDraft } from "../onboarding/types";
import { useTheme } from "../theme/ThemeProvider";
import { FIELDS, type FieldKey } from "./myProfile";

// Edits one part of your profile (opened from a row on the Edit tab).
// One choice → a sheet that saves when you tap an answer.
// Lists, chips and text → a full page with Save at the top (the keyboard never covers it).

type Props = {
  field: FieldKey | null; // null = closed
  me: ProfileDraft;
  onSave: (patch: Partial<ProfileDraft>) => void;
  onClose: () => void;
};

const SHEET_OPTIONS: Partial<Record<FieldKey, Option<string>[]>> = {
  maritalStatus: MARITAL_OPTIONS,
  hasChildren: [
    { value: "yes", label: "I have children" },
    { value: "no", label: "I don’t have children" },
  ],
  smoking: SMOKING_OPTIONS,
  drinking: DRINKING_OPTIONS,
  religion: RELIGION_OPTIONS,
  education: EDUCATION_OPTIONS,
};

export function FieldEditor({ field, me, onSave, onClose }: Props) {
  const sheetOptions = field ? SHEET_OPTIONS[field] : undefined;
  const isIntent = field === "intent";
  const isPage = field !== null && !sheetOptions && !isIntent;

  const save = (patch: Partial<ProfileDraft>) => {
    onSave(patch);
    onClose();
  };

  return (
    <>
      <Sheet visible={Boolean(sheetOptions) || isIntent} onClose={onClose}>
        {field && (sheetOptions || isIntent) ? (
          <>
            <AppText variant="heading" align="center">
              {FIELDS[field].title}
            </AppText>
            <ScrollView
              style={styles.sheetList}
              showsVerticalScrollIndicator={false}
            >
              {isIntent ? (
                <OptionCards
                  options={INTENT_OPTIONS}
                  selected={me.intent}
                  onSelect={(v) => save({ intent: v })}
                />
              ) : sheetOptions ? (
                <OptionList
                  options={sheetOptions}
                  selected={me[field] as string | undefined}
                  onSelect={(v) =>
                    save({ [field]: v } as unknown as Partial<ProfileDraft>)
                  }
                />
              ) : null}
            </ScrollView>
          </>
        ) : null}
      </Sheet>

      <Modal
        visible={isPage}
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
        navigationBarTranslucent
      >
        {field && isPage ? (
          <EditPage
            key={field}
            field={field}
            me={me}
            onSave={save}
            onClose={onClose}
          />
        ) : null}
      </Modal>
    </>
  );
}

// ---------- full-page editors ----------

const NAME_PATTERN = /^[\p{L}' -]+$/u;
const HEIGHT_ROW = 58;
const HEIGHTS = Array.from(
  { length: HEIGHT_MAX_CM - HEIGHT_MIN_CM + 1 },
  (_, i) => HEIGHT_MIN_CM + i,
);
const PROFESSION_ITEMS: SearchItem[] = PROFESSIONS.map((p) => ({
  key: p,
  label: p,
}));
const MAX_NATIONALITIES = 2;
const NATIONALITY_ITEMS: SearchItem[] = COUNTRIES_BY_NATIONALITY.map((c) => ({
  key: c.code,
  label: c.nationality,
  left: flagOf(c.code),
}));

function EditPage({
  field,
  me,
  onSave,
  onClose,
}: {
  field: FieldKey;
  me: ProfileDraft;
  onSave: (patch: Partial<ProfileDraft>) => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(me.firstName ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [chips, setChips] = useState<string[]>(
    field === "interests" ? (me.interests ?? []) : (me.personality ?? []),
  );
  const [nations, setNations] = useState<string[]>(me.nationalities ?? []);
  const [limitHit, setLimitHit] = useState(false);

  const suggested = useMemo(() => {
    const region = getLocales()[0]?.regionCode;
    return region ? [region.toUpperCase()] : [];
  }, []);

  const cleanName = name.trim().replace(/\s+/g, " ");
  const nameOk = cleanName.length >= 2 && NAME_PATTERN.test(cleanName);
  const cleanBio = bio.trim();
  const bioOk = cleanBio.length === 0 || cleanBio.length >= 10;
  const max = field === "interests" ? MAX_INTERESTS : MAX_TRAITS;

  const toggleChip = (key: string) => {
    if (chips.includes(key)) {
      setChips(chips.filter((k) => k !== key));
      setLimitHit(false);
    } else if (chips.length >= max) {
      setLimitHit(true);
    } else {
      setChips([...chips, key]);
    }
  };
  const toggleNation = (code: string) => {
    if (nations.includes(code)) {
      setNations(nations.filter((c) => c !== code));
      setLimitHit(false);
    } else if (nations.length >= MAX_NATIONALITIES) {
      setLimitHit(true);
    } else {
      setNations([...nations, code]);
    }
  };

  // Save button (top right) for the pages that need one.
  let saveAction: (() => void) | null = null;
  let canSave = true;
  if (field === "firstName") {
    canSave = nameOk && cleanName !== me.firstName;
    saveAction = () => onSave({ firstName: cleanName });
  } else if (field === "bio") {
    canSave = bioOk && cleanBio !== (me.bio ?? "");
    saveAction = () => onSave({ bio: cleanBio });
  } else if (field === "interests" || field === "personality") {
    saveAction = () =>
      onSave(
        field === "interests" ? { interests: chips } : { personality: chips },
      );
  } else if (field === "nationalities") {
    canSave = nations.length > 0;
    saveAction = () => onSave({ nationalities: nations });
  }

  let body: ReactNode = null;
  if (field === "firstName") {
    body = (
      <View style={styles.pad}>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: colors.surface,
              borderColor: nameOk || !name ? colors.border : colors.danger,
            },
          ]}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={30}
            placeholder="Your first name"
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            style={[
              styles.input,
              { color: colors.text, fontFamily: fonts.regular },
            ]}
          />
        </View>
        <AppText
          variant="caption"
          color={nameOk || !name ? colors.textMuted : colors.danger}
        >
          {nameOk || !name
            ? "This is how it appears on your profile."
            : "Use at least 2 letters, letters only."}
        </AppText>
      </View>
    );
  } else if (field === "bio") {
    body = (
      <View style={styles.pad}>
        <View
          style={[
            styles.bioBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
            autoFocus
            multiline
            textAlignVertical="top"
            placeholder="e.g. Coffee lover, weekend hiker, always planning the next trip."
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            style={[
              styles.bioInput,
              { color: colors.text, fontFamily: fonts.regular },
            ]}
          />
        </View>
        <AppText variant="caption" muted align="right">
          {bio.length}/{BIO_MAX}
          {!bioOk ? " · at least 10 characters" : ""}
        </AppText>
      </View>
    );
  } else if (field === "heightCm") {
    const start = me.heightCm ?? (me.gender === "man" ? 178 : 165);
    body = (
      <FlatList
        data={HEIGHTS}
        keyExtractor={(cm) => String(cm)}
        initialScrollIndex={Math.max(0, HEIGHTS.indexOf(start) - 3)}
        getItemLayout={(_, index) => ({
          length: HEIGHT_ROW,
          offset: HEIGHT_ROW * index,
          index,
        })}
        contentContainerStyle={[
          styles.padH,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: cm }) => {
          const selected = me.heightCm === cm;
          return (
            <PressableScale
              onPress={() => onSave({ heightCm: cm })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              scaleTo={0.99}
              dimTo={0.6}
              style={styles.heightRow}
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
            </PressableScale>
          );
        }}
      />
    );
  } else if (field === "profession") {
    body = (
      <View style={[styles.flex, styles.padH]}>
        <SearchList
          items={PROFESSION_ITEMS}
          selected={me.profession ? [me.profession] : []}
          onPress={(label) => onSave({ profession: label })}
          onCustom={(text) => onSave({ profession: text.slice(0, 40) })}
          customHint="Not in the list? Tap here and write your own."
          placeholder="Search or write your job"
        />
      </View>
    );
  } else if (field === "nationalities") {
    body = (
      <View style={[styles.flex, styles.padH]}>
        <AppText
          variant="bodySmall"
          color={limitHit ? colors.danger : colors.textMuted}
          style={styles.note}
        >
          {limitHit
            ? `You can choose up to ${MAX_NATIONALITIES}. Remove one first.`
            : `Choose up to ${MAX_NATIONALITIES} countries you’re a citizen of.`}
        </AppText>
        <SearchList
          items={NATIONALITY_ITEMS}
          selected={nations}
          onPress={toggleNation}
          multi
          suggested={suggested}
          placeholder="Search nationalities"
        />
      </View>
    );
  } else if (field === "interests" || field === "personality") {
    body = (
      <ScrollView
        contentContainerStyle={[
          styles.pad,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppText
          variant="bodySmall"
          color={limitHit ? colors.danger : colors.textMuted}
        >
          {limitHit
            ? `You can choose up to ${max}. Remove one first.`
            : `${chips.length}/${max} selected`}
        </AppText>
        {field === "interests" ? (
          INTEREST_GROUPS.map((g) => (
            <View key={g.title} style={styles.group}>
              <AppText variant="heading">{g.title}</AppText>
              <ChipGroup
                chips={g.chips}
                selected={chips}
                onToggle={toggleChip}
              />
            </View>
          ))
        ) : (
          <ChipGroup
            chips={PERSONALITY_TRAITS}
            selected={chips}
            onToggle={toggleChip}
          />
        )}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.page,
        { backgroundColor: colors.bg, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <PressableScale
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          scaleTo={0.88}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={25} color={colors.text} />
        </PressableScale>
        <AppText
          variant="heading"
          align="center"
          numberOfLines={1}
          style={styles.flex}
        >
          {FIELDS[field].title}
        </AppText>
        <View style={[styles.headerBtn, styles.headerRight]}>
          {saveAction ? (
            <PressableScale
              onPress={saveAction}
              disabled={!canSave}
              accessibilityRole="button"
              hitSlop={10}
              scaleTo={0.94}
              dimTo={0.7}
            >
              <AppText
                variant="body"
                weight="semibold"
                color={canSave ? colors.primary : colors.textSubtle}
              >
                Save
              </AppText>
            </PressableScale>
          ) : null}
        </View>
      </View>
      <Animated.View
        entering={FadeIn.duration(DURATION.quick).easing(EASE_OUT)}
        style={styles.flex}
      >
        {body}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sheetList: {
    maxHeight: 460,
  },
  page: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 64,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  pad: {
    padding: 20,
    gap: 12,
  },
  padH: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  note: {
    marginBottom: 8,
  },
  inputBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: {
    fontSize: 17,
    paddingVertical: 14,
  },
  bioBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    minHeight: 170,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bioInput: {
    flex: 1,
    minHeight: 150,
    fontSize: 16,
    lineHeight: 22,
  },
  heightRow: {
    height: HEIGHT_ROW,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  group: {
    gap: 12,
    marginTop: 12,
  },
});
