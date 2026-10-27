import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../theme/ThemeProvider";

// Slider with one or two thumbs (age, height, distance), drawn with Gesture Handler + Reanimated.
// - range: pass low + high → two thumbs; single: pass only high → one thumb from the left.
// - onChange runs while dragging (each step) so the label above can follow the finger.

type Props = {
  min: number;
  max: number;
  step?: number;
  low?: number; // omit for a single thumb
  high: number;
  minGap?: number; // smallest distance between the two thumbs (in values)
  onChange: (low: number, high: number) => void;
};

const THUMB = 28;
const TOUCH = 44; // touch area around each thumb

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
  const [width, setWidth] = useState(0);
  const w = useSharedValue(0);
  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  const lowStart = useSharedValue(0);
  const highStart = useSharedValue(0);
  const lastLow = useSharedValue(low ?? min);
  const lastHigh = useSharedValue(high);

  const placedWidth = useRef(0);

  // Put the thumbs where the values are: first layout, or Clear / Reset from outside.
  // Values that came from our own drag are skipped, so the thumb never jumps under the finger.
  useEffect(() => {
    if (!width) return;
    const fromDrag = (low ?? min) === lastLow.get() && high === lastHigh.get();
    if (fromDrag && placedWidth.current === width) return;
    placedWidth.current = width;
    const toX = (v: number) => ((v - min) / (max - min)) * width;
    lowX.set(toX(low ?? min));
    highX.set(toX(high));
    lowStart.set(toX(low ?? min));
    highStart.set(toX(high));
    lastLow.set(low ?? min);
    lastHigh.set(high);
  }, [
    width,
    low,
    high,
    min,
    max,
    lowX,
    highX,
    lowStart,
    highStart,
    lastLow,
    lastHigh,
  ]);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.max(0, e.nativeEvent.layout.width - THUMB);
    setWidth(next);
    w.set(next);
  };

  const emit = (l: number, h: number) => onChange(l, h);

  const valueAt = (x: number, total: number) => {
    "worklet";
    if (total <= 0) return min;
    const raw = min + (x / total) * (max - min);
    return Math.min(max, Math.max(min, Math.round(raw / step) * step));
  };

  const report = () => {
    "worklet";
    const l = single ? min : valueAt(lowX.get(), w.get());
    const h = valueAt(highX.get(), w.get());
    if (l !== lastLow.get() || h !== lastHigh.get()) {
      lastLow.set(l);
      lastHigh.set(h);
      scheduleOnRN(emit, l, h);
    }
  };

  const gapPx = () => {
    "worklet";
    return w.get() > 0 ? (minGap / (max - min)) * w.get() : 0;
  };

  const lowPan = usePanGesture({
    enabled: !single,
    activeOffsetX: [-4, 4],
    failOffsetY: [-14, 14],
    onUpdate: (e) => {
      "worklet";
      lowX.set(
        Math.min(
          Math.max(0, lowStart.get() + e.translationX),
          highX.get() - gapPx(),
        ),
      );
      report();
    },
    onDeactivate: () => {
      "worklet";
      lowStart.set(lowX.get());
    },
  });

  const highPan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-14, 14],
    onUpdate: (e) => {
      "worklet";
      const floor = single ? 0 : lowX.get() + gapPx();
      highX.set(
        Math.max(Math.min(w.get(), highStart.get() + e.translationX), floor),
      );
      report();
    },
    onDeactivate: () => {
      "worklet";
      highStart.set(highX.get());
    },
  });

  const fillStyle = useAnimatedStyle(() => ({
    left: (single ? 0 : lowX.get()) + THUMB / 2,
    width: Math.max(0, highX.get() - (single ? 0 : lowX.get())),
  }));
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
      {!single ? <Thumb gesture={lowPan} style={lowStyle} /> : null}
      <Thumb gesture={highPan} style={highStyle} />
    </View>
  );
}

function Thumb({
  gesture,
  style,
}: {
  gesture: ReturnType<typeof usePanGesture>;
  style: ReturnType<typeof useAnimatedStyle>;
}) {
  const colors = useTheme();
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.touch, style]}>
        <View
          style={[
            styles.thumb,
            { backgroundColor: colors.card, borderColor: colors.primary },
          ]}
        />
      </Animated.View>
    </GestureDetector>
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
