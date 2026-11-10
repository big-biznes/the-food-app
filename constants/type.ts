/** Single family: Bricolage Grotesque. Weights map to separate font files on native. */
export const font = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  extrabold: 'BricolageGrotesque_800ExtraBold',
} as const;

/** Type scale. Display sizes carry the personality; body stays quiet. */
export const type = {
  display: { fontFamily: font.extrabold, fontSize: 40, lineHeight: 40, letterSpacing: -1.2 },
  title: { fontFamily: font.extrabold, fontSize: 28, lineHeight: 30, letterSpacing: -0.6 },
  heading: { fontFamily: font.bold, fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 23 },
  bodyMedium: { fontFamily: font.medium, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: font.semibold, fontSize: 13, lineHeight: 17 },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
} as const;
