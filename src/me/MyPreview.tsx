import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppText } from '../components/AppText';
import { DRINKING_OPTIONS, INTENT_OPTIONS, labelOf, MARITAL_OPTIONS, RELIGION_OPTIONS, SMOKING_OPTIONS } from '../onboarding/options';
import type { ProfileDraft } from '../onboarding/types';
import { useTheme } from '../theme/ThemeProvider';
import { ageOf, fieldValue, heightText, interestChips, nationalityText, traitChips } from './myProfile';
import { tr } from '../i18n/i18n';

// "Preview": your profile the way other people see it on Swipe (same card and sections).

type IconName = ComponentProps<typeof Ionicons>['name'];

const SIDE = 12;

export function MyPreview({ me }: { me: ProfileDraft }) {
  const colors = useTheme();
  const { width, height } = useWindowDimensions();
  const photos = me.photos ?? [];
  const [index, setIndex] = useState(0);
  const cardW = width - SIDE * 2;
  const cardH = Math.round(Math.min(height * 0.62, cardW * 1.38));
  const age = ageOf(me.birthday);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / cardW));
  };

  const intentIcon = INTENT_OPTIONS.find((o) => o.value === me.intent)?.icon ?? 'heart-outline';
  const about: { icon: IconName; label: string }[] = [
    { icon: 'resize-outline' as IconName, label: heightText(me.heightCm) },
    { icon: 'sparkles-outline' as IconName, label: me.religion === 'prefer_not' ? '' : labelOf(RELIGION_OPTIONS, me.religion) },
    { icon: 'flame-outline' as IconName, label: me.smoking ? tr('Smoking: {v}', { v: labelOf(SMOKING_OPTIONS, me.smoking).toLowerCase() }) : '' },
    { icon: 'wine-outline' as IconName, label: me.drinking ? tr('Alcohol: {v}', { v: labelOf(DRINKING_OPTIONS, me.drinking).toLowerCase() }) : '' },
    { icon: 'earth-outline' as IconName, label: nationalityText(me.nationalities) },
  ].filter((a) => a.label);
  const interests = interestChips(me);
  const traits = traitChips(me);

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { width: cardW, height: cardH, backgroundColor: colors.surface }]}>
        {photos.length ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd}>
            {photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: cardW, height: cardH }} contentFit="cover" transition={180} />
            ))}
          </ScrollView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Ionicons name="image-outline" size={44} color={colors.textSubtle} />
          </View>
        )}
        {photos.length > 1 ? (
          <View style={[styles.bars, styles.noTouch]}>
            {photos.map((uri, i) => (
              <View key={uri} style={[styles.bar, { backgroundColor: i === index ? colors.onPhoto : colors.photoScrimTop }]} />
            ))}
          </View>
        ) : null}
        <LinearGradient
          colors={['transparent', colors.photoScrimMiddle, colors.photoScrimBottom]}
          locations={[0.55, 0.72, 1]}
          style={[StyleSheet.absoluteFill, styles.noTouch]}
        />
        <View style={[styles.info, styles.noTouch]}>
          <View style={styles.nameRow}>
            <AppText variant="display" color={colors.onPhoto} numberOfLines={1} style={styles.shrink}>
              {me.firstName ?? tr('You')}
              {age ? `, ${age}` : ''}
            </AppText>
            {me.photoVerified ? <Ionicons name="checkmark-circle" size={26} color={colors.verified} /> : null}
          </View>
          {me.profession ? (
            <View style={styles.line}>
              <Ionicons name="briefcase-outline" size={16} color={colors.onPhotoMuted} />
              <AppText variant="body" color={colors.onPhotoMuted} numberOfLines={1}>
                {tr(me.profession)}
              </AppText>
            </View>
          ) : null}
          <View style={styles.line}>
            <Ionicons name="location-outline" size={16} color={colors.onPhotoMuted} />
            <AppText variant="body" color={colors.onPhotoMuted}>
              {tr('Nearby')}
            </AppText>
          </View>
        </View>
      </View>

      {me.intent ? (
        <Section>
          <View style={styles.row}>
            <View style={[styles.intentIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={intentIcon} size={22} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="caption" muted>
                {tr('LOOKING FOR')}
              </AppText>
              <AppText variant="heading">{fieldValue(me, 'intent')}</AppText>
            </View>
          </View>
        </Section>
      ) : null}

      {me.bio ? (
        <Section title={tr('Bio')} icon="chatbubble-outline">
          <AppText variant="body">{me.bio}</AppText>
        </Section>
      ) : null}

      {me.photoVerified ? (
        <Section>
          <View style={styles.row}>
            <Ionicons name="shield-checkmark" size={26} color={colors.verified} />
            <View style={styles.flex}>
              <AppText variant="body" weight="semibold">
                {tr('Verified profile')}
              </AppText>
              <AppText variant="bodySmall" muted>
                {tr('Your main photo has been verified.')}
              </AppText>
            </View>
          </View>
        </Section>
      ) : null}

      {me.maritalStatus || me.hasChildren ? (
        <Section title={tr('Marital status & children')} icon="ribbon-outline">
          <View style={styles.chips}>
            {me.maritalStatus ? <Chip icon="ribbon-outline" label={labelOf(MARITAL_OPTIONS, me.maritalStatus)} /> : null}
            {me.hasChildren ? <Chip icon="people-outline" label={me.hasChildren === 'yes' ? tr('Has children') : tr('No children')} /> : null}
          </View>
        </Section>
      ) : null}

      {about.length ? (
        <Section title={tr('About')} icon="person-outline">
          <View style={styles.chips}>
            {about.map((a) => (
              <Chip key={a.icon} icon={a.icon} label={tr(a.label)} />
            ))}
          </View>
        </Section>
      ) : null}

      {interests.length ? (
        <Section title={tr('Interests')} icon="sparkles-outline">
          <View style={styles.chips}>
            {interests.map((c) => (
              <Chip key={c.key} label={`${c.emoji} ${tr(c.label)}`} />
            ))}
          </View>
        </Section>
      ) : null}

      {traits.length ? (
        <Section title={tr('Personality')} icon="happy-outline">
          <View style={styles.chips}>
            {traits.map((c) => (
              <Chip key={c.key} label={`${c.emoji} ${tr(c.label)}`} />
            ))}
          </View>
        </Section>
      ) : null}

      {me.education || me.profession ? (
        <Section title={tr('Education and career')} icon="school-outline">
          <View style={styles.chips}>
            {me.education ? <Chip icon="school-outline" label={fieldValue(me, 'education')} /> : null}
            {me.profession ? <Chip icon="briefcase-outline" label={tr(me.profession)} /> : null}
          </View>
        </Section>
      ) : null}

      <AppText variant="caption" muted align="center" style={styles.note}>
        {tr('This is how people see you on Swipe.')}
      </AppText>
    </View>
  );
}

function Section({ title, icon, children }: { title?: string; icon?: IconName; children: ReactNode }) {
  const colors = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title ? (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={colors.primary} /> : null}
          <AppText variant="heading">{title}</AppText>
        </View>
      ) : null}
      {children}
    </View>
  );
}

function Chip({ label, icon }: { label: string; icon?: IconName }) {
  const colors = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon ? <Ionicons name={icon} size={15} color={colors.textMuted} /> : null}
      <AppText variant="bodySmall" weight="medium">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingHorizontal: SIDE,
    paddingTop: 12,
  },
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTouch: {
    pointerEvents: 'none',
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  bars: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  info: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  intentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  note: {
    marginTop: 4,
  },
});
