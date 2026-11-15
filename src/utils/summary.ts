import type { CharacterSheet } from '../types/character';
import type { CharacterSummary, SummarySpell } from '../types/summary';
import { ABILITY_KEYS, SKILLS, abilityAbbr } from '../constants/dnd55Rules';
import { getEffectiveStats } from './calculations';
import { extractDiceNotation, isSaveDcText } from './dice';

const MAX_ATTACKS = 8;
const cut = (s: string, max: number): string => (s.length > max ? s.slice(0, max) : s);

/** Builds the compact summary shared with the room from a full sheet. */
export function toSummary(sheet: CharacterSheet): CharacterSummary {
  const stats = getEffectiveStats(sheet);
  const c = sheet.combat;

  const skillsById = new Map(sheet.skills.map((s) => [s.id, s]));
  const profCode = { none: '0', proficient: '1', expertise: '2' } as const;

  const spells: SummarySpell[] = [];
  for (const block of sheet.spellcasting.levels) {
    for (const spell of block.spells) {
      if (!spell.name.trim()) continue;
      // Cantrips are always available; leveled spells only when prepared.
      if (block.level > 0 && !spell.prepared) continue;
      const isDc =
        spell.rollMode === 'dc' ||
        isSaveDcText(spell.damage ?? '') ||
        isSaveDcText(spell.notes ?? '');
      const flags =
        (spell.prepared ? 1 : 0) |
        (spell.concentration ? 2 : 0) |
        (spell.ritual ? 4 : 0) |
        (isDc ? 8 : 0);
      const rawDmg = spell.damage?.trim() || extractDiceNotation(spell.notes ?? '')?.notation || '';
      const dmg = cut(rawDmg, 24);
      spells.push(
        dmg
          ? [cut(spell.name, 40), block.level, flags, cut(spell.castingTime, 16), cut(spell.range, 16), dmg]
          : [cut(spell.name, 40), block.level, flags, cut(spell.castingTime, 16), cut(spell.range, 16)],
      );
    }
  }

  const levels = sheet.spellcasting.levels.slice(1, 10);
  const hasSpellcasting =
    sheet.spellcasting.spellcastingAbility !== '' ||
    spells.length > 0 ||
    levels.some((l) => l.slotsTotal > 0);

  return {
    v: 1,
    id: sheet.id,
    o: sheet.ownerId,
    on: cut(sheet.ownerName, 40),
    u: sheet.updatedAt,
    n: cut(sheet.header.characterName || 'Unnamed', 60),
    cl: cut(sheet.header.classAndLevel, 60),
    sp: cut(sheet.header.speciesOrRace, 40),
    img: sheet.details.appearanceUrl.length <= 300 ? sheet.details.appearanceUrl : '',
    ac: c.armorClass,
    ini: stats.initiative,
    spd: cut(c.speed, 20),
    hp: [c.hpCurrent, c.hpMax, c.hpTemp],
    hd: [cut(c.hitDiceCurrent, 12), cut(c.hitDiceTotal, 20)],
    ds: [c.deathSaves.successes.filter(Boolean).length, c.deathSaves.failures.filter(Boolean).length],
    ex: c.exhaustion,
    insp: sheet.heroicInspiration ? 1 : 0,
    cnd: c.conditions.slice(0, 16),
    pb: stats.proficiencyBonus,
    pp: stats.passivePerception,
    ab: ABILITY_KEYS.map((k) => sheet.abilities[k]),
    am: ABILITY_KEYS.map((k) => stats.abilityModifiers[k]),
    sv: ABILITY_KEYS.map((k) => stats.savingThrows[k]),
    svp: ABILITY_KEYS.reduce((mask, k, i) => mask | (sheet.savingThrows[k] ? 1 << i : 0), 0),
    sk: SKILLS.map((s) => stats.skills[s.id] ?? 0),
    skp: SKILLS.map((s) => profCode[skillsById.get(s.id)?.proficiency ?? 'none']).join(''),
    atk: sheet.attacks
      .filter((a) => a.name.trim())
      .slice(0, MAX_ATTACKS)
      .map((a) => [cut(a.name, 40), cut(a.atkBonus, 10), cut(a.damageType, 40)]),
    sc: hasSpellcasting
      ? {
          cls: cut(sheet.spellcasting.spellcastingClass, 30),
          a: abilityAbbr(sheet.spellcasting.spellcastingAbility),
          dc: stats.spellSaveDc,
          at: stats.spellAttackBonus,
          sl: levels.map((l) => [l.slotsTotal, l.slotsExpended]),
          sp: spells,
        }
      : null,
  };
}

/**
 * Applies the "live" values that can change at the table (HP, slots, death saves...)
 * back onto the full sheet, so the exported JSON reflects the session.
 */
export function applySummaryToSheet(sheet: CharacterSheet, s: CharacterSummary): CharacterSheet {
  const triple = (count: number): [boolean, boolean, boolean] => [count > 0, count > 1, count > 2];
  return {
    ...sheet,
    updatedAt: Math.max(sheet.updatedAt, s.u),
    heroicInspiration: s.insp === 1,
    combat: {
      ...sheet.combat,
      hpCurrent: s.hp[0],
      hpMax: s.hp[1],
      hpTemp: s.hp[2],
      hitDiceCurrent: s.hd[0],
      deathSaves: { successes: triple(s.ds[0]), failures: triple(s.ds[1]) },
      exhaustion: s.ex,
      conditions: [...s.cnd],
    },
    spellcasting: {
      ...sheet.spellcasting,
      levels: sheet.spellcasting.levels.map((block) => {
        const slot = block.level > 0 ? s.sc?.sl[block.level - 1] : undefined;
        return slot ? { ...block, slotsExpended: slot[1] } : block;
      }),
    },
  };
}

/** True when the live values of a summary differ from the sheet's. */
export function summaryDiffersFromSheet(sheet: CharacterSheet, s: CharacterSummary): boolean {
  const live = (x: CharacterSummary) =>
    JSON.stringify([x.hp, x.hd[0], x.ds, x.ex, x.insp, x.cnd, x.sc?.sl.map((l) => l[1]) ?? []]);
  return live(toSummary(sheet)) !== live(s);
}

export function isCharacterSummary(value: unknown): value is CharacterSummary {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<CharacterSummary>;
  return (
    v.v === 1 &&
    typeof v.id === 'string' &&
    typeof v.n === 'string' &&
    Array.isArray(v.hp) &&
    Array.isArray(v.sk) &&
    Array.isArray(v.ab)
  );
}

/** UTF-8 byte size of a value once serialized. */
export const byteSize = (value: unknown): number =>
  new TextEncoder().encode(JSON.stringify(value) ?? '').length;
