/** Base units everything is converted to before pricing. */
export type BaseUnit = 'g' | 'ml' | 'pc';

export type IngredientDef = {
  key: string;
  aliases: string[];
  /** Grams per millilitre; lets a need in grams be covered by a product sold in ml. */
  densityGPerMl?: number;
  /** Grams per piece; lets a need in pieces be covered by a product sold by weight. */
  gramsPerPiece?: number;
};

/** What the shopping list asks for. `amount` is null when the item has no quantity. */
export type Need = {
  itemId: string;
  label: string;
  ingredientKey: string | null;
  amount: number | null;
  unit: BaseUnit;
};

/** One store product that can satisfy an ingredient. Prices are in euro cents. */
export type Offer = {
  chainId: string;
  productId: string;
  ingredientKey: string;
  name: string;
  packAmount: number;
  packUnit: BaseUnit;
  /** Sold loose by weight: any amount can be bought, price scales with it. */
  byWeight: boolean;
  priceCents: number;
};

export type ChoiceLine = {
  productId: string;
  productName: string;
  /** Number of packs to buy; 1 for loose by-weight products. */
  packs: number;
  packAmount: number;
  packUnit: BaseUnit;
  priceCents: number;
};

export type ItemChoice = {
  itemId: string;
  label: string;
  chainId: string;
  /** Usually one product; several when mixing pack sizes is cheaper. */
  lines: ChoiceLine[];
  /** Bought loose by weight, so the cost is for exactly the needed amount. */
  byWeight: boolean;
  costCents: number;
  /** Amount bought beyond what the list needs, in `leftoverUnit`. */
  leftover: number;
  leftoverUnit: BaseUnit;
};

export type StoreTotal = {
  chainId: string;
  totalCents: number;
  found: ItemChoice[];
  /** Item ids we have no price for at this chain (the store may still sell them). */
  missing: string[];
};

export type SplitPlan = {
  chainIds: string[];
  totalCents: number;
  /** Saving against the best single store, in cents. */
  savingCents: number;
  stores: StoreTotal[];
  missing: string[];
};

export type Comparison = {
  /** Every chain, best first: most items found, then lowest total. */
  single: StoreTotal[];
  /** Best plan using more than one store, or null if it does not save enough. */
  split: SplitPlan | null;
  /** Items no selected chain can price. */
  unpriced: string[];
  pricedCount: number;
  itemCount: number;
};
