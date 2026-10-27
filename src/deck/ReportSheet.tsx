import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Sheet } from '../components/Sheet';
import type { Profile } from '../profiles/types';
import { useTheme } from '../theme/ThemeProvider';

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
        Report {profile?.name ?? ''}
      </AppText>
      <AppText variant="bodySmall" muted align="center">
        Why are you reporting this profile? {profile?.name ?? 'They'} won’t know you reported them.
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
                {r}
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
        label="Report and hide"
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
