import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { PressableScale } from '../components/PressableScale';
import { useTheme } from '../theme/ThemeProvider';
import type { Option } from './options';
import { tr } from '../i18n/i18n';

// Simple text rows (one choice). The selected row is pink with a check.
export function OptionList<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Option<T>[];
  selected: T | undefined;
  onSelect: (value: T) => void;
}) {
  const colors = useTheme();

  return (
    <View>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            scaleTo={0.99}
            dimTo={0.6}
            style={styles.row}
          >
            <AppText variant="body" weight={isSelected ? 'bold' : 'semibold'} color={isSelected ? colors.primary : colors.text}>
              {tr(option.label)}
            </AppText>
            {isSelected ? <Ionicons name="checkmark" size={22} color={colors.primary} /> : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

// Bordered cards with an icon and a description (intent).
export function OptionCards<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Option<T>[];
  selected: T | undefined;
  onSelect: (value: T) => void;
}) {
  const colors = useTheme();

  return (
    <View style={styles.cards}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            scaleTo={0.98}
            style={[
              styles.card,
              {
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primarySoft : colors.card,
              },
            ]}
          >
            <View style={styles.cardText}>
              <AppText variant="body" weight="semibold">
                {tr(option.label)}
              </AppText>
              {option.description ? (
                <AppText variant="bodySmall" muted>
                  {tr(option.description)}
                </AppText>
              ) : null}
            </View>
            {option.icon ? (
              <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={option.icon} size={26} color={colors.primary} />
              </View>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
