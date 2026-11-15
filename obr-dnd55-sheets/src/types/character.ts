// Full character sheet model (D&D 5.5 / 2024), mirroring the 3-page sheet.
// The full sheet lives in the user's browser (localStorage) and JSON files.
// Only a compact `CharacterSummary` is shared in the Owlbear Rodeo room.

export type AbilityKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export type ProficiencyLevel = 'none' | 'proficient' | 'expertise';

export interface SkillItem {
  id: string;
  name: string;
  ability: AbilityKey;
  proficiency: ProficiencyLevel;
  customBonus?: number;
}

export interface AttackItem {
  id: string;
  name: string;
  atkBonus: string;
  damageType: string;
  notes?: string; // e.g. Weapon Mastery (Vex, Topple, Nick...)
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface SpellItem {
  id: string;
  name: string;
  prepared: boolean;
  castingTime: string; // "1 action", "1 bonus action", "1 reaction"...
  range: string; // "60 ft", "Self", "Touch"...
  concentration: boolean;
  ritual: boolean;
  notes?: string; // Kept only in the full sheet, never shared with the room.
}

export interface SpellLevelBlock {
  level: number; // 0 (Cantrips) to 9
  slotsTotal: number;
  slotsExpended: number;
  spells: SpellItem[];
}

/**
 * Every value the sheet can calculate automatically.
 * When `autoCalculate` is true these are derived from the sheet;
 * when false, the values stored in `manualStats` are used and can be edited freely.
 */
export interface DerivedStats {
  proficiencyBonus: number;
  abilityModifiers: Record<AbilityKey, number>;
  savingThrows: Record<AbilityKey, number>;
  skills: Record<string, number>; // keyed by SkillItem.id
  passivePerception: number;
  initiative: number;
  spellSaveDc: number;
  spellAttackBonus: number;
}

export interface CharacterSheet {
  schemaVersion: 1;

  // Control metadata
  id: string;
  ownerId: string;
  ownerName: string;
  updatedAt: number;

  // Automatic calculation toggle (on by default)
  autoCalculate: boolean;
  manualStats: DerivedStats;

  // ================= PAGE 1: CORE =================
  header: {
    characterName: string;
    classAndLevel: string;
    background: string;
    playerName: string;
    speciesOrRace: string;
    alignment: string;
    experiencePoints: string;
  };

  abilities: Record<AbilityKey, number>;
  heroicInspiration: boolean;

  savingThrows: Record<AbilityKey, boolean>;
  skills: SkillItem[];

  combat: {
    armorClass: number;
    speed: string;
    hpMax: number;
    hpCurrent: number;
    hpTemp: number;
    hitDiceTotal: string;
    hitDiceCurrent: string;
    deathSaves: {
      successes: [boolean, boolean, boolean];
      failures: [boolean, boolean, boolean];
    };
    exhaustion: number; // 0-6 (2024 rules)
    conditions: string[];
  };

  attacks: AttackItem[];
  currency: Currency;
  equipment: string;
  otherProficienciesAndLanguages: string;

  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  featuresAndTraits: string;

  // ================= PAGE 2: LORE & DETAILS =================
  details: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    appearanceUrl: string;
    appearanceNotes: string;
    alliesAndOrganizations: {
      name: string;
      symbolUrl: string;
      description: string;
    };
    backstory: string;
    additionalFeaturesAndTraits: string;
    treasure: string;
  };

  // ================= PAGE 3: SPELLCASTING =================
  spellcasting: {
    spellcastingClass: string;
    spellcastingAbility: AbilityKey | '';
    levels: SpellLevelBlock[]; // indexes 0 to 9
  };
}
