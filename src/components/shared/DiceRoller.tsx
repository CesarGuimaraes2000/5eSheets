import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Dices,
  Flame,
  HeartPulse,
  Minus,
  Plus,
  ShieldAlert,
  Swords,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { formatModifier } from '../../utils/calculations';
import {
  doubleDiceCounts,
  extractDiceNotation,
  formatDiceSummary,
  sendRollToDiceExtension,
  type DiceType,
  type ExternalRollPayload,
  type RollAdvantageMode,
} from '../../utils/dice';
import { NumberInput, cx } from './ui';

export interface PromptRollOptions {
  label: string;
  bonus: number;
  damageRaw?: string;
  isSaveDc?: boolean;
  dcValue?: number;
}

export interface PromptHitDiceOptions {
  label: string;
  dieType: DiceType;
  conMod: number;
}

export interface PromptDamageOptions {
  label: string;
  damageRaw: string;
}

interface DiceRollerContextValue {
  promptRoll: (opts: PromptRollOptions) => void;
  promptHitDice: (opts: PromptHitDiceOptions) => void;
  promptDamage: (opts: PromptDamageOptions) => void;
}

const DiceRollerContext = createContext<DiceRollerContextValue>({
  promptRoll: () => {},
  promptHitDice: () => {},
  promptDamage: () => {},
});

export function useDiceRoller() {
  return useContext(DiceRollerContext);
}

/** Provides roll modals (d20 / Hit Dice / Save DC / Damage / Crit) and dispatches rolls to DiceV2. */
export function DiceRollerProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [activePrompt, setActivePrompt] = useState<PromptRollOptions | null>(null);
  const [activeHitDice, setActiveHitDice] = useState<PromptHitDiceOptions | null>(null);
  const [hitDiceCount, setHitDiceCount] = useState(1);
  const [customBonus, setCustomBonus] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToastMsg(null), 4200);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const hasOpenModal = activePrompt !== null || activeHitDice !== null;

  useEffect(() => {
    if (!hasOpenModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePrompt(null);
        setActiveHitDice(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasOpenModal]);

  const dispatchAndNotify = useCallback(
    async (
      payload: Omit<ExternalRollPayload, 'id'>,
      standaloneSummary: string,
    ) => {
      const target = await sendRollToDiceExtension(payload);
      if (target === 'obr') {
        showToast(t.roll.sentToDice(payload.label ?? 'Dice'));
      } else {
        showToast(t.roll.standaloneNotice(standaloneSummary));
      }
    },
    [showToast, t],
  );

  const promptRoll = useCallback((opts: PromptRollOptions) => {
    setActiveHitDice(null);
    setActivePrompt(opts);
    setCustomBonus(opts.isSaveDc ? 0 : Math.trunc(opts.bonus));
  }, []);

  const promptHitDice = useCallback((opts: PromptHitDiceOptions) => {
    setActivePrompt(null);
    setActiveHitDice(opts);
    setHitDiceCount(1);
    setCustomBonus(Math.trunc(opts.conMod));
  }, []);

  const promptDamage = useCallback(
    (opts: PromptDamageOptions) => {
      const parsed = extractDiceNotation(opts.damageRaw);
      if (!parsed) return;
      void dispatchAndNotify(
        {
          label: opts.label,
          dice: parsed.dice,
          bonus: parsed.bonus,
          advantage: null,
        },
        `${opts.label}: ${parsed.notation}`,
      );
    },
    [dispatchAndNotify],
  );

  const updateHitDiceCount = (nextCount: number) => {
    const clamped = Math.min(20, Math.max(1, Math.trunc(nextCount)));
    setHitDiceCount(clamped);
    if (activeHitDice) {
      setCustomBonus(clamped * Math.trunc(activeHitDice.conMod));
    }
  };

  const parsedDamage = useMemo(
    () => (activePrompt?.damageRaw ? extractDiceNotation(activePrompt.damageRaw) : null),
    [activePrompt],
  );

  const critSummary = useMemo(() => {
    if (!parsedDamage) return null;
    const critDice = doubleDiceCounts(parsedDamage.dice);
    return {
      dice: critDice,
      bonus: parsedDamage.bonus,
      notation: formatDiceSummary(critDice, parsedDamage.bonus),
    };
  }, [parsedDamage]);

  const handleRollD20 = async (mode: RollAdvantageMode) => {
    if (!activePrompt) return;
    const label = activePrompt.label;
    const bonus = Math.trunc(customBonus);
    setActivePrompt(null);

    const modeTag =
      mode === 'ADVANTAGE'
        ? ` (${t.roll.advantage})`
        : mode === 'DISADVANTAGE'
          ? ` (${t.roll.disadvantage})`
          : '';
    const diceSummary = bonus !== 0 ? `1d20${formatModifier(bonus)}` : '1d20';

    await dispatchAndNotify(
      {
        label,
        dice: { D20: 1 },
        bonus,
        advantage: mode === 'NORMAL' ? null : mode,
      },
      `${label}: ${diceSummary}${modeTag}`,
    );
  };

  const handleRollDamageVariant = async (critical: boolean) => {
    if (!activePrompt || !parsedDamage) return;
    const dice = critical && critSummary ? critSummary.dice : parsedDamage.dice;
    const notation = critical && critSummary ? critSummary.notation : parsedDamage.notation;
    const label = `${activePrompt.label} — ${t.table.damage}${critical ? ' (Crit)' : ''}`;
    setActivePrompt(null);

    await dispatchAndNotify(
      {
        label,
        dice,
        bonus: parsedDamage.bonus,
        advantage: null,
      },
      `${label}: ${notation}`,
    );
  };

  const handleRollHitDice = async () => {
    if (!activeHitDice) return;
    const label = activeHitDice.label;
    const dice: Partial<Record<DiceType, number>> = { [activeHitDice.dieType]: hitDiceCount };
    const bonus = Math.trunc(customBonus);
    const summary = formatDiceSummary(dice, bonus);
    setActiveHitDice(null);

    await dispatchAndNotify(
      {
        label,
        dice,
        bonus,
        advantage: null,
      },
      `${label}: ${summary}`,
    );
  };

  const closeAll = () => {
    setActivePrompt(null);
    setActiveHitDice(null);
  };

  const value = useMemo<DiceRollerContextValue>(
    () => ({ promptRoll, promptHitDice, promptDamage }),
    [promptRoll, promptHitDice, promptDamage],
  );

  const hitDiceSummary = activeHitDice
    ? formatDiceSummary({ [activeHitDice.dieType]: hitDiceCount }, customBonus)
    : '';

  return (
    <DiceRollerContext.Provider value={value}>
      {children}

      {activePrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 p-4 backdrop-blur-xs"
          onClick={closeAll}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dice-roll-modal-title"
        >
          <div
            className="panel w-full max-w-sm border-gold-500/50 bg-ink-900/95 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-ink-700/70 pb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-gold-400 uppercase">
                  <Dices className="h-3.5 w-3.5" />
                  <span>{t.roll.modalTitle}</span>
                </div>
                <h3
                  id="dice-roll-modal-title"
                  className="mt-0.5 truncate font-display text-lg font-bold text-ink-100"
                >
                  {activePrompt.label}
                </h3>
                <p className="mt-0.5 text-xs text-ink-400">{t.roll.subtitle}</p>
              </div>
              <button
                type="button"
                className="btn-icon shrink-0"
                onClick={closeAll}
                aria-label={t.roll.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activePrompt.isSaveDc && (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-arcane-500/40 bg-arcane-500/10 px-3 py-1.5 text-xs font-medium text-arcane-400">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>{t.roll.dcNotice(activePrompt.dcValue)}</span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-850/80 px-3 py-2">
              <div className="flex flex-col">
                <span className="field-label">{t.roll.diceLabel}</span>
                <span className="font-display text-base font-bold text-ink-100">
                  1d20 <span className="text-gold-300">{formatModifier(customBonus)}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="field-label mr-1">{t.roll.bonusLabel}</span>
                <button
                  type="button"
                  className="btn-icon border border-ink-700 bg-ink-800"
                  aria-label="-1"
                  onClick={() => setCustomBonus((b) => b - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <NumberInput
                  value={customBonus}
                  onChange={setCustomBonus}
                  className="h-7 w-14 py-0! text-sm! font-bold text-gold-300!"
                />
                <button
                  type="button"
                  className="btn-icon border border-ink-700 bg-ink-800"
                  aria-label="+1"
                  onClick={() => setCustomBonus((b) => b + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => void handleRollD20('NORMAL')}
                className={cx(
                  'btn flex-col gap-1 border border-gold-500/60 bg-gold-500/15 py-2.5 text-gold-300 hover:bg-gold-500/25',
                )}
              >
                <Dices className="h-4 w-4" />
                <span className="text-xs font-bold">{t.roll.normal}</span>
                <span className="text-[10px] font-normal text-ink-300">{t.roll.normalHint}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleRollD20('ADVANTAGE')}
                className={cx(
                  'btn flex-col gap-1 border border-life-500/60 bg-life-500/15 py-2.5 text-life-400 hover:bg-life-500/25',
                )}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-bold">{t.roll.advantage}</span>
                <span className="text-[10px] font-normal text-ink-300">
                  {t.roll.advantageHint}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleRollD20('DISADVANTAGE')}
                className={cx(
                  'btn flex-col gap-1 border border-blood-500/60 bg-blood-700/25 py-2.5 text-blood-400 hover:bg-blood-700/40',
                )}
              >
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-bold">{t.roll.disadvantage}</span>
                <span className="text-[10px] font-normal text-ink-300">
                  {t.roll.disadvantageHint}
                </span>
              </button>
            </div>

            {parsedDamage && critSummary && (
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  onClick={() => void handleRollDamageVariant(false)}
                  className="btn-ghost justify-center border-gold-500/35 text-gold-300 hover:border-gold-500/60"
                >
                  <Swords className="h-3.5 w-3.5" />
                  {t.roll.rollDamageBtn(parsedDamage.notation)}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRollDamageVariant(true)}
                  className="btn border border-blood-500/50 bg-blood-700/25 text-blood-400 hover:bg-blood-700/45"
                >
                  <Flame className="h-3.5 w-3.5" />
                  {t.roll.rollCritDamageBtn(critSummary.notation)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeHitDice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 p-4 backdrop-blur-xs"
          onClick={closeAll}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hit-dice-modal-title"
        >
          <div
            className="panel w-full max-w-sm border-gold-500/50 bg-ink-900/95 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-ink-700/70 pb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-gold-400 uppercase">
                  <HeartPulse className="h-3.5 w-3.5" />
                  <span>{t.roll.modalTitle}</span>
                </div>
                <h3
                  id="hit-dice-modal-title"
                  className="mt-0.5 truncate font-display text-lg font-bold text-ink-100"
                >
                  {activeHitDice.label}
                </h3>
                <p className="mt-0.5 text-xs text-ink-400">{t.roll.hitDiceSubtitle}</p>
              </div>
              <button
                type="button"
                className="btn-icon shrink-0"
                onClick={closeAll}
                aria-label={t.roll.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-850/80 px-3 py-2">
                <span className="field-label">
                  {t.roll.diceCountLabel} ({activeHitDice.dieType.toLowerCase()})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn-icon border border-ink-700 bg-ink-800"
                    aria-label="-1"
                    onClick={() => updateHitDiceCount(hitDiceCount - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <NumberInput
                    value={hitDiceCount}
                    min={1}
                    max={20}
                    onChange={updateHitDiceCount}
                    className="h-7 w-14 py-0! text-sm! font-bold text-ink-100!"
                  />
                  <button
                    type="button"
                    className="btn-icon border border-ink-700 bg-ink-800"
                    aria-label="+1"
                    onClick={() => updateHitDiceCount(hitDiceCount + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-850/80 px-3 py-2">
                <span className="field-label">
                  {t.roll.bonusLabel} ({t.abilities.constitution.abbr})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn-icon border border-ink-700 bg-ink-800"
                    aria-label="-1"
                    onClick={() => setCustomBonus((b) => b - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <NumberInput
                    value={customBonus}
                    onChange={setCustomBonus}
                    className="h-7 w-14 py-0! text-sm! font-bold text-gold-300!"
                  />
                  <button
                    type="button"
                    className="btn-icon border border-ink-700 bg-ink-800"
                    aria-label="+1"
                    onClick={() => setCustomBonus((b) => b + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleRollHitDice()}
              className="btn-primary mt-3 w-full justify-center py-2.5 text-sm"
            >
              <Dices className="h-4 w-4" />
              {t.roll.rollDiceBtn(hitDiceSummary)}
            </button>
          </div>
        </div>
      )}

      {toastMsg && (
        <div
          className="animate-fade-in fixed right-4 bottom-4 z-50 max-w-xs rounded-lg border border-gold-500/50 bg-ink-900/95 px-3 py-2 text-xs text-ink-100 shadow-lg"
          role="status"
        >
          {toastMsg}
        </div>
      )}
    </DiceRollerContext.Provider>
  );
}
