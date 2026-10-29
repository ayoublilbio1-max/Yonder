import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { AppState, Linking, ScrollView, Share, StyleSheet, Switch, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { displayName, METHOD_LABEL } from '../auth/types';
import { AppText } from '../components/AppText';
import { ConfirmModal } from '../components/ConfirmModal';
import { FeedbackModal } from '../components/FeedbackModal';
import { PressableScale } from '../components/PressableScale';
import { useToast } from '../components/Toast';
import { APP_NAME, APP_VERSION, DEVELOPER, HOME_URL } from '../constants/app';
import { useSwipe } from '../deck/SwipeProvider';
import { DURATION, EASE, EASE_OUT } from '../motion/ease';
import { askPermission, cancelScheduled, permissionState, type PermissionState } from '../notify/notify';
import { NOTIFY_ROWS, setNotifyPrefs, useNotifyPrefs, type NotifyPrefs } from '../notify/prefs';
import { deletePhotoFile } from '../onboarding/photos';
import { clearPasscode, getPasscode, usePasscodeOn } from '../security/passcode';
import { PasscodeSetup, type PasscodeMode } from '../security/PasscodeSetup';
import { DEMO_CONTACTS } from '../settings/demoContacts';
import { BlockContactsPage, BlockedProfilesPage, PurchasesPage, VisibilitySheet, visibilityLabel } from '../settings/SettingsPages';
import { LanguageSheet, languageName } from '../settings/LanguageSheet';
import { setDistanceUnit, useDistanceUnit, type DistanceUnit } from '../settings/units';
import { playSound, setSoundsEnabled, useSoundsEnabled } from '../sound/sounds';
import { useTheme, useThemeMode, type ThemeMode } from '../theme/ThemeProvider';
import { tr, useLanguage } from '../i18n/i18n';

// Settings (Muzz order, Yonder look): account · notifications · app settings · privacy · help · delete.

type IconName = ComponentProps<typeof Ionicons>['name'];
type PageName = 'blocked' | 'contacts' | 'purchases' | null;

const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'system', label: 'Follow phone', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { mode, setMode } = useThemeMode();
  const { session, signOut, deleteAccount } = useAuth();
  const { saved, setPrivacy, me } = useSwipe();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [page, setPage] = useState<PageName>(null);
  const [passMode, setPassMode] = useState<PasscodeMode | null>(null);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const soundsOn = useSoundsEnabled();
  const unit = useDistanceUnit();
  const prefs = useNotifyPrefs();
  const language = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);

  const user = session?.user;
  const userId = user?.id ?? '';
  const passcodeOn = usePasscodeOn(userId);

  // Read the passcode state and Android's notification permission (again when you come back
  // from the phone's settings).
  useEffect(() => {
    if (userId) getPasscode(userId);
    const read = () => permissionState().then(setPermission);
    read();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') read();
    });
    return () => sub.remove();
  }, [userId]);

  const toggleNotifications = async (on: boolean) => {
    setNotifyPrefs({ enabled: on });
    if (on) {
      const ok = await askPermission();
      setPermission(ok ? 'granted' : await permissionState());
    } else {
      await cancelScheduled();
    }
  };

  const blockedCount = saved.blocked.filter((id) => {
    const u = saved.unmatched[id];
    return !u || (u.by === 'me' && (u.reason === 'block' || u.reason.startsWith('report')));
  }).length;

  const shareLink = async () => {
    const slug = (me.firstName ?? 'me').toLowerCase().replace(/[^a-z0-9]+/g, '');
    try {
      await Share.share({ message: tr('See my profile on {APP_NAME}: {HOME_URL}?u={slug}', { APP_NAME, HOME_URL, slug }) });
      if (__DEV__) console.log('[privacy] profile link shared');
    } catch (e) {
      if (__DEV__) console.log('[privacy] share failed', String(e));
    }
  };

  const doDelete = async () => {
    setDeleteOpen(false);
    (me.photos ?? []).forEach(deletePhotoFile);
    if (userId) await clearPasscode(userId);
    await cancelScheduled();
    await deleteAccount();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          scaleTo={0.88}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <AppText variant="title">{tr('Settings')}</AppText>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* ---------- account ---------- */}
        {user ? (
          <>
            <SectionTitle>{tr('ACCOUNT')}</SectionTitle>
            <Group>
              <View style={styles.row}>
                {user.photo ? (
                  <Image source={{ uri: user.photo }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <AppText variant="heading" color={colors.onPrimary}>
                      {displayName(user).charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
                <View style={styles.rowText}>
                  <AppText variant="body" weight="semibold">
                    {displayName(user)}
                  </AppText>
                  <AppText variant="bodySmall" muted numberOfLines={1}>
                    {user.email}
                  </AppText>
                  <AppText variant="caption" muted>
                    {tr('Signed in with {v}', { v: tr(METHOD_LABEL[user.method]) })}
                  </AppText>
                </View>
              </View>
              <Row first={false} icon="log-out-outline" danger title={tr('Log out')} onPress={() => setLogoutOpen(true)} />
            </Group>
          </>
        ) : null}

        {/* ---------- notifications ---------- */}
        <SectionTitle>{tr('NOTIFICATIONS')}</SectionTitle>
        <Group>
          <SwitchRow
            first
            icon="notifications-outline"
            title={tr('Notifications')}
            text={tr('Stay up to date with new likes, matches and messages')}
            value={prefs.enabled}
            onChange={toggleNotifications}
          />
          {prefs.enabled && permission === 'denied' ? (
            <Row
              icon="alert-circle-outline"
              title={tr('Blocked in your phone settings')}
              text={tr('Tap to allow notifications for Yonder')}
              danger
              onPress={() => Linking.openSettings().catch(() => {})}
            />
          ) : null}
          {prefs.enabled ? (
            <Animated.View entering={FadeIn.duration(DURATION.quick + 60).easing(EASE_OUT)}>
              {NOTIFY_ROWS.map((r) => (
                <SwitchRow key={r.key} small title={tr(r.title)} text={tr(r.text)} value={prefs[r.key]} onChange={(v) => setNotifyPrefs({ [r.key]: v } as Partial<NotifyPrefs>)} />
              ))}
              <SwitchRow
                small
                title={tr('Chat message preview')}
                text={tr('Show the message text in the notification')}
                value={prefs.preview}
                onChange={(v) => setNotifyPrefs({ preview: v })}
              />
            </Animated.View>
          ) : null}
        </Group>

        {/* ---------- app settings ---------- */}
        <SectionTitle>{tr('APPEARANCE')}</SectionTitle>
        <Group>
          {APPEARANCE_OPTIONS.map((option, i) => {
            const selected = mode === option.mode;
            return (
              <PressableScale
                key={option.mode}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                scaleTo={0.99}
                dimTo={0.7}
                style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
              >
                <Ionicons name={option.icon} size={22} color={colors.text} />
                <AppText variant="body" style={styles.rowText}>
                  {tr(option.label)}
                </AppText>
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.textSubtle} />
              </PressableScale>
            );
          })}
        </Group>

        <SectionTitle>{tr('DISTANCE')}</SectionTitle>
        <View style={[styles.group, styles.unitGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.unitHead}>
            <AppText variant="body" weight="medium" style={styles.rowText}>
              {tr('Show distances in')}
            </AppText>
            <AppText variant="body" muted>
              {unit === 'km' ? tr('Km') : tr('Mi')}
            </AppText>
          </View>
          <UnitSwitch value={unit} onChange={setDistanceUnit} />
        </View>

        <SectionTitle>{tr('APP SETTINGS')}</SectionTitle>
        <Group>
          <Row first icon="language-outline" title={tr('Language')} text={languageName(language.setting, language.lang)} onPress={() => setLanguageOpen(true)} />
          <SwitchRow
            icon={soundsOn ? 'volume-high-outline' : 'volume-mute-outline'}
            title={tr('App sounds')}
            text={tr('Matches, boosts and payments')}
            value={soundsOn}
            onChange={(on) => {
              setSoundsEnabled(on);
              if (on) playSound('purchase');
            }}
          />
          <Row icon="card-outline" title={tr('Manage purchases')} text={tr('Review or restore your purchases')} onPress={() => setPage('purchases')} />
          <SwitchRow
            icon="lock-closed-outline"
            title={tr('Passcode')}
            text={tr('Ask for a passcode each time you open Yonder')}
            value={passcodeOn}
            onChange={(on) => setPassMode(on ? 'set' : 'remove')}
          />
          {passcodeOn ? <Row small title={tr('Change passcode')} onPress={() => setPassMode('change')} /> : null}
        </Group>

        {/* ---------- privacy ---------- */}
        <SectionTitle>{tr('PRIVACY')}</SectionTitle>
        <Group>
          <Row
            first
            icon="eye-off-outline"
            title={tr('Who can see my profile')}
            text={visibilityLabel(saved.visibility)}
            onPress={() => setVisibilityOpen(true)}
          />
          <SwitchRow
            icon="link-outline"
            title={tr('My profile sharing link')}
            text={tr('Let your profile be shared with a link. Locked photos stay hidden.')}
            value={saved.shareLink}
            onChange={(v) => setPrivacy({ shareLink: v })}
          />
          {saved.shareLink ? <Row small title={tr('Share my profile link')} onPress={shareLink} /> : null}
          <Row
            icon="ban-outline"
            title={tr('Profiles I’ve blocked')}
            text={blockedCount ? tr('{blockedCount} blocked', { blockedCount }) : tr('View and manage everyone you blocked')}
            onPress={() => setPage('blocked')}
          />
          <Row
            icon="people-outline"
            title={tr('Block my phone contacts')}
            text={saved.blockedContacts.length ? tr('{length} of {length2} contacts blocked', { length: saved.blockedContacts.length, length2: DEMO_CONTACTS.length }) : tr('They can’t see you on Yonder')}
            onPress={() => setPage('contacts')}
          />
        </Group>

        {/* ---------- help ---------- */}
        <SectionTitle>{tr('HELP')}</SectionTitle>
        <Group>
          <Row first icon="chatbubble-ellipses-outline" title={tr('Feedback')} text={tr('Report a bug or tell us what to improve')} onPress={() => setFeedbackOpen(true)} />
        </Group>

        {/* ---------- delete ---------- */}
        {user ? (
          <>
            <SectionTitle>{tr('MANAGE ACCOUNT')}</SectionTitle>
            <Group>
              <Row
                first
                icon="trash-outline"
                danger
                title={tr('Delete my Yonder profile')}
                text={tr('Your profile, photos, matches and chats are deleted from this phone')}
                onPress={() => setDeleteOpen(true)}
              />
            </Group>
          </>
        ) : null}

        <View style={styles.footer}>
          <AppText variant="bodySmall" muted align="center">
            {APP_NAME} {APP_VERSION}
          </AppText>
          <AppText variant="bodySmall" muted align="center">
            {tr('Developed with')} <AppText variant="bodySmall" color={colors.primary}>♥</AppText> {tr('by {DEVELOPER}', { DEVELOPER })}
          </AppText>
        </View>
      </ScrollView>

      <FeedbackModal visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <VisibilitySheet visible={visibilityOpen} onClose={() => setVisibilityOpen(false)} />
      <LanguageSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} reopen="/settings" />
      <BlockedProfilesPage visible={page === 'blocked'} onClose={() => setPage(null)} />
      <BlockContactsPage visible={page === 'contacts'} onClose={() => setPage(null)} />
      <PurchasesPage visible={page === 'purchases'} onClose={() => setPage(null)} />
      <PasscodeSetup
        mode={passMode}
        userId={userId}
        onClose={() => setPassMode(null)}
        onDone={(message) => {
          setPassMode(null);
          toast.show(message);
        }}
      />
      <ConfirmModal
        visible={logoutOpen}
        title={tr('Log out?')}
        message={tr('You\'ll go back to the welcome screen. Your account stays saved on this phone.')}
        confirmLabel={tr('Log out')}
        icon="log-out-outline"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await cancelScheduled();
          signOut();
        }}
      />
      <ConfirmModal
        visible={deleteOpen}
        title={tr('Delete your profile?')}
        message={tr('Your profile, photos, matches, chats and purchases are deleted from this phone. You can\'t undo this.')}
        confirmLabel={tr('Delete my profile')}
        icon="trash-outline"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={doDelete}
      />
    </View>
  );
}

// ---------- small pieces ----------

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <AppText variant="label" muted style={styles.sectionTitle}>
      {children}
    </AppText>
  );
}

// A rounded group; rows after the first get a thin line on top.
function Group({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

function Row({
  icon,
  title,
  text,
  danger,
  small,
  first = false,
  onPress,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  danger?: boolean;
  small?: boolean;
  first?: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      scaleTo={0.99}
      dimTo={0.7}
      style={[styles.row, small && styles.smallRow, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
    >
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <AppText variant="body" weight="medium" color={danger ? colors.danger : colors.text}>
          {title}
        </AppText>
        {text ? (
          <AppText variant="bodySmall" muted>
            {text}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
    </PressableScale>
  );
}

function SwitchRow({
  icon,
  title,
  text,
  value,
  small,
  first = false,
  onChange,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  value: boolean;
  small?: boolean;
  first?: boolean;
  onChange: (v: boolean) => void;
}) {
  const colors = useTheme();
  return (
    <PressableScale
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      scaleTo={0.99}
      dimTo={0.7}
      style={[styles.row, small && styles.smallRow, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
    >
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <AppText variant="body" weight="medium">
          {title}
        </AppText>
        {text ? (
          <AppText variant="bodySmall" muted>
            {text}
          </AppText>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.card} />
    </PressableScale>
  );
}

// "Km | Mi" (like Tinder): the pink pill slides to the choice with a CSS-like ease.
function UnitSwitch({ value, onChange }: { value: DistanceUnit; onChange: (u: DistanceUnit) => void }) {
  const colors = useTheme();
  const [w, setW] = useState(0);
  const x = useSharedValue(value === 'km' ? 0 : 1);
  useEffect(() => {
    x.set(withTiming(value === 'km' ? 0 : 1, { duration: DURATION.quick + 60, easing: EASE }));
  }, [value, x]);
  const pill = useAnimatedStyle(() => ({ width: w / 2, transform: [{ translateX: (x.get() * w) / 2 }] }));
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 8);

  return (
    <View style={[styles.unitSwitch, { backgroundColor: colors.card, borderColor: colors.border }]} onLayout={onLayout}>
      <Animated.View style={[styles.unitPill, { backgroundColor: colors.primary }, pill]} />
      {(['km', 'mi'] as DistanceUnit[]).map((u) => (
        <PressableScale
          key={u}
          onPress={() => onChange(u)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === u }}
          accessibilityLabel={u === 'km' ? 'Kilometres' : 'Miles'}
          scaleTo={0.96}
          style={styles.unitBtn}
        >
          <AppText variant="body" weight="semibold" color={value === u ? colors.onPrimary : colors.text}>
            {u === 'km' ? tr('Km') : tr('Mi')}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  smallRow: {
    paddingLeft: 66, // lines up with the text of the rows that have an icon
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  unitHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitSwitch: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  unitPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 10,
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  footer: {
    marginTop: 36,
    gap: 2,
  },
});
