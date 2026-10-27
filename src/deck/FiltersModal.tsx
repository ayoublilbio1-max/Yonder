import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { ConfirmModal } from "../components/ConfirmModal";
import { RangeSlider } from "../components/RangeSlider";
import {
  ACTIVE_OPTIONS,
  activeFilterCount,
  AGE_MAX,
  AGE_MIN,
  ageLabel,
  DEFAULT_FILTERS,
  DISTANCE_MAX,
  DISTANCE_MIN,
  distanceLabel,
  HEIGHT_MAX,
  HEIGHT_MIN,
  heightRangeLabel,
  OPTIONS,
  type Filters,
} from "../filters/filters";
import { INTENT_LABEL } from "../profiles/data";
import {
  DRINKING_LABEL,
  MARITAL_LABEL,
  PERSONALITY_NAME,
  SMOKING_LABEL,
} from "../profiles/extras";
import type { ProfileIntent, ProfileMarital } from "../profiles/types";
import { useWallet } from "../store/WalletProvider";
import { useTheme } from "../theme/ThemeProvider";
import { GoldSheet } from "./GoldSheet";

// Filters, like dating apps do it: age + distance sliders on top, then one row per filter.
// A row opens its own page (back · title · Clear). Everything is a draft until "Apply filters".

type Props = {
  visible: boolean;
  value: Filters;
  onClose: () => void;
  onApply: (filters: Filters) => void;
};

export function FiltersModal(props: Props) {
  return props.visible ? <FiltersBody {...props} /> : null;
}

type ListKey =
  | "intents"
  | "religions"
  | "ethnicities"
  | "nationalities"
  | "marital"
  | "languages"
  | "education"
  | "professions"
  | "interests"
  | "personality"
  | "drinking"
  | "smoking";
type PageKey = ListKey | "height" | "children" | "photos" | "active";

type Option = { key: string; label: string };
const opts = (list: string[], label?: (v: string) => string): Option[] =>
  list.map((v) => ({ key: v, label: label ? label(v) : v }));

const MARITAL_KEYS: ProfileMarital[] = ["neverMarried", "divorced", "widowed"];
const INTENT_KEYS: ProfileIntent[] = [
  "marriage",
  "serious_relationship",
  "for_fun",
  "new_friends",
];

const LISTS: Record<ListKey, { title: string; options: Option[] }> = {
  intents: {
    title: "Looking for",
    options: opts(INTENT_KEYS, (i) => INTENT_LABEL[i as ProfileIntent]),
  },
  religions: { title: "Religion", options: opts(OPTIONS.religions) },
  ethnicities: { title: "Ethnicity", options: opts(OPTIONS.ethnicities) },
  nationalities: { title: "Nationality", options: opts(OPTIONS.nationalities) },
  marital: {
    title: "Marital status",
    options: opts(MARITAL_KEYS, (m) => MARITAL_LABEL[m as ProfileMarital]),
  },
  languages: { title: "Languages", options: opts(OPTIONS.languages) },
  education: { title: "Education", options: opts(OPTIONS.education) },
  professions: { title: "Profession", options: opts(OPTIONS.professions) },
  interests: { title: "Interests", options: opts(OPTIONS.interests) },
  personality: {
    title: "Personality",
    options: opts(
      OPTIONS.personality,
      (v) => `${v} · ${PERSONALITY_NAME[v] ?? ""}`,
    ),
  },
  drinking: {
    title: "Alcohol",
    options: opts(Object.keys(DRINKING_LABEL), (v) => DRINKING_LABEL[v] ?? v),
  },
  smoking: {
    title: "Smoking",
    options: opts(Object.keys(SMOKING_LABEL), (v) => SMOKING_LABEL[v] ?? v),
  },
};

const CHILDREN: { key: Filters["children"]; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "yes", label: "Has children" },
  { key: "no", label: "No children" },
];
const PHOTOS: { key: Filters["photos"]; label: string }[] = [
  { key: "any", label: "Everyone" },
  { key: "clear", label: "Without blurred photos" },
  { key: "blurred", label: "With blurred photos" },
];

// Free for everyone (after the age + distance sliders).
const BASIC_ROWS: PageKey[] = ["religions", "ethnicities", "nationalities"];
// Yonder Gold.
const GOLD_ROWS: PageKey[] = [
  "intents",
  "height",
  "marital",
  "children",
  "languages",
  "education",
  "professions",
  "interests",
  "personality",
  "drinking",
  "smoking",
  "photos",
  "active",
];

function pageTitle(k: PageKey) {
  if (k === "height") return "Height";
  if (k === "children") return "Children";
  if (k === "photos") return "Photos";
  if (k === "active") return "Recently active";
  return LISTS[k].title;
}

function summary(k: PageKey, f: Filters) {
  if (k === "height")
    return f.heightMin === HEIGHT_MIN && f.heightMax === HEIGHT_MAX
      ? "Any"
      : heightRangeLabel(f.heightMin, f.heightMax);
  if (k === "children")
    return CHILDREN.find((c) => c.key === f.children)?.label ?? "Any";
  if (k === "photos")
    return PHOTOS.find((c) => c.key === f.photos)?.label ?? "Everyone";
  if (k === "active")
    return ACTIVE_OPTIONS.find((o) => o.key === f.active)?.label ?? "Any time";
  const picked = f[k] as string[];
  if (picked.length === 0) return "Any";
  const labels = picked.map(
    (v) => LISTS[k].options.find((o) => o.key === v)?.label ?? v,
  );
  return picked.length <= 2 ? labels.join(", ") : `${picked.length} selected`;
}

function isSet(k: PageKey, f: Filters) {
  return summary(k, f) !== summary(k, DEFAULT_FILTERS);
}

function FiltersBody({ value, onClose, onApply }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();
  const [draft, setDraft] = useState<Filters>(value);
  const [page, setPage] = useState<PageKey | null>(null);
  const [goldOpen, setGoldOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [sliderKey, setSliderKey] = useState(0); // new key = sliders start again from the draft values
  const count = activeFilterCount(draft);

  const set = (patch: Partial<Filters>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const back = () => {
    if (page) setPage(null);
    else onClose();
  };

  const openRow = (k: PageKey) => {
    if (GOLD_ROWS.includes(k) && !wallet.gold) {
      setGoldOpen(true);
      if (__DEV__) console.log(`[filters] ${k} needs Gold`);
      return;
    }
    if (__DEV__) console.log(`[filters] open ${k}`);
    setPage(k);
  };

  const gold = (patch: Partial<Filters>) => {
    if (!wallet.gold) {
      setGoldOpen(true);
      if (__DEV__) console.log("[filters] advanced filter tapped without Gold");
      return;
    }
    set(patch);
  };

  const clearPage = (k: PageKey) => {
    if (k === "height") {
      set({ heightMin: HEIGHT_MIN, heightMax: HEIGHT_MAX });
      setSliderKey((n) => n + 1);
    } else if (k === "children") set({ children: "any" });
    else if (k === "photos") set({ photos: "any" });
    else if (k === "active") set({ active: "any" });
    else set({ [k]: [] } as Partial<Filters>);
  };

  const toggle = (k: ListKey, v: string) =>
    setDraft((d) => {
      const list = d[k] as string[];
      const next = list.includes(v)
        ? list.filter((x) => x !== v)
        : [...list, v];
      return { ...d, [k]: next } as Filters;
    });

  return (
    // Android back button → back to the list first, then closes.
    <Modal
      visible
      animationType="slide"
      onRequestClose={back}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* A Modal is its own native window on Android: gestures (the sliders) need their own root here. */}
      <GestureHandlerRootView
        style={[
          styles.root,
          { backgroundColor: colors.bg, paddingTop: insets.top },
        ]}
      >
        {page === null ? (
          <Animated.View
            key="main"
            entering={FadeIn.duration(160)}
            style={styles.root}
          >
            <Header
              left={<HeaderIcon icon="close" label="Close" onPress={onClose} />}
              title={`Filters${count ? ` (${count})` : ""}`}
              right={
                <HeaderText
                  label="Reset"
                  disabled={count === 0}
                  onPress={() => setConfirmReset(true)}
                />
              }
            />
            <ScrollView contentContainerStyle={styles.content}>
              <Card>
                <View style={styles.sliderHead}>
                  <AppText variant="body" weight="semibold">
                    Age
                  </AppText>
                  <AppText
                    variant="body"
                    weight="semibold"
                    color={colors.primary}
                  >
                    {ageLabel(draft.ageMin, draft.ageMax)}
                  </AppText>
                </View>
                <RangeSlider
                  key={`age-${sliderKey}`}
                  min={AGE_MIN}
                  max={AGE_MAX}
                  low={draft.ageMin}
                  high={draft.ageMax}
                  minGap={1}
                  onChange={(l, h) => set({ ageMin: l, ageMax: h })}
                />
              </Card>

              <Card>
                <View style={styles.sliderHead}>
                  <AppText variant="body" weight="semibold">
                    Maximum distance
                  </AppText>
                  <AppText
                    variant="body"
                    weight="semibold"
                    color={colors.primary}
                  >
                    {distanceLabel(draft.distance)}
                  </AppText>
                </View>
                <RangeSlider
                  key={`distance-${sliderKey}`}
                  min={DISTANCE_MIN}
                  max={DISTANCE_MAX}
                  high={draft.distance ?? DISTANCE_MAX}
                  onChange={(_, h) =>
                    set({ distance: h >= DISTANCE_MAX ? null : h })
                  }
                />
                <AppText variant="caption" muted>
                  If there aren’t enough people nearby, we show people a bit
                  further away.
                </AppText>
              </Card>

              <View
                style={[
                  styles.group,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {BASIC_ROWS.map((k, i) => (
                  <Row
                    key={k}
                    title={pageTitle(k)}
                    value={summary(k, draft)}
                    active={isSet(k, draft)}
                    first={i === 0}
                    onPress={() => openRow(k)}
                  />
                ))}
              </View>

              {/* ---------- Gold ---------- */}
              <View style={styles.goldTitle}>
                <View
                  style={[styles.goldBadge, { backgroundColor: colors.gold }]}
                >
                  <Ionicons name="star" size={12} color={colors.onPhoto} />
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={colors.onPhoto}
                  >
                    GOLD
                  </AppText>
                </View>
                <AppText variant="heading">Advanced filters</AppText>
              </View>
              {!wallet.gold ? (
                <Pressable
                  onPress={() => setGoldOpen(true)}
                  accessibilityRole="button"
                  style={[
                    styles.goldCard,
                    {
                      backgroundColor: colors.goldSoft,
                      borderColor: colors.gold,
                    },
                  ]}
                >
                  <Ionicons name="lock-closed" size={20} color={colors.gold} />
                  <AppText
                    variant="bodySmall"
                    weight="medium"
                    style={styles.flex}
                  >
                    Get Yonder Gold to use these filters.
                  </AppText>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.gold}
                  />
                </Pressable>
              ) : null}
              <View
                style={[
                  styles.group,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <SwitchRow
                  first
                  label="Completed bio"
                  locked={!wallet.gold}
                  value={draft.completeBio}
                  onChange={(v) => gold({ completeBio: v })}
                />
                <SwitchRow
                  label="ID and age verified"
                  locked={!wallet.gold}
                  value={draft.verified}
                  onChange={(v) => gold({ verified: v })}
                />
                <SwitchRow
                  label="Gold members"
                  locked={!wallet.gold}
                  value={draft.goldOnly}
                  onChange={(v) => gold({ goldOnly: v })}
                />
                <SwitchRow
                  label="Just joined"
                  locked={!wallet.gold}
                  value={draft.justJoined}
                  onChange={(v) => gold({ justJoined: v })}
                />
                {GOLD_ROWS.map((k) => (
                  <Row
                    key={k}
                    title={pageTitle(k)}
                    value={summary(k, draft)}
                    active={isSet(k, draft)}
                    locked={!wallet.gold}
                    onPress={() => openRow(k)}
                  />
                ))}
              </View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                {
                  paddingBottom: insets.bottom + 12,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <AppButton
                label="Apply filters"
                onPress={() => {
                  onApply(draft);
                  onClose();
                }}
              />
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            key={page}
            entering={SlideInRight.duration(220)}
            style={styles.root}
          >
            <Header
              left={
                <HeaderIcon
                  icon="arrow-back"
                  label="Back"
                  onPress={() => setPage(null)}
                />
              }
              title={pageTitle(page)}
              right={
                <HeaderText
                  label="Clear"
                  disabled={!isSet(page, draft)}
                  onPress={() => clearPage(page)}
                />
              }
            />
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: insets.bottom + 24 },
              ]}
            >
              <PageContent
                page={page}
                draft={draft}
                set={set}
                toggle={toggle}
                sliderKey={sliderKey}
              />
            </ScrollView>
          </Animated.View>
        )}

        <GoldSheet visible={goldOpen} onClose={() => setGoldOpen(false)} />
        <ConfirmModal
          visible={confirmReset}
          icon="refresh-outline"
          title="Reset all filters?"
          message="Age, distance and every other filter go back to “Any”. Nothing changes until you tap Apply filters."
          confirmLabel="Reset"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setConfirmReset(false);
            setDraft(DEFAULT_FILTERS);
            setSliderKey((n) => n + 1);
            if (__DEV__) console.log("[filters] reset (draft)");
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

function PageContent({
  page,
  draft,
  set,
  toggle,
  sliderKey,
}: {
  page: PageKey;
  draft: Filters;
  set: (patch: Partial<Filters>) => void;
  toggle: (k: ListKey, v: string) => void;
  sliderKey: number;
}) {
  const colors = useTheme();

  if (page === "height") {
    return (
      <Card>
        <View style={styles.sliderHead}>
          <AppText variant="body" weight="semibold">
            Height
          </AppText>
          <AppText variant="body" weight="semibold" color={colors.primary}>
            {heightRangeLabel(draft.heightMin, draft.heightMax)}
          </AppText>
        </View>
        <RangeSlider
          key={`height-${sliderKey}`}
          min={HEIGHT_MIN}
          max={HEIGHT_MAX}
          low={draft.heightMin}
          high={draft.heightMax}
          minGap={1}
          onChange={(l, h) => set({ heightMin: l, heightMax: h })}
        />
      </Card>
    );
  }

  if (page === "children" || page === "photos" || page === "active") {
    const list: Option[] =
      page === "children"
        ? CHILDREN
        : page === "photos"
          ? PHOTOS
          : ACTIVE_OPTIONS;
    const current =
      page === "children"
        ? draft.children
        : page === "photos"
          ? draft.photos
          : draft.active;
    return (
      <View
        style={[
          styles.group,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {list.map((o, i) => (
          <OptionRow
            key={o.key}
            label={o.label}
            selected={current === o.key}
            radio
            first={i === 0}
            onPress={() =>
              set(
                page === "children"
                  ? { children: o.key as Filters["children"] }
                  : page === "photos"
                    ? { photos: o.key as Filters["photos"] }
                    : { active: o.key as Filters["active"] },
              )
            }
          />
        ))}
      </View>
    );
  }

  const picked = draft[page] as string[];
  return (
    <>
      <AppText variant="caption" muted style={styles.hint}>
        Pick as many as you like.
      </AppText>
      <View
        style={[
          styles.group,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {LISTS[page].options.map((o, i) => (
          <OptionRow
            key={o.key}
            label={o.label}
            selected={picked.includes(o.key)}
            first={i === 0}
            onPress={() => toggle(page, o.key)}
          />
        ))}
      </View>
    </>
  );
}

// ---------- small pieces ----------

function Header({
  left,
  title,
  right,
}: {
  left: ReactNode;
  title: string;
  right: ReactNode;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.side}>{left}</View>
      <AppText
        variant="heading"
        align="center"
        numberOfLines={1}
        style={styles.flex}
      >
        {title}
      </AppText>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

function HeaderIcon({
  icon,
  label,
  onPress,
}: {
  icon: "close" | "arrow-back";
  label: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={styles.headerBtn}
    >
      <Ionicons name={icon} size={25} color={colors.text} />
    </Pressable>
  );
}

function HeaderText({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      hitSlop={10}
    >
      <AppText
        variant="body"
        weight="semibold"
        color={disabled ? colors.textSubtle : colors.primary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function Card({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

function Row({
  title,
  value,
  active,
  locked,
  first,
  onPress,
}: {
  title: string;
  value: string;
  active: boolean;
  locked?: boolean;
  first?: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
      style={({ pressed }) => [
        styles.row,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <AppText variant="body" style={styles.flex}>
        {title}
      </AppText>
      {locked ? (
        <Ionicons name="lock-closed" size={16} color={colors.gold} />
      ) : null}
      <AppText
        variant="bodySmall"
        weight={active ? "semibold" : "regular"}
        color={active ? colors.primary : colors.textMuted}
        numberOfLines={1}
        style={styles.rowValue}
      >
        {value}
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

function OptionRow({
  label,
  selected,
  radio,
  first,
  onPress,
}: {
  label: string;
  selected: boolean;
  radio?: boolean;
  first?: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  const icon = radio
    ? selected
      ? "radio-button-on"
      : "radio-button-off"
    : selected
      ? "checkbox"
      : "square-outline";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={radio ? "radio" : "checkbox"}
      accessibilityState={radio ? { selected } : { checked: selected }}
      style={[
        styles.row,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
    >
      <AppText
        variant="body"
        weight={selected ? "semibold" : "regular"}
        style={styles.flex}
      >
        {label}
      </AppText>
      <Ionicons
        name={icon}
        size={22}
        color={selected ? colors.primary : colors.textSubtle}
      />
    </Pressable>
  );
}

function SwitchRow({
  label,
  value,
  locked,
  onChange,
  first,
}: {
  label: string;
  value: boolean;
  locked: boolean;
  onChange: (v: boolean) => void;
  first?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[
        styles.row,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
    >
      <AppText variant="body" style={styles.flex}>
        {label}
      </AppText>
      {locked ? (
        <Ionicons name="lock-closed" size={16} color={colors.gold} />
      ) : null}
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 72,
    justifyContent: "center",
  },
  sideRight: {
    alignItems: "flex-end",
    paddingRight: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  sliderHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  group: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  rowValue: {
    maxWidth: "45%",
  },
  hint: {
    marginLeft: 4,
  },
  goldTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  goldCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
