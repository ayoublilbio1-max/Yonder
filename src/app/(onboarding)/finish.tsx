import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthProvider';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { countryByCode, flagOf } from '../../onboarding/countries';
import { ALL_INTEREST_CHIPS, chipLabels, PERSONALITY_TRAITS } from '../../onboarding/interests';
import { useOnboarding } from '../../onboarding/OnboardingProvider';
import {
  cmToFeet,
  DRINKING_OPTIONS,
  EDUCATION_OPTIONS,
  INTENT_OPTIONS,
  labelOf,
  MARITAL_OPTIONS,
  RELIGION_OPTIONS,
  SMOKING_OPTIONS,
} from '../../onboarding/options';
import { firstUnanswered, stepHref } from '../../onboarding/steps';
import { useTheme } from '../../theme/ThemeProvider';

type SummaryRow = { icon: ComponentProps<typeof Ionicons>['name']; text: string };

function ageFrom(iso: string | undefined) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}

// Last onboarding screen: a short summary, then into the app.
export default function OnboardingFinishScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { loaded, draft } = useOnboarding();
  const [busy, setBusy] = useState(false);

  if (!loaded) return null;

  const missing = firstUnanswered(draft);
  const age = ageFrom(draft.birthday);
  const mainPhoto = draft.photos?.[0];
  const interests = chipLabels(ALL_INTEREST_CHIPS, draft.interests);
  const traits = chipLabels(PERSONALITY_TRAITS, draft.personality);
  const nationalities = (draft.nationalities ?? [])
    .map((code) => countryByCode(code))
    .filter((c) => c !== undefined)
    .map((c) => `${flagOf(c.code)} ${c.nationality}`)
    .join(' · ');

  const allRows: SummaryRow[] = [
    { icon: 'heart-outline', text: labelOf(INTENT_OPTIONS, draft.intent) },
    { icon: 'briefcase-outline', text: draft.profession ?? '' },
    { icon: 'school-outline', text: labelOf(EDUCATION_OPTIONS, draft.education) },
    { icon: 'flag-outline', text: nationalities },
    { icon: 'ribbon-outline', text: labelOf(MARITAL_OPTIONS, draft.maritalStatus) },
    { icon: 'resize-outline', text: draft.heightCm ? `${draft.heightCm} cm · ${cmToFeet(draft.heightCm)}` : '' },
    { icon: 'flame-outline', text: draft.smoking ? `Smoking: ${labelOf(SMOKING_OPTIONS, draft.smoking)}` : '' },
    { icon: 'wine-outline', text: draft.drinking ? `Drinking: ${labelOf(DRINKING_OPTIONS, draft.drinking)}` : '' },
    {
      icon: 'sparkles-outline',
      text: draft.religion && draft.religion !== 'prefer_not' ? labelOf(RELIGION_OPTIONS, draft.religion) : '',
    },
    { icon: 'shield-checkmark-outline', text: draft.phoneVerified ? 'Phone verified' : '' },
  ];
  const rows = allRows.filter((r) => r.text);

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    if (__DEV__) console.log('[onboarding] finished', JSON.stringify({ ...draft, photos: draft.photos?.length ?? 0 }));
    await completeOnboarding(); // the root layout moves on to the app
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 16 }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mainPhoto ? (
          <Image source={{ uri: mainPhoto }} style={[styles.avatar, { borderColor: colors.primary }]} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.check, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <Ionicons name="checkmark" size={44} color={colors.primary} />
          </View>
        )}

        <AppText variant="display">
          {draft.firstName ?? 'You'}
          {age != null ? `, ${age}` : ''}
        </AppText>
        <AppText variant="body" muted>
          Your profile is ready. You can change it any time.
        </AppText>

        {draft.bio ? (
          <AppText variant="body">
            “{draft.bio}”
          </AppText>
        ) : null}

        <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {rows.map((r) => (
            <View key={r.icon} style={styles.summaryRow}>
              <Ionicons name={r.icon} size={20} color={colors.primary} />
              <AppText variant="body" style={styles.flex}>
                {r.text}
              </AppText>
            </View>
          ))}
        </View>

        {interests.length || traits.length ? (
          <View style={styles.chips}>
            {[...traits, ...interests].map((c) => (
              <View key={c.key} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <AppText variant="caption">
                  {c.emoji} {c.label}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        {missing ? (
          <AppButton label="Answer the missing question" onPress={() => router.push(stepHref(missing))} />
        ) : (
          <AppButton label={busy ? 'Please wait…' : 'Start exploring'} onPress={finish} disabled={busy} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    marginBottom: 10,
  },
  check: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  flex: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});
