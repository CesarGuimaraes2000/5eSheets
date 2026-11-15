// Compact representation shared in the Owlbear Rodeo room metadata.
// Short keys keep each character around ~1 kB so many fit in the 16 kB room limit.

/** [name, level, flags, castingTime, range] — flags: 1 = prepared, 2 = concentration, 4 = ritual */
export type SummarySpell = [string, number, number, string, string];

/** [name, attack bonus, damage & type] */
export type SummaryAttack = [string, string, string];

export interface SummarySpellcasting {
  cls: string; // spellcasting class
  a: string; // ability abbreviation (INT/WIS/CHA...) or ''
  dc: number; // spell save DC
  at: number; // spell attack bonus
  sl: [number, number][]; // slots for levels 1-9: [total, expended]
  sp: SummarySpell[]; // cantrips + prepared spells (no descriptions)
}

export interface CharacterSummary {
  v: 1;
  id: string;
  o: string; // owner player id
  on: string; // owner name
  u: number; // updatedAt
  n: string; // character name
  cl: string; // class & level
  sp: string; // species
  img: string; // appearance image url
  ac: number;
  ini: number;
  spd: string;
  hp: [number, number, number]; // current, max, temp
  hd: [string, string]; // hit dice current, total
  ds: [number, number]; // death saves: successes, failures
  ex: number; // exhaustion level
  insp: 0 | 1;
  cnd: string[]; // conditions
  pb: number; // proficiency bonus
  pp: number; // passive perception
  ab: number[]; // 6 ability scores (STR..CHA)
  am: number[]; // 6 ability modifiers
  sv: number[]; // 6 saving throw totals
  svp: number; // saving throw proficiency bitmask
  sk: number[]; // 18 skill totals, in SKILLS order
  skp: string; // 18 chars: 0 none / 1 proficient / 2 expertise
  atk: SummaryAttack[];
  sc: SummarySpellcasting | null;
}
