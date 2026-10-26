import { useEffect } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";

// Soft pulsing placeholder shown while something loads (photos, lists…).
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = useTheme();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 750 }), -1, true));
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[{ backgroundColor: colors.skeleton }, style, animated]}
    />
  );
}
