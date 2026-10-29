import { StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { PressableScale } from "../components/PressableScale";
import { useTheme } from "../theme/ThemeProvider";
import type { Chip } from "./interests";

// Wrapping row of emoji chips (interests, personality). Selected = pink.
export function ChipGroup({
  chips,
  selected,
  onToggle,
}: {
  chips: Chip[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const colors = useTheme();

  return (
    <View style={styles.wrap}>
      {chips.map((c) => {
        const isSelected = selected.includes(c.key);
        return (
          <PressableScale
            key={c.key}
            onPress={() => onToggle(c.key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            scaleTo={0.95}
            style={[
              styles.chip,
              {
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primarySoft : colors.card,
              },
            ]}
          >
            <AppText variant="bodySmall">{c.emoji}</AppText>
            <AppText
              variant="bodySmall"
              weight={isSelected ? "semibold" : "medium"}
              color={isSelected ? colors.primary : colors.text}
            >
              {c.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
