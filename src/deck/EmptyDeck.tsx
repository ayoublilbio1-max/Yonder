import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { useToast } from "../components/Toast";
import { useTheme } from "../theme/ThemeProvider";
import { useSwipe } from "./SwipeProvider";

// Rule 9.5: never a dead end — three ways to see people again.
export function EmptyDeck() {
  const colors = useTheme();
  const toast = useToast();
  const { rewindPassed } = useSwipe();

  const more = (message: string) => {
    const count = rewindPassed();
    toast.show(
      count > 0
        ? message
        : "You liked everyone here! New people join every day.",
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="people-outline" size={44} color={colors.primary} />
      </View>
      <AppText variant="title" align="center">
        You’ve seen everyone nearby
      </AppText>
      <AppText variant="body" muted align="center">
        Change your search to meet more people.
      </AppText>
      <View style={styles.actions}>
        <AppButton
          label="Increase distance"
          icon="navigate-outline"
          onPress={() => more("Showing people a bit further away")}
        />
        <AppButton
          label="Widen age range"
          icon="options-outline"
          variant="secondary"
          onPress={() => more("Showing people in a wider age range")}
        />
        <AppButton
          label="Rewind passed profiles"
          icon="refresh-outline"
          variant="secondary"
          onPress={() => more("Showing the profiles you passed again")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actions: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 18,
  },
});
