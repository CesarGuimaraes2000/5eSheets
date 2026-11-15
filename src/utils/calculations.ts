import type { AbilityKey, CharacterSheet, DerivedStats, ProficiencyLevel } from '../types/character';
import { ABILITY_KEYS, PROFICIENCY_BY_LEVEL } from '../constants/dnd55Rules';

/** Ability score → modifier. */
export const calculateAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);

/** 3 → "+3", 0 → "+0", -1 → "-1". */
export const formatModifier = (mod: number): string => (mod >= 0 ? `+${mod}` : `${mod}`);

export function calculateSkillTotal(
  abilityMod: number,
  profBonus: number,
  level: ProficiencyLevel,
  customBonus = 0,
): number {
  switch (level) {
    case 'proficient':
      return abilityMod + profBonus + customBonus;
    case 'expertise':
      return abilityMod + profBonus * 2 + customBonus;
    default:
      return abilityMod + customBonus;
  }
}

export const calculatePassivePerception = (perceptionTotal: number): number => 10 + perceptionTotal;

export const calculateSpellSaveDC = (profBonus: number, abilityMod: number): number =>
  8 + profBonus + abilityMod;

export const calculateSpellAttackBonus = (profBonus: number, abilityMod: number): number =>
  profBonus + abilityMod;

/**
 * Total character level from the free text "Class & Level" field.
 * "Fighter 5" → 5, "Fighter 3 / Wizard 2" → 5, "Rogue" → 1.
 */
export function parseTotalLevel(classAndLevel: string): number {
  const numbers = classAndLevel.match(/\d+/g);
  if (!numbers) return 1;
  const total = numbers.map(Number).reduce((sum, n) => sum + n, 0);
  return Math.min(20, Math.max(1, total));
}

export const proficiencyBonusForLevel = (level: number): number =>
  PROFICIENCY_BY_LEVEL[Math.min(20, Math.max(1, level)) - 1];

/** Computes every automatic value of the sheet from its raw data. */
export function computeDerivedStats(sheet: CharacterSheet): DerivedStats {
  const proficiencyBonus = proficiencyBonusForLevel(parseTotalLevel(sheet.header.classAndLevel));

  const abilityModifiers = Object.fromEntries(
    ABILITY_KEYS.map((k) => [k, calculateAbilityModifier(sheet.abilities[k])]),
  ) as Record<AbilityKey, number>;

  const savingThrows = Object.fromEntries(
    ABILITY_KEYS.map((k) => [
      k,
      abilityModifiers[k] + (sheet.savingThrows[k] ? proficiencyBonus : 0),
    ]),
  ) as Record<AbilityKey, number>;

  const skills: Record<string, number> = {};
  for (const skill of sheet.skills) {
    skills[skill.id] = calculateSkillTotal(
      abilityModifiers[skill.ability],
      proficiencyBonus,
      skill.proficiency,
      skill.customBonus ?? 0,
    );
  }

  const castingAbility = sheet.spellcasting.spellcastingAbility;
  const castingMod = castingAbility ? abilityModifiers[castingAbility] : 0;

  return {
    proficiencyBonus,
    abilityModifiers,
    savingThrows,
    skills,
    passivePerception: calculatePassivePerception(skills['perception'] ?? abilityModifiers.wisdom),
    initiative: abilityModifiers.dexterity,
    spellSaveDc: calculateSpellSaveDC(proficiencyBonus, castingMod),
    spellAttackBonus: calculateSpellAttackBonus(proficiencyBonus, castingMod),
  };
}

/** The values the sheet should display: automatic or manual depending on the toggle. */
export function getEffectiveStats(sheet: CharacterSheet): DerivedStats {
  if (sheet.autoCalculate) return computeDerivedStats(sheet);
  // Fill gaps (e.g. a skill added after switching to manual) with computed values.
  const auto = computeDerivedStats(sheet);
  return {
    ...auto,
    ...sheet.manualStats,
    abilityModifiers: { ...auto.abilityModifiers, ...sheet.manualStats.abilityModifiers },
    savingThrows: { ...auto.savingThrows, ...sheet.manualStats.savingThrows },
    skills: { ...auto.skills, ...sheet.manualStats.skills },
  };
}

/** Clamp helper for numeric inputs. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
