/**
 * fudapp palette — "the fridge door".
 * Bottle-green ink on enamel white; meals are tiles colored by meal type.
 */
export const light = {
  bg: '#F7F8F3',
  surface: '#ECEEE6',
  surfaceAlt: '#E1E5DA',
  surfaceStrong: '#CFD5CB',
  border: '#CFD5CB',
  text: '#123B2F',
  textSecondary: '#3F5F53',
  textTertiary: '#5F7A70',
  textMuted: '#7E948B',
  textFaint: '#A9B8B1',
  primary: '#123B2F',
  onPrimary: '#F7F8F3',
  primarySurface: '#245244',
  onPrimaryMuted: '#9DBDB0',
  danger: '#C8322B',
  dangerBg: '#FBE4E2',
  warning: '#B4600A',
  warningBg: '#FFF0CC',
  backdrop: 'rgba(18,59,47,0.5)',
  shadow: '#123B2F',
  // Meal tiles. Text on a tile is always dark ink, in both schemes.
  butter: '#FFD23F',
  pea: '#A9DD8B',
  beet: '#F7A1B5',
  onTile: '#123B2F',
  onTileMuted: 'rgba(18,59,47,0.62)',
};

export type Colors = typeof light;

/** The app has a single light palette. */
export const colors: Colors = light;


import type { MealType } from '@/data/meals';

/** Tile color for a meal type. */
export function tileColor(c: Colors, mealType: MealType): string {
  if (mealType === 'breakfast') return c.butter;
  if (mealType === 'lunch') return c.pea;
  return c.beet;
}
