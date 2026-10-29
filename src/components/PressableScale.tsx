import { type ReactNode } from "react";
import {
    Pressable,
    type GestureResponderEvent,
    type PressableProps,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { DURATION, EASE, EASE_OUT } from "../motion/ease";

// A Pressable that eases down when you touch it and eases back when you let go
// (like a CSS `transition: transform .2s ease`). Use it for every button, row and card.
// - buttons / cards: the default (scale 0.97)
// - full-width rows: scaleTo={0.99} dimTo={0.7} — mostly a soft fade

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  scaleTo?: number;
  dimTo?: number;
};

export function PressableScale({
  style,
  children,
  scaleTo = 0.97,
  dimTo = 1,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const down = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    opacity: 1 - down.get() * (1 - dimTo),
    transform: [{ scale: 1 - down.get() * (1 - scaleTo) }],
  }));

  const pressIn = (e: GestureResponderEvent) => {
    down.set(withTiming(1, { duration: DURATION.press, easing: EASE_OUT }));
    onPressIn?.(e);
  };
  const pressOut = (e: GestureResponderEvent) => {
    down.set(withTiming(0, { duration: DURATION.release, easing: EASE }));
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
