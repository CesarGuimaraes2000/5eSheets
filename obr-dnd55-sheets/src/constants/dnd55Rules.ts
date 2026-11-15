import type { AbilityKey } from '../types/character';

export const ABILITIES: { key: AbilityKey; label: string; abbr: string }[] = [
  { key: 'strength', label: 'Strength', abbr: 'STR' },
  { key: 'dexterity', label: 'Dexterity', abbr: 'DEX' },
  { key: 'constitution', label: 'Constitution', abbr: 'CON' },
  { key: 'intelligence', label: 'Intelligence', abbr: 'INT' },
  { key: 'wisdom', label: 'Wisdom', abbr: 'WIS' },
  { key: 'charisma', label: 'Charisma', abbr: 'CHA' },
];

export const ABILITY_KEYS: AbilityKey[] = ABILITIES.map((a) => a.key);

export const abilityAbbr = (key: AbilityKey | ''): string =>
  ABILITIES.find((a) => a.key === key)?.abbr ?? '';

/** The 18 skills of the sheet. Order matters: it is used by the compact summary. */
export const SKILLS: { id: string; name: string; ability: AbilityKey }[] = [
  { id: 'acrobatics', name: 'Acrobatics', ability: 'dexterity' },
  { id: 'animalHandling', name: 'Animal Handling', ability: 'wisdom' },
  { id: 'arcana', name: 'Arcana', ability: 'intelligence' },
  { id: 'athletics', name: 'Athletics', ability: 'strength' },
  { id: 'deception', name: 'Deception', ability: 'charisma' },
  { id: 'history', name: 'History', ability: 'intelligence' },
  { id: 'insight', name: 'Insight', ability: 'wisdom' },
  { id: 'intimidation', name: 'Intimidation', ability: 'charisma' },
  { id: 'investigation', name: 'Investigation', ability: 'intelligence' },
  { id: 'medicine', name: 'Medicine', ability: 'wisdom' },
  { id: 'nature', name: 'Nature', ability: 'intelligence' },
  { id: 'perception', name: 'Perception', ability: 'wisdom' },
  { id: 'performance', name: 'Performance', ability: 'charisma' },
  { id: 'persuasion', name: 'Persuasion', ability: 'charisma' },
  { id: 'religion', name: 'Religion', ability: 'intelligence' },
  { id: 'sleightOfHand', name: 'Sleight of Hand', ability: 'dexterity' },
  { id: 'stealth', name: 'Stealth', ability: 'dexterity' },
  { id: 'survival', name: 'Survival', ability: 'wisdom' },
];

/** D&D 2024 conditions. */
export const CONDITIONS: string[] = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Concentrating',
];

/** Proficiency bonus by total character level (1-20). */
export const PROFICIENCY_BY_LEVEL: number[] = [
  2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6,
];

/** XP thresholds per level (index = level - 1). */
export const XP_BY_LEVEL: number[] = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000,
  195000, 225000, 265000, 305000, 355000,
];

export const SPELL_LEVEL_LABELS: string[] = [
  'Cantrips',
  '1st Level',
  '2nd Level',
  '3rd Level',
  '4th Level',
  '5th Level',
  '6th Level',
  '7th Level',
  '8th Level',
  '9th Level',
];

export const MAX_EXHAUSTION = 6;
