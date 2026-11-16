import type { AbilityKey } from './character';

export interface MonsterSkill {
  id: string;
  name: string;
  bonus: number;
}

export interface MonsterEntry {
  id: string;
  name: string;
  detail: string;
  atkBonus?: string;
  saveDc?: string;
  damage?: string;
  cost?: number;
}

export interface MonsterSheet {
  schemaVersion: 1;
  id: string;
  updatedAt: number;

  name: string;
  size: string;
  creatureType: string;
  alignment: string;
  imageUrl: string;

  ac: number;
  acType: string;
  hpCurrent: number;
  hpMax: number;
  hpTemp: number;
  hpFormula: string;
  speed: string;

  challengeRating: string;
  proficiencyBonus: number;
  xp: string;
  initiativeBonus: number;

  abilities: Record<AbilityKey, number>;
  savingThrowProficiencies: Record<AbilityKey, boolean>;
  skills: MonsterSkill[];

  vulnerabilities: string;
  resistances: string;
  damageImmunities: string;
  conditionImmunities: string;
  senses: string;
  languages: string;

  conditions: string[];

  traits: MonsterEntry[];
  actions: MonsterEntry[];
  bonusActions: MonsterEntry[];
  reactions: MonsterEntry[];
  legendaryResistancesTotal: number;
  legendaryResistancesUsed: number;
  legendaryActionsTotal: number;
  legendaryActionsUsed: number;
  legendaryActions: MonsterEntry[];
  lairActionsInitiative: number;
  lairActions: MonsterEntry[];
  notes: string;
}
