import { Dices } from 'lucide-react';
import type { AbilityKey } from '../../types/character';
import { useI18n } from '../../i18n/I18nContext';
import type { SheetCtx } from '../sheetContext';
import { DerivedValue } from './DerivedValue';
import { useDiceRoller } from './DiceRoller';
import { NumberInput } from './ui';

/** Ability score box: editable score + (auto or manual) modifier badge. */
export function AbilityBox({
  ctx,
  ability,
  label,
  abbr,
}: {
  ctx: SheetCtx;
  ability: AbilityKey;
  label: string;
  abbr: string;
}) {
  const { sheet, stats, mutate, readOnly } = ctx;
  const { t } = useI18n();
  const { promptRoll } = useDiceRoller();
  return (
    <div className="group relative flex flex-col items-center gap-1 rounded-xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 px-2 pt-2 pb-2.5 transition-colors hover:border-gold-600/50">
      <button
        type="button"
        onClick={() => promptRoll({ label, bonus: stats.abilityModifiers[ability] })}
        title={t.roll.rollTooltip(label)}
        className="inline-flex cursor-pointer items-center gap-1 rounded px-1 font-display text-[10px] font-bold tracking-[0.18em] text-ink-300 transition-colors hover:text-gold-300"
      >
        <span>{abbr}</span>
        <Dices className="h-2.5 w-2.5 text-gold-400/75" />
      </button>
      <div className="flex h-9 items-center justify-center">
        <DerivedValue
          auto={sheet.autoCalculate}
          readOnly={readOnly}
          size="lg"
          asModifier
          label={t.shared.abilityModifier(label)}
          value={stats.abilityModifiers[ability]}
          onChange={(v) => mutate((d) => void (d.manualStats.abilityModifiers[ability] = v))}
        />
      </div>
      <NumberInput
        id={`ability-${ability}`}
        value={sheet.abilities[ability]}
        min={1}
        max={30}
        disabled={readOnly}
        title={t.shared.abilityScore(label)}
        className="h-7 w-14 rounded-full! py-0! text-xs! font-semibold"
        onChange={(v) => mutate((d) => void (d.abilities[ability] = v))}
      />
    </div>
  );
}
