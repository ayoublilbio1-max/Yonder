// On Android the font family name = the TTF file name (embedded with the expo-font plugin).
// Never use fontWeight — pick the file instead.
export const fonts = {
  light: "BricolageGrotesque-Light",
  regular: "BricolageGrotesque-Regular",
  medium: "BricolageGrotesque-Medium",
  semibold: "BricolageGrotesque-Semibold",
  bold: "BricolageGrotesque-Bold",
} as const;

export type FontWeightName = keyof typeof fonts;
