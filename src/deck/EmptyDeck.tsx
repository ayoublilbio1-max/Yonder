import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { useToast } from '../components/Toast';
import { useDistanceUnit } from '../settings/units';
import { useTheme } from '../theme/ThemeProvider';
import { AGE_MAX, AGE_MIN, ageLabel, distanceLabel, widerAge, widerDistance } from '../filters/filters';
import { useSwipe } from './SwipeProvider';
import { tr } from '../i18n/i18n';

// Rule 9.5: never a dead end — three ways to see people again.
export function EmptyDeck() {
  const colors = useTheme();
  const toast = useToast();
  const unit = useDistanceUnit();
  const { rewindPassed, saved, setFilters } = useSwipe();
  const f = saved.filters;

  const rewind = () => {
    const count = rewindPassed();
    toast.show(count > 0 ? tr('Showing the profiles you passed again') : tr('You liked everyone here! New people join every day.'));
  };

  // Each button really changes the search; when there is nothing left to widen, it rewinds instead.
  const moreDistance = () => {
    if (f.distance === null) return rewind();
    const next = widerDistance(f);
    setFilters(next);
    toast.show(tr('Distance: {v}', { v: distanceLabel(next.distance, unit).toLowerCase() }));
    if (__DEV__) console.log(`[deck] empty → distance ${f.distance} → ${next.distance ?? 'any'}`);
  };

  const moreAge = () => {
    if (f.ageMin === AGE_MIN && f.ageMax === AGE_MAX) return rewind();
    const next = widerAge(f);
    setFilters(next);
    toast.show(tr('Age: {v}', { v: ageLabel(next.ageMin, next.ageMax) }));
    if (__DEV__) console.log(`[deck] empty → age ${ageLabel(f.ageMin, f.ageMax)} → ${ageLabel(next.ageMin, next.ageMax)}`);
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="people-outline" size={44} color={colors.primary} />
      </View>
      <AppText variant="title" align="center">
        {tr('You’ve seen everyone nearby')}
      </AppText>
      <AppText variant="body" muted align="center">
        {tr('Change your search to meet more people.')}
      </AppText>
      <View style={styles.actions}>
        <AppButton label={tr('Increase distance')} icon="navigate-outline" onPress={moreDistance} />
        <AppButton
          label={tr('Widen age range')}
          icon="options-outline"
          variant="secondary"
          onPress={moreAge}
        />
        <AppButton
          label={tr('Rewind passed profiles')}
          icon="refresh-outline"
          variant="secondary"
          onPress={rewind}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 18,
  },
});
