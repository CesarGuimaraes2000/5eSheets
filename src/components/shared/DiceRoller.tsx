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
import { Dices, Minus, Plus, Swords, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { formatModifier } from '../../utils/calculations';
import {
  extractDiceNotation,
  sendRollToDiceExtension,
  type RollAdvantageMode,
} from '../../utils/dice';
import { NumberInput, cx } from './ui';

export interface PromptRollOptions {
  label: string;
  bonus: number;
  damageRaw?: string;
}

interface DiceRollerContextValue {
  promptRoll: (opts: PromptRollOptions) => void;
}

const DiceRollerContext = createContext<DiceRollerContextValue>({
  promptRoll: () => {},
});

export function useDiceRoller() {
  return useContext(DiceRollerContext);
}

/** Provides the roll-mode modal (Normal / Advantage / Disadvantage / Damage) and dispatches rolls to DiceV2. */
export function DiceRollerProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [activePrompt, setActivePrompt] = useState<PromptRollOptions | null>(null);
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

  useEffect(() => {
    if (!activePrompt) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePrompt(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePrompt]);

  const promptRoll = useCallback((opts: PromptRollOptions) => {
    setActivePrompt(opts);
    setCustomBonus(Math.trunc(opts.bonus));
  }, []);

  const parsedDamage = useMemo(
    () => (activePrompt?.damageRaw ? extractDiceNotation(activePrompt.damageRaw) : null),
    [activePrompt],
  );

  const handleRollD20 = async (mode: RollAdvantageMode) => {
    if (!activePrompt) return;
    const label = activePrompt.label;
    const bonus = Math.trunc(customBonus);
    setActivePrompt(null);

    const target = await sendRollToDiceExtension({
      label,
      dice: { D20: 1 },
      bonus,
      advantage: mode === 'NORMAL' ? null : mode,
    });

    if (target === 'obr') {
      showToast(t.roll.sentToDice(label));
    } else {
      const modeTag =
        mode === 'ADVANTAGE'
          ? ` (${t.roll.advantage})`
          : mode === 'DISADVANTAGE'
            ? ` (${t.roll.disadvantage})`
            : '';
      const diceSummary = bonus !== 0 ? `1d20${formatModifier(bonus)}` : '1d20';
      showToast(t.roll.standaloneNotice(`${label}: ${diceSummary}${modeTag}`));
    }
  };

  const handleRollDamage = async () => {
    if (!activePrompt || !parsedDamage) return;
    const label = `${activePrompt.label} — ${t.table.damage}`;
    setActivePrompt(null);

    const target = await sendRollToDiceExtension({
      label,
      dice: parsedDamage.dice,
      bonus: parsedDamage.bonus,
      advantage: null,
    });

    if (target === 'obr') {
      showToast(t.roll.sentToDice(label));
    } else {
      showToast(t.roll.standaloneNotice(`${label}: ${parsedDamage.notation}`));
    }
  };

  const value = useMemo<DiceRollerContextValue>(() => ({ promptRoll }), [promptRoll]);

  return (
    <DiceRollerContext.Provider value={value}>
      {children}

      {activePrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 p-4 backdrop-blur-xs"
          onClick={() => setActivePrompt(null)}
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
                onClick={() => setActivePrompt(null)}
                aria-label={t.roll.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-850/80 px-3 py-2">
              <div className="flex flex-col">
                <span className="field-label">{t.roll.diceLabel}</span>
                <span className="font-display text-base font-bold text-ink-100">
                  1d20{' '}
                  <span className="text-gold-300">{formatModifier(customBonus)}</span>
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

            {parsedDamage && (
              <button
                type="button"
                onClick={() => void handleRollDamage()}
                className="btn-ghost mt-2 w-full justify-center border-gold-500/35 text-gold-300 hover:border-gold-500/60"
              >
                <Swords className="h-3.5 w-3.5" />
                {t.roll.rollDamageBtn(parsedDamage.notation)}
              </button>
            )}
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
