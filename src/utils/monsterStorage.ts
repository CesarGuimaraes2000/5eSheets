import { ABILITY_KEYS, SKILLS } from '../constants/dnd55Rules';
import { MONSTER_FILE_FORMAT } from '../constants/keys';
import { DICTIONARIES, type Lang } from '../i18n/translations';
import type { AbilityKey, CharacterSheet } from '../types/character';
import type { MonsterEntry, MonsterSheet, MonsterSkill } from '../types/monster';
import { calculateAbilityModifier } from './calculations';
import { extractDiceNotation, parseBonusString } from './dice';
import { createId, parseSheetFile } from './storage';

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const abilityRecord = <T,>(value: T): Record<AbilityKey, T> =>
  Object.fromEntries(ABILITY_KEYS.map((k) => [k, value])) as Record<AbilityKey, T>;

const ABILITY_SLUG_MAP: Record<string, AbilityKey> = {
  str: 'strength',
  strength: 'strength',
  for: 'strength',
  forca: 'strength',
  dex: 'dexterity',
  dexterity: 'dexterity',
  des: 'dexterity',
  destreza: 'dexterity',
  con: 'constitution',
  constitution: 'constitution',
  constituicao: 'constitution',
  int: 'intelligence',
  intelligence: 'intelligence',
  inteligencia: 'intelligence',
  wis: 'wisdom',
  wisdom: 'wisdom',
  sab: 'wisdom',
  sabedoria: 'wisdom',
  cha: 'charisma',
  charisma: 'charisma',
  car: 'charisma',
  carisma: 'charisma',
};

const SIZE_PT: Record<string, string> = {
  tiny: 'Miúdo',
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
  huge: 'Enorme',
  gargantuan: 'Imenso',
};

const CREATURE_TYPE_PT: Record<string, string> = {
  aberration: 'Aberração',
  beast: 'Fera',
  celestial: 'Celestial',
  construct: 'Constructo',
  dragon: 'Dragão',
  elemental: 'Elemental',
  fey: 'Feérico',
  fiend: 'Ínfero',
  giant: 'Gigante',
  humanoid: 'Humanoide',
  monstrosity: 'Monstruosidade',
  ooze: 'Limo',
  plant: 'Planta',
  undead: 'Morto-vivo',
};

const ALIGNMENT_PT: Record<string, string> = {
  'lawful good': 'Leal e Bom',
  'neutral good': 'Neutro e Bom',
  'chaotic good': 'Caótico e Bom',
  'lawful neutral': 'Leal e Neutro',
  neutral: 'Neutro',
  'true neutral': 'Neutro',
  'chaotic neutral': 'Caótico e Neutro',
  'lawful evil': 'Leal e Mau',
  'neutral evil': 'Neutro e Mau',
  'chaotic evil': 'Caótico e Mau',
  unaligned: 'Sem Tendência',
  'any alignment': 'Qualquer Tendência',
};

const DAMAGE_OR_CONDITION_PT: Record<string, string> = {
  acid: 'Ácido',
  bludgeoning: 'Concussão',
  cold: 'Frio',
  fire: 'Fogo',
  force: 'Energia',
  lightning: 'Elétrico',
  necrotic: 'Necrótico',
  piercing: 'Perfurante',
  poison: 'Veneno',
  psychic: 'Psíquico',
  radiant: 'Radiante',
  slashing: 'Cortante',
  thunder: 'Trovão',
  blinded: 'Cego',
  charmed: 'Enfeitiçado',
  deafened: 'Surdo',
  exhaustion: 'Exaustão',
  frightened: 'Amedrontado',
  grappled: 'Agarrado',
  incapacitated: 'Incapacitado',
  invisible: 'Invisível',
  paralyzed: 'Paralisado',
  petrified: 'Petrificado',
  poisoned: 'Envenenado',
  prone: 'Caído',
  restrained: 'Impedido',
  stunned: 'Atordoado',
  unconscious: 'Inconsciente',
};

const LANGUAGE_PT: Record<string, string> = {
  abyssal: 'Abissal',
  aquan: 'Aquan',
  auran: 'Auran',
  celestial: 'Celestial',
  common: 'Comum',
  'deep speech': 'Dialeto Subterrâneo',
  draconic: 'Dracônico',
  druidic: 'Druídico',
  dwarvish: 'Anão',
  elvish: 'Élfico',
  giant: 'Gigante',
  gnomish: 'Gnômico',
  goblin: 'Goblin',
  halfling: 'Halfling',
  ignan: 'Ignan',
  infernal: 'Infernal',
  orc: 'Orc',
  primordial: 'Primordial',
  sylvan: 'Silvestre',
  terran: 'Terran',
  undercommon: 'Subcomum',
  telepathy: 'Telepatia',
  all: 'Todos',
};

const SENSE_PT: Record<string, string> = {
  blindsight: 'Percepção às Cegas',
  darkvision: 'Visão no Escuro',
  tremorsense: 'Sentido Sísmico',
  truesight: 'Visão Verdadeira',
};

const CR_XP: Record<string, string> = {
  '0': '10',
  '1/8': '25',
  '1/4': '50',
  '1/2': '100',
  '1': '200',
  '2': '450',
  '3': '700',
  '4': '1.100',
  '5': '1.800',
  '6': '2.300',
  '7': '2.900',
  '8': '3.900',
  '9': '5.000',
  '10': '5.900',
  '11': '7.200',
  '12': '8.400',
  '13': '10.000',
  '14': '11.500',
  '15': '13.000',
  '16': '15.000',
  '17': '18.000',
  '18': '20.000',
  '19': '22.000',
  '20': '25.000',
  '21': '33.000',
  '22': '41.000',
  '23': '50.000',
  '24': '62.000',
  '25': '75.000',
  '26': '90.000',
  '27': '105.000',
  '28': '120.000',
  '29': '135.000',
  '30': '155.000',
};

const titleCase = (text: string): string =>
  text.replace(/\b\w/g, (ch) => ch.toUpperCase());

const toNumber = (val: unknown, fallback: number): number => {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.trunc(val);
  if (typeof val === 'string' && val.trim()) {
    const parsed = Number(val.trim());
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return fallback;
};

const toStr = (val: unknown, fallback = ''): string =>
  typeof val === 'string' ? val.trim() : typeof val === 'number' ? String(val) : fallback;

/** Computes standard 5e proficiency bonus from a CR string such as "1/4", "3", or "17". */
export function proficiencyFromCr(cr: string): number {
  const clean = cr.trim();
  if (!clean) return 2;
  let num = 0;
  if (clean.includes('/')) {
    const [a, b] = clean.split('/').map(Number);
    if (Number.isFinite(a) && Number.isFinite(b) && b > 0) num = a / b;
  } else {
    num = Number(clean);
  }
  if (!Number.isFinite(num) || num <= 4) return 2;
  return 2 + Math.floor((Math.min(30, num) - 1) / 4);
}

/** Extracts attack bonus (+X), Save DC (CD X / DC X), and damage formula from an entry description or explicit fields. */
export function analyzeMonsterEntryText(
  detail: string,
  explicit?: { atkBonus?: string; saveDc?: string; damage?: string },
): { atkBonus: number | null; saveDc: number | null; damageNotation: string | null } {
  let atkBonus: number | null = null;
  const expAtk = explicit?.atkBonus?.trim() ?? '';
  if (expAtk) {
    const compact = expAtk.replace(/\s+/g, '');
    if (/^[+-]?\d+$/.test(compact)) {
      atkBonus = Number.parseInt(compact, 10);
    } else if (!/\b(?:cd|dc)\b/i.test(expAtk)) {
      atkBonus = parseBonusString(expAtk, 0);
    }
  }
  if (atkBonus === null) {
    const atkMatch =
      detail.match(/([+-]\s*\d+)\s*(?:para atingir|to hit|de ataque|atq\b)/i) ??
      detail.match(/(?:ataque|attack)[^.:\n]{0,25}:\s*([+-]\s*\d+)/i);
    if (atkMatch) {
      const parsed = Number.parseInt(atkMatch[1].replace(/\s+/g, ''), 10);
      if (Number.isFinite(parsed)) atkBonus = parsed;
    }
  }

  let saveDc: number | null = null;
  const expDc = explicit?.saveDc?.trim() ?? '';
  if (expDc) {
    const m = expDc.match(/(\d+)/);
    if (m) saveDc = Number.parseInt(m[1], 10);
  }
  if (saveDc === null) {
    const dcMatch = detail.match(/\b(?:cd|dc)\s*[:=]?\s*(\d+)\b/i);
    if (dcMatch) {
      saveDc = Number.parseInt(dcMatch[1], 10);
    }
  }

  let damageNotation: string | null = null;
  const expDmg = explicit?.damage?.trim() ?? '';
  if (expDmg) {
    const parsedExp = extractDiceNotation(expDmg);
    if (parsedExp) damageNotation = parsedExp.notation;
  }
  if (damageNotation === null) {
    const parsedDetail = extractDiceNotation(detail);
    if (parsedDetail) damageNotation = parsedDetail.notation;
  }

  return { atkBonus, saveDc, damageNotation };
}

export const createBlankMonsterEntry = (
  init?: Partial<Omit<MonsterEntry, 'id'>>,
): MonsterEntry => ({
  id: createId(),
  name: init?.name ?? '',
  detail: init?.detail ?? '',
  atkBonus: init?.atkBonus ?? '',
  saveDc: init?.saveDc ?? '',
  damage: init?.damage ?? '',
});

export function createBlankMonster(lang: Lang = 'en'): MonsterSheet {
  return {
    schemaVersion: 1,
    id: createId(),
    updatedAt: Date.now(),
    name: '',
    size: '',
    creatureType: '',
    alignment: '',
    imageUrl: '',
    ac: 12,
    acType: '',
    hpCurrent: 20,
    hpMax: 20,
    hpTemp: 0,
    hpFormula: '3d8+6',
    speed: lang === 'pt' ? '9 m' : '30 ft',
    challengeRating: '1',
    proficiencyBonus: 2,
    xp: '200',
    initiativeBonus: 0,
    abilities: abilityRecord(10),
    savingThrowProficiencies: abilityRecord(false),
    skills: [],
    vulnerabilities: '',
    resistances: '',
    damageImmunities: '',
    conditionImmunities: '',
    senses: '',
    languages: '',
    conditions: [],
    traits: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    legendaryActions: [],
    lairActions: [],
    notes: '',
  };
}

function normalizeEntries(raw: unknown): MonsterEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MonsterEntry[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      const analyzed = analyzeMonsterEntryText(item);
      out.push(
        createBlankMonsterEntry({
          name: '',
          detail: item.trim(),
          atkBonus: analyzed.atkBonus !== null ? String(analyzed.atkBonus) : '',
          saveDc: analyzed.saveDc !== null ? String(analyzed.saveDc) : '',
          damage: analyzed.damageNotation ?? '',
        }),
      );
      continue;
    }
    if (!isObject(item)) continue;
    const name = toStr(item.name);
    const detail = toStr(item.detail || item.description);
    if (!name && !detail && raw.length > 0 && item.name === undefined) continue;
    const atkBonus = toStr(item.atkBonus);
    const saveDc = toStr(item.saveDc);
    const damage = toStr(item.damage);
    out.push({
      id: toStr(item.id) || createId(),
      name,
      detail,
      atkBonus,
      saveDc,
      damage,
    });
  }
  return out;
}

function normalizeSkills(raw: unknown): MonsterSkill[] {
  if (!Array.isArray(raw)) return [];
  const out: MonsterSkill[] = [];
  for (const item of raw) {
    if (!isObject(item)) continue;
    const name = toStr(item.name);
    if (!name) continue;
    out.push({
      id: toStr(item.id) || createId(),
      name,
      bonus: toNumber(item.bonus, 0),
    });
  }
  return out;
}

export function normalizeMonster(raw: unknown): MonsterSheet {
  const blank = createBlankMonster();
  const s = isObject(raw) ? raw : {};
  const abSource = isObject(s.abilities) ? s.abilities : {};
  const saveSource = isObject(s.savingThrowProficiencies) ? s.savingThrowProficiencies : {};

  const abilities = Object.fromEntries(
    ABILITY_KEYS.map((k) => [k, toNumber(abSource[k], blank.abilities[k])]),
  ) as Record<AbilityKey, number>;

  const savingThrowProficiencies = Object.fromEntries(
    ABILITY_KEYS.map((k) => [k, saveSource[k] === true]),
  ) as Record<AbilityKey, boolean>;

  const hpMax = Math.max(0, toNumber(s.hpMax, blank.hpMax));
  const hpCurrent = Math.max(0, toNumber(s.hpCurrent, hpMax));
  const cr = toStr(s.challengeRating, blank.challengeRating);

  return {
    schemaVersion: 1,
    id: toStr(s.id) || createId(),
    updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : Date.now(),
    name: toStr(s.name),
    size: toStr(s.size),
    creatureType: toStr(s.creatureType),
    alignment: toStr(s.alignment),
    imageUrl: toStr(s.imageUrl),
    ac: Math.max(0, toNumber(s.ac, blank.ac)),
    acType: toStr(s.acType),
    hpCurrent,
    hpMax,
    hpTemp: Math.max(0, toNumber(s.hpTemp, 0)),
    hpFormula: toStr(s.hpFormula),
    speed: toStr(s.speed, blank.speed),
    challengeRating: cr,
    proficiencyBonus: Math.max(
      1,
      toNumber(s.proficiencyBonus, proficiencyFromCr(cr)),
    ),
    xp: toStr(s.xp),
    initiativeBonus: toNumber(
      s.initiativeBonus,
      calculateAbilityModifier(abilities.dexterity),
    ),
    abilities,
    savingThrowProficiencies,
    skills: normalizeSkills(s.skills),
    vulnerabilities: toStr(s.vulnerabilities),
    resistances: toStr(s.resistances),
    damageImmunities: toStr(s.damageImmunities),
    conditionImmunities: toStr(s.conditionImmunities),
    senses: toStr(s.senses),
    languages: toStr(s.languages),
    conditions: Array.isArray(s.conditions)
      ? s.conditions.filter((c): c is string => typeof c === 'string')
      : [],
    traits: normalizeEntries(s.traits),
    actions: normalizeEntries(s.actions),
    bonusActions: normalizeEntries(s.bonusActions),
    reactions: normalizeEntries(s.reactions),
    legendaryActions: normalizeEntries(s.legendaryActions),
    lairActions: normalizeEntries(s.lairActions),
    notes: toStr(s.notes),
  };
}

function mapLabeledTerm(value: string, dictPt: Record<string, string>, lang: Lang): string {
  const key = value.trim().toLowerCase();
  if (!key) return '';
  if (lang === 'pt' && dictPt[key]) return dictPt[key];
  return titleCase(value.trim());
}

function extractBlueprintTypedList(
  rawList: unknown,
  dictPt: Record<string, string>,
  lang: Lang,
): string {
  if (!Array.isArray(rawList)) return '';
  const items: string[] = [];
  for (const entry of rawList) {
    if (typeof entry === 'string' && entry.trim()) {
      items.push(mapLabeledTerm(entry, dictPt, lang));
      continue;
    }
    if (!isObject(entry)) continue;
    const custom = toStr(entry.custom);
    const typeVal = toStr(entry.type ?? entry.name);
    if (typeVal.toLowerCase() === 'custom' && custom) {
      items.push(custom);
    } else if (custom && !typeVal) {
      items.push(custom);
    } else if (typeVal) {
      const mapped = mapLabeledTerm(typeVal, dictPt, lang);
      items.push(custom ? `${mapped} (${custom})` : mapped);
    }
  }
  return items.filter(Boolean).join(', ');
}

function mapBlueprintEntries(raw: unknown): MonsterEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: MonsterEntry[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      const analyzed = analyzeMonsterEntryText(item);
      entries.push(
        createBlankMonsterEntry({
          detail: item.trim(),
          atkBonus: analyzed.atkBonus !== null ? String(analyzed.atkBonus) : '',
          saveDc: analyzed.saveDc !== null ? String(analyzed.saveDc) : '',
          damage: analyzed.damageNotation ?? '',
        }),
      );
      continue;
    }
    if (!isObject(item)) continue;
    const name = toStr(item.name);
    const detail = toStr(item.detail ?? item.description);
    if (!name && !detail) continue;
    const analyzed = analyzeMonsterEntryText(detail);
    entries.push(
      createBlankMonsterEntry({
        name,
        detail,
        atkBonus: analyzed.atkBonus !== null ? String(analyzed.atkBonus) : '',
        saveDc: analyzed.saveDc !== null ? String(analyzed.saveDc) : '',
        damage: analyzed.damageNotation ?? '',
      }),
    );
  }
  return entries;
}

/** Converts a Giffyglyph Monster Maker blueprint JSON (`{ blueprint: ... }`) into a MonsterSheet. */
export function fromGiffyglyphBlueprint(raw: Json, lang: Lang = 'pt'): MonsterSheet {
  const bp = isObject(raw.blueprint) ? raw.blueprint : raw;
  const desc = isObject(bp.description) ? bp.description : {};
  const display = isObject(bp.display) ? bp.display : {};
  const image = isObject(display.image) ? display.image : {};
  const acObj = isObject(bp.ac) ? bp.ac : {};
  const hpObj = isObject(bp.hp) ? bp.hp : {};
  const speedObj = isObject(bp.speed) ? bp.speed : {};
  const abObj = isObject(bp.abilities) ? bp.abilities : {};
  const savesObj = isObject(bp.savingThrows) ? bp.savingThrows : {};
  const sensesObj = isObject(bp.senses) ? bp.senses : {};
  const chObj = isObject(bp.challenge) ? bp.challenge : {};
  const chCustom = isObject(chObj.custom) ? chObj.custom : {};

  const abilities: Record<AbilityKey, number> = {
    strength: toNumber(abObj.str ?? abObj.strength, 10),
    dexterity: toNumber(abObj.dex ?? abObj.dexterity, 10),
    constitution: toNumber(abObj.con ?? abObj.constitution, 10),
    intelligence: toNumber(abObj.int ?? abObj.intelligence, 10),
    wisdom: toNumber(abObj.wis ?? abObj.wisdom, 10),
    charisma: toNumber(abObj.cha ?? abObj.charisma, 10),
  };

  const cr = toStr(chCustom.rating) || toStr(chObj.rating, '1');
  const pb = Math.max(1, toNumber(chCustom.proficiency, proficiencyFromCr(cr)));
  const xp = toStr(chCustom.xp) || CR_XP[cr] || '';

  const savingThrowProficiencies = abilityRecord(false);
  if (Array.isArray(savesObj.manual)) {
    for (const entry of savesObj.manual) {
      const slug =
        typeof entry === 'string'
          ? entry
          : isObject(entry)
            ? toStr(entry.ability ?? entry.name)
            : '';
      const mapped = ABILITY_SLUG_MAP[slug.toLowerCase()];
      if (mapped) savingThrowProficiencies[mapped] = true;
    }
  }

  const skills: MonsterSkill[] = [];
  if (Array.isArray(bp.skills)) {
    for (const sk of bp.skills) {
      if (!isObject(sk)) continue;
      const custom = isObject(sk.custom) ? sk.custom : {};
      const rawName = toStr(custom.name) || toStr(sk.name);
      if (!rawName) continue;
      const normalizedKey = rawName.toLowerCase().replace(/[\s_-]+/g, '');
      const knownSkill = SKILLS.find(
        (k) => k.id.toLowerCase() === normalizedKey || k.name.toLowerCase().replace(/\s+/g, '') === normalizedKey,
      );
      const displayName = knownSkill ? (DICTIONARIES[lang].skills[knownSkill.id] ?? knownSkill.name) : titleCase(rawName);
      const explicitMod =
        sk.modifier !== undefined || sk.bonus !== undefined || custom.modifier !== undefined;
      let bonus = toNumber(sk.modifier ?? sk.bonus ?? custom.modifier, 0);
      if (!explicitMod && knownSkill) {
        const abMod = calculateAbilityModifier(abilities[knownSkill.ability]);
        const prof = toStr(sk.proficiency ?? custom.proficiency).toLowerCase();
        const mult = prof === 'expertise' ? 2 : prof === 'half' ? 0.5 : prof === 'none' ? 0 : 1;
        bonus = abMod + Math.floor(pb * mult);
      }
      skills.push({ id: createId(), name: displayName, bonus });
    }
  }

  const speedParts: string[] = [];
  const normalSpeed = toStr(speedObj.normal);
  if (normalSpeed) speedParts.push(normalSpeed);
  for (const [k, ptLabel] of [
    ['burrow', 'escavação'],
    ['climb', 'escalada'],
    ['fly', 'voo'],
    ['swim', 'natação'],
  ] as const) {
    const val = toStr(speedObj[k]);
    if (val) speedParts.push(`${lang === 'pt' ? ptLabel : k} ${val}`);
  }
  const otherSpeed = toStr(speedObj.other);
  if (otherSpeed) speedParts.push(otherSpeed);

  const senseParts: string[] = [];
  for (const key of ['blindsight', 'darkvision', 'tremorsense', 'truesight'] as const) {
    const val = toStr(sensesObj[key]);
    if (val) {
      const label = lang === 'pt' ? SENSE_PT[key] : titleCase(key);
      senseParts.push(`${label} ${val}`);
    }
  }
  const otherSense = toStr(sensesObj.other);
  if (otherSense) senseParts.push(otherSense);

  const ac = Math.max(0, toNumber(acObj.base, 10) + toNumber(acObj.modifier, 0));
  const hpMax = Math.max(1, toNumber(hpObj.average, 10) + toNumber(hpObj.modifier, 0));

  let notes = '';
  if (Array.isArray(bp.notes)) {
    notes = bp.notes
      .map((n) => (typeof n === 'string' ? n : isObject(n) ? toStr(n.detail ?? n.name) : ''))
      .filter(Boolean)
      .join('\n\n');
  } else if (typeof bp.notes === 'string') {
    notes = bp.notes;
  }

  return normalizeMonster({
    schemaVersion: 1,
    id: createId(),
    updatedAt: Date.now(),
    name: toStr(desc.name),
    size: mapLabeledTerm(toStr(desc.size), SIZE_PT, lang),
    creatureType: mapLabeledTerm(toStr(desc.type), CREATURE_TYPE_PT, lang),
    alignment: mapLabeledTerm(toStr(desc.alignment), ALIGNMENT_PT, lang),
    imageUrl: toStr(image.url),
    ac,
    acType: toStr(acObj.type),
    hpCurrent: hpMax,
    hpMax,
    hpTemp: 0,
    hpFormula: toStr(hpObj.roll),
    speed: speedParts.join(', ') || (lang === 'pt' ? '9 m' : '30 ft'),
    challengeRating: cr,
    proficiencyBonus: pb,
    xp,
    initiativeBonus: calculateAbilityModifier(abilities.dexterity),
    abilities,
    savingThrowProficiencies,
    skills,
    vulnerabilities: extractBlueprintTypedList(bp.vulnerabilities, DAMAGE_OR_CONDITION_PT, lang),
    resistances: extractBlueprintTypedList(bp.resistances, DAMAGE_OR_CONDITION_PT, lang),
    damageImmunities: extractBlueprintTypedList(bp.immunities, DAMAGE_OR_CONDITION_PT, lang),
    conditionImmunities: extractBlueprintTypedList(bp.conditions, DAMAGE_OR_CONDITION_PT, lang),
    senses: senseParts.join(', '),
    languages: extractBlueprintTypedList(bp.languages, LANGUAGE_PT, lang),
    conditions: [],
    traits: mapBlueprintEntries(bp.traits),
    actions: mapBlueprintEntries(bp.actions),
    bonusActions: mapBlueprintEntries(bp.bonusActions),
    reactions: mapBlueprintEntries(bp.reactions),
    legendaryActions: mapBlueprintEntries(bp.legendaryActions),
    lairActions: mapBlueprintEntries(bp.lairActions),
    notes,
  });
}

export function serializeMonster(monster: MonsterSheet): string {
  return JSON.stringify(
    {
      format: MONSTER_FILE_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      monster,
    },
    null,
    2,
  );
}

export function downloadMonster(monster: MonsterSheet): void {
  const blob = new Blob([serializeMonster(monster)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (monster.name || 'monster').replace(/[^\w\- ]+/g, '').trim();
  a.href = url;
  a.download = `${safeName || 'monster'}.monster.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function duplicateMonster(
  monster: MonsterSheet,
  lang: Lang = 'en',
  existingMonsters: MonsterSheet[] = [],
  numbered = false,
): MonsterSheet {
  const tr = DICTIONARIES[lang].common;
  const copy = normalizeMonster(JSON.parse(JSON.stringify(monster)) as unknown);
  const rawName = copy.name || DICTIONARIES[lang].monster.unnamedMonster;

  let nextName = `${rawName} (${tr.copySuffix})`;
  if (numbered) {
    const baseName = rawName.replace(/\s+#\d+$/, '').trim();
    let maxNum = 1;
    for (const m of existingMonsters) {
      const mBase = m.name.replace(/\s+#\d+$/, '').trim();
      if (mBase.toLowerCase() === baseName.toLowerCase()) {
        const match = m.name.match(/#(\d+)$/);
        const num = match ? Number.parseInt(match[1], 10) : 1;
        if (num > maxNum) maxNum = num;
      }
    }
    nextName = `${baseName} #${maxNum + 1}`;
  }

  return {
    ...copy,
    id: createId(),
    updatedAt: Date.now(),
    name: nextName,
    hpCurrent: copy.hpMax,
    hpTemp: 0,
    conditions: [],
  };
}

export type ImportedJsonResult =
  | { kind: 'character'; sheet: CharacterSheet }
  | { kind: 'monster'; monster: MonsterSheet };

/** Automatically detects Character JSON, Giffyglyph Monster Blueprint JSON, or native Monster JSON. */
export function parseAnyJsonFile(text: string, lang: Lang = 'en'): ImportedJsonResult {
  const tr = DICTIONARIES[lang].common;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(tr.invalidJson);
  }

  if (isObject(data)) {
    if (isObject(data.blueprint)) {
      return { kind: 'monster', monster: fromGiffyglyphBlueprint(data, lang) };
    }
    if (data.format === MONSTER_FILE_FORMAT && isObject(data.monster)) {
      return { kind: 'monster', monster: normalizeMonster(data.monster) };
    }
    if (typeof data.name === 'string' && typeof data.creatureType === 'string') {
      return { kind: 'monster', monster: normalizeMonster(data) };
    }
  }

  return { kind: 'character', sheet: parseSheetFile(text, lang) };
}
