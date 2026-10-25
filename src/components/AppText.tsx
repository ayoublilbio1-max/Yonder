import { Text, type TextProps, type TextStyle } from "react-native";
import { fonts, type FontWeightName } from "../constants/fonts";
import { useTheme } from "../theme/ThemeProvider";

// Use <AppText> everywhere instead of <Text>.
// It sets the Bricolage Grotesque file for the weight, the theme text colour,
// and a lineHeight of ~1.4 × fontSize so letters are never cut at the bottom.

type Variant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodySmall"
  | "label"
  | "caption";

const VARIANTS: Record<Variant, { size: number; weight: FontWeightName }> = {
  display: { size: 32, weight: "bold" },
  title: { size: 24, weight: "bold" },
  heading: { size: 18, weight: "semibold" },
  body: { size: 16, weight: "regular" },
  bodySmall: { size: 14, weight: "regular" },
  label: { size: 13, weight: "medium" },
  caption: { size: 12, weight: "regular" },
};

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: FontWeightName;
  size?: number;
  color?: string;
  muted?: boolean;
  align?: TextStyle["textAlign"];
};

export function AppText({
  variant = "body",
  weight,
  size,
  color,
  muted,
  align,
  style,
  ...rest
}: AppTextProps) {
  const colors = useTheme();
  const v = VARIANTS[variant];
  const fontSize = size ?? v.size;

  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts[weight ?? v.weight],
          fontSize,
          lineHeight: Math.round(fontSize * 1.4),
          color: color ?? (muted ? colors.textMuted : colors.text),
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
