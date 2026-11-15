import type { CharacterSheet, DerivedStats } from '../types/character';

/** Everything a sheet page needs to render and edit the character. */
export interface SheetCtx {
  sheet: CharacterSheet;
  stats: DerivedStats;
  readOnly: boolean;
  /** Applies a mutation on a deep copy of the sheet and emits the result. */
  mutate: (recipe: (draft: CharacterSheet) => void) => void;
  /** Turns automatic calculations on/off (seeds manual values when turning off). */
  setAutoCalculate: (on: boolean) => void;
}
