import * as Haptics from "expo-haptics";
import {
    ScrollView,
    StyleSheet,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";
import { AppText } from "../components/AppText";
import { useTheme } from "../theme/ThemeProvider";

// One column of a scroll wheel (month / day / year). 5 rows visible, the middle one is selected.
// To jump to a new position from outside, remount it with a new `key`.

export const WHEEL_ITEM = 48;
const VISIBLE = 5;
const PAD = WHEEL_ITEM * Math.floor(VISIBLE / 2);

type Props = {
  items: string[];
  index: number;
  onChange: (index: number) => void;
  width: number;
  label: string;
};

export function WheelColumn({ items, index, onChange, width, label }: Props) {
  const colors = useTheme();

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(
      0,
      Math.min(
        items.length - 1,
        Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM),
      ),
    );
    if (i !== index) {
      Haptics.selectionAsync().catch(() => {});
      onChange(i);
    }
  };

  return (
    <View
      style={{ width, height: WHEEL_ITEM * VISIBLE }}
      accessibilityLabel={label}
    >
      <View style={[styles.band, { top: PAD, borderColor: colors.border }]} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM}
        decelerationRate="fast"
        nestedScrollEnabled
        contentOffset={{ x: 0, y: index * WHEEL_ITEM }}
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={onEnd}
      >
        {items.map((item, i) => {
          const selected = i === index;
          return (
            <View key={`${item}-${i}`} style={styles.item}>
              <AppText
                variant="body"
                size={selected ? 18 : 16}
                weight={selected ? "semibold" : "regular"}
                color={selected ? colors.text : colors.textSubtle}
              >
                {item}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: "absolute",
    left: 4,
    right: 4,
    height: WHEEL_ITEM,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    pointerEvents: "none",
  },
  item: {
    height: WHEEL_ITEM,
    alignItems: "center",
    justifyContent: "center",
  },
});
