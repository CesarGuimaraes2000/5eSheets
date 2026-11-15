import OBR from '@owlbear-rodeo/sdk';
import { DICE_EXT_ROLL_KEY, DICE_SHIM_ROLL_KEY } from '../constants/keys';

export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';
export type RollAdvantageMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';

export interface ExternalRollPayload {
  id: string;
  label?: string;
  dice?: Partial<Record<DiceType, number>>;
  notation?: string;
  bonus?: number;
  advantage?: RollAdvantageMode | null;
  hidden?: boolean;
}

const VALID_SIDES = new Set([4, 6, 8, 10, 12, 20, 100]);
const DICE_ORDER: DiceType[] = ['D100', 'D20', 'D12', 'D10', 'D8', 'D6', 'D4'];
const DICE_STORAGE_KEY = 'rodeo.owlbear.dice/pendingExternalRoll';
const DICE_CHANNEL_NAME = 'rodeo.owlbear.dice/external-roll';

/** True when a label/bonus string refers to a Save DC (CD / DC / Save) rather than an attack bonus. */
export function isSaveDcText(raw: string): boolean {
  return /\b(?:cd|dc)\s*\d*\b|\b(?:salv\w*|save)\b/i.test(raw);
}

/** Extracts an integer bonus from strings like "+7", "-1", or "5". Returns 0 for Save DC text. */
export function parseBonusString(raw: string, fallback = 0): number {
  if (isSaveDcText(raw)) return 0;
  const compact = raw.replace(/\s+/g, '');
  if (!compact) return fallback;
  const match = compact.match(/^[+-]?\d+$/) ?? compact.match(/^[+-]?\d+/) ?? compact.match(/([+-]?\d+)/);
  if (!match) return fallback;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

/** Extracts the hit die face type (e.g. "5d10" -> "D10") from hit dice strings, defaulting to D8. */
export function extractHitDieType(hitDiceTotal: string, hitDiceCurrent = ''): DiceType {
  for (const source of [hitDiceTotal, hitDiceCurrent]) {
    const match = source.match(/d(100|20|12|10|8|6|4)\b/i);
    if (match) return `D${match[1]}` as DiceType;
  }
  return 'D8';
}

/** Doubles dice counts for critical hit damage rolls (capped at 20 per die type). */
export function doubleDiceCounts(
  dice: Partial<Record<DiceType, number>>,
): Partial<Record<DiceType, number>> {
  const doubled: Partial<Record<DiceType, number>> = {};
  for (const key of Object.keys(dice) as DiceType[]) {
    const count = dice[key];
    if (count && count > 0) doubled[key] = Math.min(20, count * 2);
  }
  return doubled;
}

/** Formats dice counts + bonus into a compact label such as "2d8+3" or "1d10-1". */
export function formatDiceSummary(
  dice: Partial<Record<DiceType, number>>,
  bonus = 0,
): string {
  const parts: string[] = [];
  for (const key of DICE_ORDER) {
    const count = dice[key];
    if (count && count > 0) {
      parts.push(`${count}${key.toLowerCase()}`);
    }
  }
  const base = parts.join('+') || '0';
  if (bonus > 0) return `${base}+${bonus}`;
  if (bonus < 0) return `${base}${bonus}`;
  return base;
}

/**
 * Extracts the primary dice + modifier expression from a damage string
 * (e.g. "1d8+3 cortante" -> { dice: { D8: 1 }, bonus: 3, notation: "1d8+3" }).
 */
export function extractDiceNotation(
  raw: string,
): { dice: Partial<Record<DiceType, number>>; bonus: number; notation: string } | null {
  const exprMatch = raw.match(
    /(?:\d*d(?:100|20|12|10|8|6|4)(?:\s*[+-]\s*(?:\d*d(?:100|20|12|10|8|6|4)|\d+))*)/i,
  );
  if (!exprMatch) return null;

  const compact = exprMatch[0].replace(/\s+/g, '');
  const tokens = compact.match(/[+-]?[^+-]+/g) ?? [];
  const dice: Partial<Record<DiceType, number>> = {};
  let bonus = 0;

  for (const token of tokens) {
    const dieMatch = token.match(/^([+-]?)(\d*)d(\d+)$/i);
    if (dieMatch) {
      if (dieMatch[1] === '-') continue;
      const sides = Number.parseInt(dieMatch[3], 10);
      if (!VALID_SIDES.has(sides)) continue;
      const countRaw = dieMatch[2] ? Number.parseInt(dieMatch[2], 10) : 1;
      const count = Math.min(20, Math.max(0, countRaw));
      if (count <= 0) continue;
      const key = `D${sides}` as DiceType;
      dice[key] = Math.min(20, (dice[key] ?? 0) + count);
      continue;
    }

    if (/^[+-]?\d+$/.test(token)) {
      bonus += Number.parseInt(token, 10);
    }
  }

  if (Object.keys(dice).length === 0) return null;

  return { dice, bonus, notation: compact };
}

/** Dispatches a roll request to the DiceV2 extension via OBR player metadata (and local fallback channels). */
export async function sendRollToDiceExtension(
  payload: Omit<ExternalRollPayload, 'id'>,
): Promise<'obr' | 'standalone'> {
  const req: ExternalRollPayload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...payload,
  };

  try {
    window.localStorage.setItem(DICE_STORAGE_KEY, JSON.stringify(req));
  } catch {
    // Ignore storage access restrictions
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(DICE_CHANNEL_NAME);
      channel.postMessage(req);
      channel.close();
    }
  } catch {
    // Ignore BroadcastChannel unavailability
  }

  if (OBR.isAvailable) {
    await OBR.player.setMetadata({
      [DICE_EXT_ROLL_KEY]: req,
      [DICE_SHIM_ROLL_KEY]: req,
    });
    return 'obr';
  }

  return 'standalone';
}
