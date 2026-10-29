import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Sheet } from '../components/Sheet';
import type { Profile } from '../profiles/types';
import { useTheme } from '../theme/ThemeProvider';
import { tr } from '../i18n/i18n';

// "Why are you reporting?" — reasons, then the profile is hidden for good (demo: nothing is sent).

export const REPORT_REASONS = [
  'Fake profile or scam',
  'Inappropriate photos',
  'Offensive or abusive',
  'Spam or advertising',
  'Seems underage',
  'Married or not single',
  'Something else',
];

type Props = {
  profile: Profile | null; // null = closed
  onClose: () => void;
  onReport: (reason: string) => void;
};

export function ReportSheet({ profile, onClose, onReport }: Props) {
  const colors = useTheme();
  const [reason, setReason] = useState<string | null>(null);

  const close = () => {
    setReason(null);
    onClose();
  };

  return (
    <Sheet visible={profile !== null} onClose={close}>
      <AppText variant="heading" align="center">
        {tr('Report {v}', { v: profile?.name ?? '' })}
      </AppText>
      <AppText variant="bodySmall" muted align="center">
        {tr('Why are you reporting this profile? {v} won’t know you reported them.', { v: profile?.name ?? '' })}
      </AppText>
      <View>
        {REPORT_REASONS.map((r) => {
          const selected = reason === r;
          return (
            <Pressable
              key={r}
              onPress={() => setReason(r)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={styles.row}
            >
              <AppText variant="body" weight={selected ? 'semibold' : 'regular'} style={styles.flex}>
                {tr(r)}
              </AppText>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? colors.danger : colors.textSubtle}
              />
            </Pressable>
          );
        })}
      </View>
      <AppButton
        label={tr('Report and hide')}
        variant="danger"
        disabled={!reason}
        onPress={() => {
          if (!reason) return;
          onReport(reason);
          setReason(null);
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  flex: {
    flex: 1,
  },
});
