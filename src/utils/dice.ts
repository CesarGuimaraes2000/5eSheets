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
const DICE_STORAGE_KEY = 'rodeo.owlbear.dice/pendingExternalRoll';
const DICE_CHANNEL_NAME = 'rodeo.owlbear.dice/external-roll';

/** Extracts a leading/embedded integer bonus from strings like "+7", "-1", or "5". */
export function parseBonusString(raw: string, fallback = 0): number {
  const compact = raw.replace(/\s+/g, '');
  if (!compact) return fallback;
  const match = compact.match(/^[+-]?\d+/) ?? compact.match(/([+-]?\d+)/);
  if (!match) return fallback;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
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
