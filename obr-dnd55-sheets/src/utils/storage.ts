import { z } from 'zod';
import type {
  AbilityKey,
  AttackItem,
  CharacterSheet,
  SkillItem,
  SpellItem,
  SpellLevelBlock,
} from '../types/character';
import { ABILITY_KEYS, SKILLS } from '../constants/dnd55Rules';
import { FILE_FORMAT } from '../constants/keys';
import { DICTIONARIES, type Lang } from '../i18n/translations';
import { computeDerivedStats } from './calculations';

/** Short random id (keeps room metadata small). */
export const createId = (): string =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

const abilityRecord = <T,>(value: T): Record<AbilityKey, T> =>
  Object.fromEntries(ABILITY_KEYS.map((k) => [k, value])) as Record<AbilityKey, T>;

export const createBlankSpell = (): SpellItem => ({
  id: createId(),
  name: '',
  prepared: false,
  castingTime: '',
  range: '',
  concentration: false,
  ritual: false,
  notes: '',
});

export const createBlankAttack = (): AttackItem => ({
  id: createId(),
  name: '',
  atkBonus: '',
  damageType: '',
  notes: '',
});

export function createBlankCharacter(ownerId = '', ownerName = ''): CharacterSheet {
  const sheet: CharacterSheet = {
    schemaVersion: 1,
    id: createId(),
    ownerId,
    ownerName,
    updatedAt: Date.now(),
    autoCalculate: true,
    manualStats: {
      proficiencyBonus: 2,
      abilityModifiers: abilityRecord(0),
      savingThrows: abilityRecord(0),
      skills: {},
      passivePerception: 10,
      initiative: 0,
      spellSaveDc: 10,
      spellAttackBonus: 2,
    },
    header: {
      characterName: '',
      classAndLevel: '',
      background: '',
      playerName: ownerName,
      speciesOrRace: '',
      alignment: '',
      experiencePoints: '',
    },
    abilities: abilityRecord(10),
    heroicInspiration: false,
    savingThrows: abilityRecord(false),
    skills: SKILLS.map((s) => ({ ...s, proficiency: 'none', customBonus: 0 })),
    combat: {
      armorClass: 10,
      speed: '30 ft',
      hpMax: 10,
      hpCurrent: 10,
      hpTemp: 0,
      hitDiceTotal: '1d8',
      hitDiceCurrent: '1',
      deathSaves: { successes: [false, false, false], failures: [false, false, false] },
      exhaustion: 0,
      conditions: [],
    },
    attacks: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    equipment: '',
    otherProficienciesAndLanguages: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    featuresAndTraits: '',
    details: {
      age: '',
      height: '',
      weight: '',
      eyes: '',
      skin: '',
      hair: '',
      appearanceUrl: '',
      appearanceNotes: '',
      alliesAndOrganizations: { name: '', symbolUrl: '', description: '' },
      backstory: '',
      additionalFeaturesAndTraits: '',
      treasure: '',
    },
    spellcasting: {
      spellcastingClass: '',
      spellcastingAbility: '',
      levels: Array.from({ length: 10 }, (_, level) => ({
        level,
        slotsTotal: 0,
        slotsExpended: 0,
        spells: [],
      })),
    },
  };
  sheet.manualStats = computeDerivedStats(sheet);
  return sheet;
}

// ---------------------------------------------------------------------------
// Normalization: merges any (possibly older / partial) JSON into a valid sheet.
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Recursively fills missing / wrongly-typed values using `defaults`. */
function mergeDefaults<T>(defaults: T, value: unknown): T {
  if (isObject(defaults)) {
    const source = isObject(value) ? value : {};
    const out: Json = {};
    for (const key of Object.keys(defaults)) {
      out[key] = mergeDefaults((defaults as Json)[key], source[key]);
    }
    // Keep extra keys of free-form records (e.g. manualStats.skills).
    if (Object.keys(defaults).length === 0 && isObject(value)) return { ...value } as T;
    return out as T;
  }
  if (Array.isArray(defaults)) return (Array.isArray(value) ? value : defaults) as T;
  if (typeof defaults === typeof value) return value as T;
  return defaults;
}

function normalizeSpell(raw: unknown): SpellItem {
  const base = mergeDefaults(createBlankSpell(), raw);
  return { ...base, id: base.id || createId() };
}

function normalizeLevels(raw: unknown): SpellLevelBlock[] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: 10 }, (_, level) => {
    const found = list.find((b) => isObject(b) && b.level === level) ?? list[level];
    const block = mergeDefaults<SpellLevelBlock>(
      { level, slotsTotal: 0, slotsExpended: 0, spells: [] },
      found,
    );
    return { ...block, level, spells: block.spells.map(normalizeSpell) };
  });
}

function normalizeSkills(raw: unknown): SkillItem[] {
  const list = Array.isArray(raw) ? raw.filter(isObject) : [];
  return SKILLS.map((def) => {
    const found = list.find((s) => s.id === def.id || s.name === def.name);
    const prof = found?.proficiency;
    return {
      ...def,
      proficiency: prof === 'proficient' || prof === 'expertise' ? prof : 'none',
      customBonus: typeof found?.customBonus === 'number' ? found.customBonus : 0,
    };
  });
}

export function normalizeSheet(raw: unknown): CharacterSheet {
  const blank = createBlankCharacter();
  const merged = mergeDefaults(blank, raw);
  const source = isObject(raw) ? raw : {};
  const spellSource = isObject(source.spellcasting) ? source.spellcasting : {};
  const ability = merged.spellcasting.spellcastingAbility;
  return {
    ...merged,
    schemaVersion: 1,
    id: merged.id || createId(),
    skills: normalizeSkills(source.skills),
    attacks: merged.attacks.map((a) => ({ ...mergeDefaults(createBlankAttack(), a) })),
    combat: {
      ...merged.combat,
      deathSaves: {
        successes: normalizeTriple(merged.combat.deathSaves.successes),
        failures: normalizeTriple(merged.combat.deathSaves.failures),
      },
      conditions: merged.combat.conditions.filter((c): c is string => typeof c === 'string'),
    },
    spellcasting: {
      ...merged.spellcasting,
      spellcastingAbility: ability && ABILITY_KEYS.includes(ability) ? ability : '',
      levels: normalizeLevels(spellSource.levels),
    },
  };
}

const normalizeTriple = (v: unknown): [boolean, boolean, boolean] => {
  const a = Array.isArray(v) ? v : [];
  return [a[0] === true, a[1] === true, a[2] === true];
};

// ---------------------------------------------------------------------------
// JSON import / export
// ---------------------------------------------------------------------------

const bareSheetSchema = z.looseObject({ header: z.looseObject({}) });

const fileSchema = z.object({
  format: z.literal(FILE_FORMAT),
  version: z.number(),
  sheet: bareSheetSchema,
});

export function parseSheetFile(text: string, lang: Lang = 'en'): CharacterSheet {
  const tr = DICTIONARIES[lang].common;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(tr.invalidJson);
  }
  const wrapped = fileSchema.safeParse(data);
  if (wrapped.success) return normalizeSheet(wrapped.data.sheet);
  const bare = bareSheetSchema.safeParse(data);
  if (bare.success) return normalizeSheet(bare.data);
  throw new Error(tr.notASheetJson);
}

export function serializeSheet(sheet: CharacterSheet): string {
  return JSON.stringify(
    { format: FILE_FORMAT, version: 1, exportedAt: new Date().toISOString(), sheet },
    null,
    2,
  );
}

export function downloadSheet(sheet: CharacterSheet): void {
  const blob = new Blob([serializeSheet(sheet)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (sheet.header.characterName || 'character').replace(/[^\w\- ]+/g, '').trim();
  a.href = url;
  a.download = `${safeName || 'character'}.dnd55.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Opens a file picker and resolves with the selected file contents. */
export function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}

/** Creates a copy of a sheet with a fresh id. */
export function duplicateSheet(sheet: CharacterSheet, lang: Lang = 'en'): CharacterSheet {
  const tr = DICTIONARIES[lang].common;
  const copy = normalizeSheet(JSON.parse(JSON.stringify(sheet)) as unknown);
  return {
    ...copy,
    id: createId(),
    updatedAt: Date.now(),
    header: {
      ...copy.header,
      characterName: `${copy.header.characterName || tr.unnamed} (${tr.copySuffix})`,
    },
  };
}
