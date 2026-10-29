import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { ConfirmModal } from '../components/ConfirmModal';
import { PressableScale } from '../components/PressableScale';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { BoostSheet } from '../deck/BoostSheet';
import { useSwipe } from '../deck/SwipeProvider';
import { FieldEditor } from '../me/FieldEditor';
import { completion, EDIT_SECTIONS, FIELDS, fieldValue, type FieldKey } from '../me/myProfile';
import { MyPreview } from '../me/MyPreview';
import { VerifyModal } from '../me/VerifyModal';
import { DURATION, EASE, EASE_OUT } from '../motion/ease';
import { MAX_PHOTOS, MIN_PHOTOS } from '../onboarding/options';
import { deletePhotoFile, pickPhoto } from '../onboarding/photos';
import { useTheme } from '../theme/ThemeProvider';
import { tr } from '../i18n/i18n';

// Your profile, Muzz-style: "Preview" (how others see you) | "Edit" (photos, verification, every answer).
// Open with /my-profile?tab=edit to land on Edit.

type Tab = 'preview' | 'edit';

const COLUMNS = 3;
const GAP = 10;
const SIDE = 16;

export default function MyProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { me, updateMe } = useSwipe();
  const [tab, setTab] = useState<Tab>(params.tab === 'edit' ? 'edit' : 'preview');
  const [field, setField] = useState<FieldKey | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);

  const openField = (k: FieldKey) => {
    if (FIELDS[k].locked) {
      toast.show(k === 'birthday' ? tr('Your date of birth can’t be changed after sign-up.') : tr('Your gender can’t be changed after sign-up.'));
      return;
    }
    if (__DEV__) console.log(`[me] edit ${k}`);
    setField(k);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          scaleTo={0.88}
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </PressableScale>
        <View style={styles.headerTitle}>
          <AppText variant="heading" numberOfLines={1} style={styles.shrink}>
            {me.firstName ?? tr('My profile')}
          </AppText>
          {me.photoVerified ? <Ionicons name="checkmark-circle" size={20} color={colors.verified} /> : null}
        </View>
        <View style={styles.headerBtn} />
      </View>

      <Tabs tab={tab} onChange={setTab} />

      {tab === 'preview' ? (
        <Animated.View key="preview" entering={FadeIn.duration(DURATION.quick + 60).easing(EASE_OUT)} style={styles.flex}>
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
            <MyPreview me={me} />
          </ScrollView>
          <View style={[styles.boostBar, { paddingBottom: insets.bottom + 14, backgroundColor: colors.bg }]}>
            <AppButton label={tr('Boost my profile')} icon="flash" variant="boost" onPress={() => setBoostOpen(true)} />
          </View>
        </Animated.View>
      ) : (
        <Animated.View key="edit" entering={FadeIn.duration(DURATION.quick + 60).easing(EASE_OUT)} style={styles.flex}>
          <ScrollView contentContainerStyle={[styles.editContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
            <EditPhotos />

            <AppText variant="title" style={styles.sectionTitle}>
              {tr('Photo verification')}
            </AppText>
            <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <PressableScale
                onPress={() => (me.photoVerified ? toast.show(tr('Your photo is already verified.')) : setVerifyOpen(true))}
                accessibilityRole="button"
                scaleTo={0.99}
                dimTo={0.7}
                style={styles.row}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={me.photoVerified ? colors.verified : colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="body" weight="semibold">
                    {tr('Blue check')}
                  </AppText>
                  <AppText variant="bodySmall" color={me.photoVerified ? colors.textMuted : colors.primary}>
                    {me.photoVerified ? tr('Verified ✓') : tr('Get verified — take a quick selfie')}
                  </AppText>
                </View>
                {me.photoVerified ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.verified} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
                )}
              </PressableScale>
            </View>

            {EDIT_SECTIONS.map((section) => (
              <View key={section.title}>
                <AppText variant="title" style={styles.sectionTitle}>
                  {tr(section.title)}
                </AppText>
                <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {section.keys.map((k, i) => {
                    const f = FIELDS[k];
                    const value = fieldValue(me, k);
                    return (
                      <PressableScale
                        key={k}
                        onPress={() => openField(k)}
                        accessibilityRole="button"
                        accessibilityLabel={`${f.title}: ${value || f.empty}`}
                        scaleTo={0.99}
                        dimTo={0.7}
                        style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                      >
                        <Ionicons name={f.icon} size={20} color={colors.textMuted} />
                        <View style={styles.flex}>
                          <AppText variant="body" weight="semibold">
                            {tr(f.title)}
                          </AppText>
                          <AppText variant="bodySmall" color={value ? colors.textMuted : colors.primary} numberOfLines={k === 'bio' ? 3 : 1}>
                            {value || tr(f.empty)}
                          </AppText>
                        </View>
                        <Ionicons
                          name={f.locked ? 'lock-closed-outline' : 'chevron-forward'}
                          size={f.locked ? 16 : 20}
                          color={colors.textSubtle}
                        />
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <FieldEditor
        field={field}
        me={me}
        onSave={(patch) => {
          updateMe(patch);
          toast.show(tr('Saved'));
        }}
        onClose={() => setField(null)}
      />
      <VerifyModal visible={verifyOpen} onClose={() => setVerifyOpen(false)} onVerified={() => updateMe({ photoVerified: true })} />
      <BoostSheet visible={boostOpen} onClose={() => setBoostOpen(false)} />
    </View>
  );
}

// "Complete profile 83%" + the 3 × 2 photo grid (add, make main, remove).
function EditPhotos() {
  const colors = useTheme();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { me, updateMe } = useSwipe();
  const photos = me.photos ?? [];
  const [busy, setBusy] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const slotW = Math.floor((width - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
  const slotH = Math.round((slotW * 4) / 3);
  const percent = completion(me);

  const add = async (source: 'camera' | 'library') => {
    setSourceOpen(false);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 250)); // let the sheet close before Android opens the picker
    const result = await pickPhoto(source);
    setBusy(false);
    if (result.ok) {
      updateMe({ photos: [...photos, result.uri] });
      toast.show(tr('Photo added'));
    } else if (result.reason === 'denied') {
      toast.show(tr('Allow camera access in your phone settings to take a photo.'));
      Linking.openSettings().catch(() => {});
    } else if (result.reason === 'error') {
      toast.show(tr('Couldn’t add this photo. Try another one.'));
    }
  };

  const makeMain = (i: number) => {
    updateMe({ photos: [photos[i], ...photos.filter((_, n) => n !== i)] });
    setMenu(null);
    toast.show(tr('Main photo changed'));
  };

  const remove = (i: number) => {
    deletePhotoFile(photos[i]);
    updateMe({ photos: photos.filter((_, n) => n !== i) });
    setConfirmDelete(null);
    toast.show(tr('Photo removed'));
  };

  return (
    <>
      <View style={styles.completeRow}>
        <AppText variant="title">{tr('Complete profile')}</AppText>
        <View style={[styles.percent, { backgroundColor: percent === 100 ? colors.boost : colors.primary }]}>
          <AppText variant="caption" weight="bold" color={colors.onPrimary}>
            {percent}%
          </AppText>
        </View>
      </View>
      <View style={styles.grid}>
        {Array.from({ length: MAX_PHOTOS }, (_, i) => {
          const uri = photos[i];
          const next = i === photos.length;
          return (
            <PressableScale
              key={i}
              onPress={() => {
                if (uri) setMenu(i);
                else if (!busy) setSourceOpen(true);
              }}
              disabled={!uri && !next}
              accessibilityRole="button"
              accessibilityLabel={uri ? `Photo ${i + 1}` : 'Add a photo'}
              scaleTo={0.96}
              style={[
                styles.slot,
                {
                  width: slotW,
                  height: slotH,
                  backgroundColor: colors.surface,
                  borderColor: uri ? 'transparent' : colors.border,
                  borderStyle: uri ? 'solid' : 'dashed',
                },
              ]}
            >
              {uri ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
              ) : next && busy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons name="camera-outline" size={26} color={next ? colors.primary : colors.textSubtle} />
              )}
              {i === 0 && uri ? (
                <View style={[styles.mainTag, { backgroundColor: colors.photoScrimBottom }]}>
                  <AppText variant="caption" weight="semibold" color={colors.onPhoto}>
                    {tr('Main')}
                  </AppText>
                </View>
              ) : null}
            </PressableScale>
          );
        })}
      </View>
      <AppText variant="caption" muted>
        {photos.length < MAX_PHOTOS ? `${tr('Get more likes with {count} photos.', { count: MAX_PHOTOS })} ` : ''}
        {tr('Your photos stay on this phone.')}
      </AppText>

      <Sheet visible={sourceOpen} onClose={() => setSourceOpen(false)}>
        <AppText variant="heading" align="center">
          {tr('Add a photo')}
        </AppText>
        <AppButton label={tr('Take a photo')} icon="camera-outline" onPress={() => add('camera')} />
        <AppButton label={tr('Choose from gallery')} icon="images-outline" variant="secondary" onPress={() => add('library')} />
      </Sheet>

      <Sheet visible={menu !== null} onClose={() => setMenu(null)}>
        <AppText variant="heading" align="center">
          {tr('Photo {v}', { v: menu !== null ? menu + 1 : '' })}
        </AppText>
        {menu !== null && menu > 0 ? <AppButton label={tr('Make main photo')} icon="star-outline" onPress={() => makeMain(menu)} /> : null}
        <AppButton
          label={tr('Remove photo')}
          icon="trash-outline"
          variant="danger"
          onPress={() => {
            if (photos.length <= MIN_PHOTOS) {
              setMenu(null);
              toast.show(tr('Keep at least {MIN_PHOTOS} photos. Add a new one first.', { MIN_PHOTOS }));
              return;
            }
            setConfirmDelete(menu);
            setMenu(null);
          }}
        />
        <AppButton label={tr('Cancel')} variant="secondary" onPress={() => setMenu(null)} />
      </Sheet>

      <ConfirmModal
        visible={confirmDelete !== null}
        title={tr('Remove this photo?')}
        message={tr('It will be removed from your profile.')}
        confirmLabel={tr('Remove')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete !== null) remove(confirmDelete);
        }}
      />
    </>
  );
}

// "Preview | Edit" — the line slides with a CSS-like ease.
function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const colors = useTheme();
  const [w, setW] = useState(0);
  const x = useSharedValue(tab === 'preview' ? 0 : 1);
  useEffect(() => {
    x.set(withTiming(tab === 'preview' ? 0 : 1, { duration: 260, easing: EASE }));
  }, [tab, x]);
  const line = useAnimatedStyle(() => ({ width: w / 2, transform: [{ translateX: (x.get() * w) / 2 }] }));
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <View style={[styles.tabs, { borderBottomColor: colors.border }]} onLayout={onLayout}>
      {(['preview', 'edit'] as Tab[]).map((t) => (
        <PressableScale
          key={t}
          onPress={() => onChange(t)}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === t }}
          scaleTo={0.97}
          style={styles.tabBtn}
        >
          <AppText variant="body" weight="semibold" color={tab === t ? colors.text : colors.textMuted}>
            {t === 'preview' ? tr('Preview') : tr('Edit')}
          </AppText>
        </PressableScale>
      ))}
      <Animated.View style={[styles.tabLine, { backgroundColor: colors.primary }, line]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabLine: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    borderRadius: 2,
  },
  boostBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  editContent: {
    paddingHorizontal: SIDE,
    paddingTop: 18,
    gap: 10,
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percent: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    marginTop: 4,
  },
  slot: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTag: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopRightRadius: 10,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 2,
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
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
