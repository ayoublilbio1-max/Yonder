import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../theme/ThemeProvider";

// Slider with one or two thumbs (age, height, distance).
//
// How it stays smooth: the thumbs live only on the UI thread. The values given as props are
// read ONCE (when the slider appears); after that the slider never moves a thumb because of a
// re-render, so nothing can pull it back under the finger. To set new values from outside
// (Reset / Clear), change the slider's `key` so a fresh slider is made.

type Props = {
  min: number;
  max: number;
  step?: number;
  low?: number; // omit for a single thumb
  high: number;
  minGap?: number; // smallest distance between the two thumbs (in values)
  onChange: (low: number, high: number) => void; // called on every step while dragging
};

const THUMB = 28;
const TOUCH = 48; // finger area around each thumb

export function RangeSlider({
  min,
  max,
  step = 1,
  low,
  high,
  minGap = 0,
  onChange,
}: Props) {
  const colors = useTheme();
  const single = low === undefined;
  const [initial] = useState(() => ({ low: low ?? min, high })); // read once

  const w = useSharedValue(0); // track length in px (0 until measured)
  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  const startX = useSharedValue(0); // where the dragged thumb was when the finger went down
  const lastLow = useSharedValue(initial.low);
  const lastHigh = useSharedValue(initial.high);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.max(0, e.nativeEvent.layout.width - THUMB);
    if (w.get() === next) return;
    // Place the thumbs from the current values (first layout, or the screen was resized).
    const toX = (v: number) => ((v - min) / (max - min)) * next;
    w.set(next);
    lowX.set(toX(lastLow.get()));
    highX.set(toX(lastHigh.get()));
  };

  const emit = (l: number, h: number) => onChange(l, h);

  const valueAt = (x: number) => {
    "worklet";
    const total = w.get();
    if (total <= 0) return min;
    const raw = min + (x / total) * (max - min);
    return Math.min(max, Math.max(min, Math.round(raw / step) * step));
  };

  const xOf = (v: number) => {
    "worklet";
    return ((v - min) / (max - min)) * w.get();
  };

  const report = () => {
    "worklet";
    const l = single ? min : valueAt(lowX.get());
    const h = valueAt(highX.get());
    if (l !== lastLow.get() || h !== lastHigh.get()) {
      lastLow.set(l);
      lastHigh.set(h);
      scheduleOnRN(emit, l, h);
    }
  };

  const gapPx = () => {
    "worklet";
    return (minGap / (max - min)) * w.get();
  };

  const lowPan = usePanGesture({
    enabled: !single,
    activeOffsetX: [-3, 3],
    failOffsetY: [-20, 20],
    onActivate: () => {
      "worklet";
      startX.set(lowX.get());
    },
    onUpdate: (e) => {
      "worklet";
      const x = startX.get() + e.translationX;
      lowX.set(Math.min(Math.max(0, x), highX.get() - gapPx()));
      report();
    },
    onDeactivate: () => {
      "worklet";
      lowX.set(withTiming(xOf(lastLow.get()), { duration: 90 })); // settle on the step
    },
  });

  const highPan = usePanGesture({
    activeOffsetX: [-3, 3],
    failOffsetY: [-20, 20],
    onActivate: () => {
      "worklet";
      startX.set(highX.get());
    },
    onUpdate: (e) => {
      "worklet";
      const floor = single ? 0 : lowX.get() + gapPx();
      const x = startX.get() + e.translationX;
      highX.set(Math.max(Math.min(w.get(), x), floor));
      report();
    },
    onDeactivate: () => {
      "worklet";
      highX.set(withTiming(xOf(lastHigh.get()), { duration: 90 }));
    },
  });

  const fillStyle = useAnimatedStyle(() => {
    const from = single ? 0 : lowX.get();
    return { left: from + THUMB / 2, width: Math.max(0, highX.get() - from) };
  });
  const lowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowX.get() }],
  }));
  const highStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highX.get() }],
  }));

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={[styles.track, { backgroundColor: colors.border }]} />
      <Animated.View
        style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]}
      />
      {!single ? (
        <GestureDetector gesture={lowPan}>
          <Animated.View style={[styles.touch, lowStyle]}>
            <View
              style={[
                styles.thumb,
                { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
            />
          </Animated.View>
        </GestureDetector>
      ) : null}
      <GestureDetector gesture={highPan}>
        <Animated.View style={[styles.touch, highStyle]}>
          <View
            style={[
              styles.thumb,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: TOUCH,
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    left: THUMB / 2,
    right: THUMB / 2,
    height: 4,
    borderRadius: 2,
  },
  fill: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
  },
  touch: {
    position: "absolute",
    left: (THUMB - TOUCH) / 2,
    width: TOUCH,
    height: TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    elevation: 3,
  },
});
