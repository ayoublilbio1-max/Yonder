import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useTheme } from "../../theme/ThemeProvider";

// Swipe (home) — placeholder until the deck is built.
export default function SwipeScreen() {
  const colors = useTheme();

  return (
    <Screen>
      <AppText variant="display">Swipe</AppText>
      <AppText variant="body" muted>
        Your deck of profiles will appear here.
      </AppText>

      <View style={styles.cardWrap}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <AppText variant="display" color={colors.onPrimary}>
            Yonder
          </AppText>
          <AppText variant="body" color={colors.onPrimary}>
            First build is working ✓
          </AppText>
        </LinearGradient>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    flex: 1,
    paddingVertical: 20,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
