import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import {
  ACTIVE_OPTIONS,
  activeFilterCount,
  AGE_BUCKETS,
  DEFAULT_FILTERS,
  DISTANCES,
  HEIGHT_BUCKETS,
  OPTIONS,
  type Filters,
} from '../filters/filters';
import { DRINKING_LABEL, MARITAL_LABEL, PERSONALITY_NAME, SMOKING_LABEL } from '../profiles/extras';
import type { ProfileMarital } from '../profiles/types';
import { useWallet } from '../store/WalletProvider';
import { useTheme } from '../theme/ThemeProvider';
import { GoldSheet } from './GoldSheet';

// Full-screen Filters: basic filters for everyone, advanced ones for Gold members.
// Changes are a draft until "Apply".

type Props = {
  visible: boolean;
  value: Filters;
  onClose: () => void;
  onApply: (filters: Filters) => void;
};

export function FiltersModal({ visible, value, onClose, onApply }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {visible ? <FiltersBody value={value} onClose={onClose} onApply={onApply} /> : null}
    </Modal>
  );
}

type ListKey =
  | 'religions'
  | 'ethnicities'
  | 'nationalities'
  | 'languages'
  | 'education'
  | 'professions'
  | 'interests'
  | 'personality'
  | 'drinking'
  | 'smoking';

const MARITAL_KEYS: ProfileMarital[] = ['neverMarried', 'divorced', 'widowed'];

function FiltersBody({ value, onClose, onApply }: Omit<Props, 'visible'>) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();
  const [draft, setDraft] = useState<Filters>(value);
  const [goldOpen, setGoldOpen] = useState(false);
  const count = activeFilterCount(draft);

  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleIn = (key: ListKey, v: string) =>
    setDraft((d) => {
      const list = d[key] as string[];
      const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
      return { ...d, [key]: next } as Filters;
    });

  const gold = (patch: Partial<Filters>) => {
    if (!wallet.gold) {
      setGoldOpen(true);
      if (__DEV__) console.log('[filters] advanced filter tapped without Gold');
      return;
    }
    set(patch);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <AppText variant="heading" style={styles.flex}>
          Filters{count ? ` (${count})` : ''}
        </AppText>
        <Pressable onPress={() => setDraft(DEFAULT_FILTERS)} accessibilityRole="button" hitSlop={10} disabled={count === 0}>
          <AppText variant="body" weight="semibold" color={count ? colors.primary : colors.textSubtle}>
            Reset
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Group title="Age" hint="All ages" active={draft.ages.length > 0} onClear={() => set({ ages: [] })}>
          <Chips
            options={AGE_BUCKETS.map((b) => ({ key: b.key, label: b.key }))}
            selected={draft.ages}
            onToggle={(k) =>
              set({ ages: draft.ages.includes(k) ? draft.ages.filter((a) => a !== k) : [...draft.ages, k] })
            }
          />
        </Group>

        <Group title="Distance" hint="Anywhere" active={draft.distance !== null} onClear={() => set({ distance: null })}>
          <Chips
            options={DISTANCES.map((d) => ({ key: String(d.km), label: d.label }))}
            selected={[String(draft.distance)]}
            onToggle={(k) => set({ distance: k === 'null' ? null : Number(k) })}
          />
        </Group>

        <ListGroup title="Religion" k="religions" options={OPTIONS.religions} draft={draft} toggle={toggleIn} set={set} />
        <ListGroup title="Ethnicity" k="ethnicities" options={OPTIONS.ethnicities} draft={draft} toggle={toggleIn} set={set} />
        <ListGroup title="Nationality" k="nationalities" options={OPTIONS.nationalities} draft={draft} toggle={toggleIn} set={set} />

        <Group title="Height" hint="Any height" active={draft.heights.length > 0} onClear={() => set({ heights: [] })}>
          <Chips
            options={HEIGHT_BUCKETS.map((b) => ({ key: b.key, label: b.label }))}
            selected={draft.heights}
            onToggle={(k) =>
              set({ heights: draft.heights.includes(k) ? draft.heights.filter((h) => h !== k) : [...draft.heights, k] })
            }
          />
        </Group>

        <Group title="Marital status" hint="Any" active={draft.marital.length > 0} onClear={() => set({ marital: [] })}>
          <Chips
            options={MARITAL_KEYS.map((m) => ({ key: m, label: MARITAL_LABEL[m] }))}
            selected={draft.marital}
            onToggle={(k) =>
              set({ marital: draft.marital.includes(k) ? draft.marital.filter((m) => m !== k) : [...draft.marital, k] })
            }
          />
        </Group>

        <Group title="Children" hint="Any" active={draft.children !== 'any'} onClear={() => set({ children: 'any' })}>
          <Chips
            options={[
              { key: 'any', label: 'Any' },
              { key: 'yes', label: 'Has children' },
              { key: 'no', label: 'No children' },
            ]}
            selected={[draft.children]}
            onToggle={(k) => set({ children: k })}
          />
        </Group>

        <ListGroup title="Languages" k="languages" options={OPTIONS.languages} draft={draft} toggle={toggleIn} set={set} />
        <ListGroup title="Education" k="education" options={OPTIONS.education} draft={draft} toggle={toggleIn} set={set} />
        <ListGroup title="Profession" k="professions" options={OPTIONS.professions} draft={draft} toggle={toggleIn} set={set} />
        <ListGroup title="Interests" k="interests" options={OPTIONS.interests} draft={draft} toggle={toggleIn} set={set} />
        <ListGroup
          title="Personality"
          k="personality"
          options={OPTIONS.personality}
          labels={(v) => `${v} · ${PERSONALITY_NAME[v] ?? ''}`}
          draft={draft}
          toggle={toggleIn}
          set={set}
        />
        <ListGroup
          title="Alcohol"
          k="drinking"
          options={Object.keys(DRINKING_LABEL)}
          labels={(v) => DRINKING_LABEL[v] ?? v}
          draft={draft}
          toggle={toggleIn}
          set={set}
        />
        <ListGroup
          title="Smoking"
          k="smoking"
          options={Object.keys(SMOKING_LABEL)}
          labels={(v) => SMOKING_LABEL[v] ?? v}
          draft={draft}
          toggle={toggleIn}
          set={set}
        />

        <Group title="Photos" hint="Everyone" active={draft.photos !== 'any'} onClear={() => set({ photos: 'any' })}>
          <Chips
            options={[
              { key: 'any', label: 'Everyone' },
              { key: 'clear', label: 'Without blurred photos' },
              { key: 'blurred', label: 'With blurred photos' },
            ]}
            selected={[draft.photos]}
            onToggle={(k) => set({ photos: k })}
          />
        </Group>

        {/* ---------- Gold ---------- */}
        <View style={styles.goldTitle}>
          <View style={[styles.goldBadge, { backgroundColor: colors.gold }]}>
            <Ionicons name="star" size={12} color={colors.onPhoto} />
            <AppText variant="caption" weight="bold" color={colors.onPhoto}>
              GOLD
            </AppText>
          </View>
          <AppText variant="heading">Advanced filters</AppText>
        </View>
        {!wallet.gold ? (
          <Pressable
            onPress={() => setGoldOpen(true)}
            accessibilityRole="button"
            style={[styles.goldCard, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}
          >
            <Ionicons name="lock-closed" size={20} color={colors.gold} />
            <AppText variant="bodySmall" weight="medium" style={styles.flex}>
              Get Yonder Gold to use these filters.
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.gold} />
          </Pressable>
        ) : null}

        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SwitchRow label="Completed bio" locked={!wallet.gold} value={draft.completeBio} onChange={(v) => gold({ completeBio: v })} />
          <SwitchRow label="ID and age verified" locked={!wallet.gold} value={draft.verified} onChange={(v) => gold({ verified: v })} />
          <SwitchRow label="Gold members" locked={!wallet.gold} value={draft.goldOnly} onChange={(v) => gold({ goldOnly: v })} />
          <SwitchRow label="Just joined" locked={!wallet.gold} value={draft.justJoined} onChange={(v) => gold({ justJoined: v })} last />
        </View>

        <Group title="Recently active" hint="Any time" active={draft.active !== 'any'} onClear={() => set({ active: 'any' })} locked={!wallet.gold}>
          <Chips
            options={ACTIVE_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
            selected={[draft.active]}
            onToggle={(k) => gold({ active: k })}
          />
        </Group>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.bg }]}>
        <AppButton
          label="Apply filters"
          onPress={() => {
            onApply(draft);
            onClose();
          }}
        />
      </View>

      <GoldSheet visible={goldOpen} onClose={() => setGoldOpen(false)} />
    </View>
  );
}

function ListGroup({
  title,
  k,
  options,
  labels,
  draft,
  toggle,
  set,
}: {
  title: string;
  k: ListKey;
  options: string[];
  labels?: (v: string) => string;
  draft: Filters;
  toggle: (key: ListKey, v: string) => void;
  set: (patch: Partial<Filters>) => void;
}) {
  const selected = draft[k] as string[];
  return (
    <Group title={title} hint="Any" active={selected.length > 0} onClear={() => set({ [k]: [] } as Partial<Filters>)}>
      <Chips
        options={options.map((o) => ({ key: o, label: labels ? labels(o) : o }))}
        selected={selected}
        onToggle={(v) => toggle(k, v)}
        collapse
      />
    </Group>
  );
}

function Group({
  title,
  hint,
  active,
  onClear,
  locked,
  children,
}: {
  title: string;
  hint: string;
  active: boolean;
  onClear: () => void;
  locked?: boolean;
  children: ReactNode;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.group, styles.groupPad, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.groupHead}>
        <AppText variant="body" weight="semibold" style={styles.flex}>
          {title}
        </AppText>
        {locked ? <Ionicons name="lock-closed" size={16} color={colors.gold} /> : null}
        {active ? (
          <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button">
            <AppText variant="bodySmall" weight="semibold" color={colors.primary}>
              Clear
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="bodySmall" muted>
            {hint}
          </AppText>
        )}
      </View>
      {children}
    </View>
  );
}

const COLLAPSED = 10;

function Chips<K extends string>({
  options,
  selected,
  onToggle,
  collapse,
}: {
  options: { key: K; label: string }[];
  selected: readonly string[];
  onToggle: (key: K) => void;
  collapse?: boolean;
}) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const canCollapse = collapse && options.length > COLLAPSED + 2;
  // Selected ones always stay visible when collapsed.
  const shown =
    canCollapse && !open
      ? [...options.slice(0, COLLAPSED), ...options.slice(COLLAPSED).filter((o) => selected.includes(o.key))]
      : options;

  return (
    <View style={styles.chips}>
      {shown.map((o) => {
        const on = selected.includes(o.key);
        return (
          <Pressable
            key={o.key}
            onPress={() => onToggle(o.key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={[
              styles.chip,
              { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primary : colors.border },
            ]}
          >
            {on ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
            <AppText variant="bodySmall" weight="medium" color={on ? colors.primary : colors.text}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
      {canCollapse ? (
        <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" style={styles.more}>
          <AppText variant="bodySmall" weight="semibold" color={colors.primary}>
            {open ? 'Show less' : `Show all (${options.length})`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function SwitchRow({
  label,
  value,
  locked,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  locked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.switchRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      <AppText variant="body" style={styles.flex}>
        {label}
      </AppText>
      {locked ? <Ionicons name="lock-closed" size={16} color={colors.gold} /> : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  group: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  groupPad: {
    padding: 16,
    gap: 12,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  more: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  goldTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  goldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
