import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { PressableScale } from '../components/PressableScale';
import { Sheet } from '../components/Sheet';
import { useTheme } from '../theme/ThemeProvider';
import { SORT_OPTIONS, type SortKey } from './sort';
import { tr } from '../i18n/i18n';

// "Sort by" — tap an option to apply it right away (the sheet closes).

type Props = {
  visible: boolean;
  value: SortKey;
  onClose: () => void;
  onChange: (sort: SortKey) => void;
};

export function SortSheet({ visible, value, onClose, onChange }: Props) {
  const colors = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <AppText variant="heading" align="center">
        {tr('Sort by')}
      </AppText>
      <View>
        {SORT_OPTIONS.map((o) => {
          const selected = o.key === value;
          return (
            <PressableScale
              key={o.key}
              onPress={() => {
                onChange(o.key);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              scaleTo={0.99}
              dimTo={0.6}
              style={styles.row}
            >
              <Ionicons name={o.icon} size={20} color={selected ? colors.primary : colors.textMuted} />
              <AppText
                variant="body"
                weight={selected ? 'semibold' : 'regular'}
                color={selected ? colors.primary : colors.text}
                style={styles.flex}
              >
                {tr(o.label)}
              </AppText>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? colors.primary : colors.textSubtle}
              />
            </PressableScale>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
  },
  flex: {
    flex: 1,
  },
});
