import Svg, { Circle, Path } from "react-native-svg";

// Custom tab bar icons (react-native-svg): outline when inactive, solid when active.
// `cutColor` = the tab bar background, used to "cut" details out of solid shapes.

export type TabIconProps = {
  focused: boolean;
  color: string;
  cutColor: string;
  size?: number;
};

const STROKE = 1.8;

// Swipe (home) — flame
const FLAME =
  "M12 2.8c.7 2.9 3.9 4.9 5.3 8.1 1.8 4.2-.9 9.6-5.3 9.6s-7.1-5.4-5.3-9.6c.6-1.4 1.5-2.4 2.5-3.1-.1 1.6.4 2.9 1.5 3.6.1-3.4.4-6 1.3-8.6z";

export function SwipeIcon({ focused, color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={FLAME}
        fill={focused ? color : "none"}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Explore — compass
const NEEDLE = "M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z";

export function ExploreIcon({
  focused,
  color,
  cutColor,
  size = 26,
}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx={12}
        cy={12}
        r={9}
        fill={focused ? color : "none"}
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path
        d={NEEDLE}
        fill={focused ? cutColor : color}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Likes — heart
const HEART =
  "M12 20.3s-7.4-4.5-9.1-9.1C1.8 8 3.8 4.6 7.2 4.6c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.4 3.4 4.3 6.6-1.7 4.6-9.1 9.1-9.1 9.1z";

export function LikesIcon({ focused, color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={HEART}
        fill={focused ? color : "none"}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Chats — speech bubble with tail
const BUBBLE =
  "M6.5 3.5h11A2.5 2.5 0 0 1 20 6v8.5a2.5 2.5 0 0 1-2.5 2.5h-7L6 20.5V17a2 2 0 0 1-2-2V6a2.5 2.5 0 0 1 2.5-2.5z";

export function ChatsIcon({
  focused,
  color,
  cutColor,
  size = 26,
}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={BUBBLE}
        fill={focused ? color : "none"}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {focused ? (
        <>
          <Circle cx={8.5} cy={10.3} r={1.2} fill={cutColor} />
          <Circle cx={12} cy={10.3} r={1.2} fill={cutColor} />
          <Circle cx={15.5} cy={10.3} r={1.2} fill={cutColor} />
        </>
      ) : null}
    </Svg>
  );
}

// Profile — person
export function ProfileIcon({ focused, color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx={12}
        cy={8}
        r={4}
        fill={focused ? color : "none"}
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path
        d={
          focused
            ? "M4 20.5c0-3.7 3.6-6.2 8-6.2s8 2.5 8 6.2v.3H4z"
            : "M4.5 20.5c0-3.5 3.4-5.8 7.5-5.8s7.5 2.3 7.5 5.8"
        }
        fill={focused ? color : "none"}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
