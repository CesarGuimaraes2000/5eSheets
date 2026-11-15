import { Dices, Plus, Swords, Trash2, Wand2 } from 'lucide-react';
import type { SheetCtx } from '../sheetContext';
import type { AbilityKey, SpellLevelBlock } from '../../types/character';
import { ABILITIES } from '../../constants/dnd55Rules';
import { useI18n } from '../../i18n/I18nContext';
import { extractDiceNotation, isSaveDcText } from '../../utils/dice';
import { createBlankSpell } from '../../utils/storage';
import { DerivedValue } from '../shared/DerivedValue';
import { useDiceRoller } from '../shared/DiceRoller';
import { Dot, Field, NumberInput, Panel, Pips, TextInput, cx } from '../shared/ui';

function FlagChip({
  active,
  label,
  title,
  onClick,
  disabled,
}: {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'h-6 w-6 shrink-0 cursor-pointer rounded border text-[10px] font-bold transition-colors disabled:cursor-not-allowed',
        active
          ? 'border-arcane-500 bg-arcane-500/25 text-arcane-400'
          : 'border-ink-700 text-ink-600 hover:text-ink-300',
      )}
    >
      {label}
    </button>
  );
}

function SpellLevelCard({ ctx, block, index }: { ctx: SheetCtx; block: SpellLevelBlock; index: number }) {
  const { stats, mutate, readOnly } = ctx;
  const { t } = useI18n();
  const { promptRoll, promptDamage } = useDiceRoller();
  const isCantrip = block.level === 0;
  const lv = (fn: (b: SpellLevelBlock) => void) => mutate((d) => fn(d.spellcasting.levels[index]));
  const addLabel = isCantrip ? t.page3.addCantrip : t.page3.addSpell;

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gold-500/60 font-display text-[10px] text-gold-300">
            {block.level}
          </span>
          {t.spellLevels[block.level]}
        </span>
      }
      bodyClassName="p-2"
      actions={
        !readOnly && (
          <button
            type="button"
            id={`add-spell-${block.level}`}
            className="btn-icon"
            aria-label={addLabel}
            title={addLabel}
            onClick={() => lv((b) => void b.spells.push(createBlankSpell()))}
          >
            <Plus className="h-4 w-4" />
          </button>
        )
      }
    >
      {!isCantrip && (
        <div className="mb-2 flex items-center gap-2 rounded-md bg-ink-850/70 px-2 py-1.5">
          <span className="field-label">{t.page3.slots}</span>
          <NumberInput
            value={block.slotsTotal}
            min={0}
            max={9}
            disabled={readOnly}
            title={t.page3.totalSlots}
            className="h-6 w-9 px-0! py-0!"
            onChange={(v) =>
              lv((b) => {
                b.slotsTotal = v;
                b.slotsExpended = Math.min(b.slotsExpended, v);
              })
            }
          />
          <span className="field-label ml-auto">{t.page3.expended}</span>
          {block.slotsTotal > 0 ? (
            <Pips
              total={block.slotsTotal}
              filled={block.slotsExpended}
              disabled={readOnly}
              label={t.page3.expendedSlot}
              onChange={(n) => lv((b) => void (b.slotsExpended = n))}
            />
          ) : (
            <span className="text-[11px] text-ink-600">{t.common.noneDash}</span>
          )}
        </div>
      )}

      {block.spells.length === 0 ? (
        <p className="py-2 text-center text-[11px] text-ink-600">
          {isCantrip ? t.page3.noCantrips : t.page3.noSpells}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {block.spells.map((spell, si) => {
            const isDc =
              spell.rollMode === 'dc' ||
              isSaveDcText(spell.damage ?? '') ||
              isSaveDcText(spell.notes ?? '');
            const damageSource = spell.damage?.trim() || spell.notes?.trim() || '';
            const hasDmg = Boolean(extractDiceNotation(damageSource));
            const spellLabel = spell.name || (isCantrip ? t.page3.cantripPh : t.page3.spellPh);

            return (
              <div key={spell.id} className="rounded-md border border-ink-700/60 bg-ink-850/50 p-1.5">
                <div className="flex items-center gap-1.5">
                  {!isCantrip && (
                    <Dot
                      tone="arcane"
                      checked={spell.prepared}
                      disabled={readOnly}
                      title={t.page3.prepared}
                      onChange={(v) => lv((b) => void (b.spells[si].prepared = v))}
                    />
                  )}
                  <TextInput
                    value={spell.name}
                    disabled={readOnly}
                    placeholder={isCantrip ? t.page3.cantripPh : t.page3.spellPh}
                    className="font-medium"
                    onChange={(v) => lv((b) => void (b.spells[si].name = v))}
                  />
                  <button
                    type="button"
                    disabled={readOnly}
                    title={isDc ? t.page3.modeDcTitle : t.page3.modeAttackTitle}
                    aria-pressed={isDc}
                    onClick={() =>
                      lv(
                        (b) =>
                          void (b.spells[si].rollMode = b.spells[si].rollMode === 'dc' ? 'attack' : 'dc'),
                      )
                    }
                    className={cx(
                      'h-6 shrink-0 cursor-pointer rounded border px-1.5 text-[10px] font-bold transition-colors disabled:cursor-not-allowed',
                      isDc
                        ? 'border-arcane-500 bg-arcane-500/20 text-arcane-400'
                        : 'border-gold-500/50 bg-gold-500/15 text-gold-300',
                    )}
                  >
                    {isDc ? t.page3.modeDc : t.page3.modeAttack}
                  </button>
                  <FlagChip
                    label="C"
                    title={t.page3.concentration}
                    active={spell.concentration}
                    disabled={readOnly}
                    onClick={() => lv((b) => void (b.spells[si].concentration = !b.spells[si].concentration))}
                  />
                  <FlagChip
                    label="R"
                    title={t.page3.ritual}
                    active={spell.ritual}
                    disabled={readOnly}
                    onClick={() => lv((b) => void (b.spells[si].ritual = !b.spells[si].ritual))}
                  />
                  <button
                    type="button"
                    className="btn-icon text-gold-400! hover:text-gold-300!"
                    title={t.roll.rollTooltip(spellLabel)}
                    aria-label={t.roll.rollTooltip(spellLabel)}
                    onClick={() =>
                      promptRoll({
                        label: spellLabel,
                        bonus: isDc ? 0 : stats.spellAttackBonus,
                        damageRaw: damageSource,
                        isSaveDc: isDc,
                        dcValue: isDc ? stats.spellSaveDc : undefined,
                      })
                    }
                  >
                    <Dices className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon text-gold-300! hover:text-gold-400!"
                    disabled={!hasDmg}
                    title={t.roll.rollTooltip(`${spellLabel} — ${t.table.damage}`)}
                    aria-label={t.roll.rollTooltip(`${spellLabel} — ${t.table.damage}`)}
                    onClick={() =>
                      promptDamage({
                        label: `${spellLabel} — ${t.table.damage}`,
                        damageRaw: damageSource,
                      })
                    }
                  >
                    <Swords className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon hover:text-blood-400!"
                    disabled={readOnly}
                    aria-label={t.page3.removeSpell}
                    onClick={() => lv((b) => void b.spells.splice(si, 1))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-[1fr_1fr_1fr_1.4fr]">
                  <TextInput
                    bare
                    value={spell.castingTime}
                    disabled={readOnly}
                    placeholder={t.page3.castingTimePh}
                    className="text-xs!"
                    onChange={(v) => lv((b) => void (b.spells[si].castingTime = v))}
                  />
                  <TextInput
                    bare
                    value={spell.range}
                    disabled={readOnly}
                    placeholder={t.page3.rangePh}
                    className="text-xs!"
                    onChange={(v) => lv((b) => void (b.spells[si].range = v))}
                  />
                  <TextInput
                    bare
                    value={spell.damage ?? ''}
                    disabled={readOnly}
                    placeholder={t.page3.damagePh}
                    className="text-xs! text-gold-300!"
                    onChange={(v) => lv((b) => void (b.spells[si].damage = v))}
                  />
                  <TextInput
                    bare
                    value={spell.notes ?? ''}
                    disabled={readOnly}
                    placeholder={t.page3.notesPh}
                    className="text-xs! text-ink-300!"
                    onChange={(v) => lv((b) => void (b.spells[si].notes = v))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/** Page 3 of the sheet: spellcasting stats, slots and spell lists (cantrips + levels 1-9). */
export function Page3Spells({ ctx }: { ctx: SheetCtx }) {
  const { sheet, stats, mutate, readOnly } = ctx;
  const { t } = useI18n();
  const { promptRoll } = useDiceRoller();
  const sc = sheet.spellcasting;
  const auto = sheet.autoCalculate;

  return (
    <div className="flex flex-col gap-3">
      <Panel bodyClassName="grid grid-cols-2 items-end gap-3 p-3 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr]">
        <Field label={t.page3.spellcastingClass} htmlFor="spell-class">
          <TextInput
            id="spell-class"
            value={sc.spellcastingClass}
            disabled={readOnly}
            placeholder={t.page3.spellcastingClassPh}
            onChange={(v) => mutate((d) => void (d.spellcasting.spellcastingClass = v))}
          />
        </Field>
        <Field label={t.page3.spellcastingAbility} htmlFor="spell-ability">
          <select
            id="spell-ability"
            className="input"
            value={sc.spellcastingAbility}
            disabled={readOnly}
            onChange={(e) =>
              mutate((d) => void (d.spellcasting.spellcastingAbility = e.target.value as AbilityKey | ''))
            }
          >
            <option value="">{t.common.noneDash}</option>
            {ABILITIES.map((a) => (
              <option key={a.key} value={a.key}>
                {t.abilities[a.key].label} ({t.abilities[a.key].abbr})
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col items-center gap-1 rounded-lg border border-ink-700 bg-ink-850/80 py-1.5">
          <button
            type="button"
            onClick={() =>
              promptRoll({
                label: `${t.page3.spellSaveDc} (${stats.spellSaveDc})`,
                bonus: 0,
                isSaveDc: true,
                dcValue: stats.spellSaveDc,
              })
            }
            title={t.roll.rollTooltip(t.page3.spellSaveDc)}
            className="field-label inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-gold-300"
          >
            <span>{t.page3.spellSaveDc}</span>
            <Dices className="h-3 w-3 text-gold-400/80" />
          </button>
          <DerivedValue
            auto={auto}
            readOnly={readOnly}
            label={t.page3.spellSaveDcTitle}
            value={stats.spellSaveDc}
            onChange={(v) => mutate((d) => void (d.manualStats.spellSaveDc = v))}
          />
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg border border-ink-700 bg-ink-850/80 py-1.5">
          <button
            type="button"
            onClick={() => promptRoll({ label: t.page3.spellAttack, bonus: stats.spellAttackBonus })}
            title={t.roll.rollTooltip(t.page3.spellAttack)}
            className="field-label inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-gold-300"
          >
            <span>{t.page3.spellAttack}</span>
            <Dices className="h-3 w-3 text-gold-400/80" />
          </button>
          <DerivedValue
            auto={auto}
            readOnly={readOnly}
            asModifier
            label={t.page3.spellAttackTitle}
            value={stats.spellAttackBonus}
            onChange={(v) => mutate((d) => void (d.manualStats.spellAttackBonus = v))}
          />
        </div>
      </Panel>

      <p className="flex items-center gap-1.5 px-1 text-[11px] text-ink-400">
        <Wand2 className="h-3.5 w-3.5 text-arcane-400" />
        <span>
          {t.page3.shareNoticeBefore}
          <b className="text-arcane-400">{t.page3.shareNoticeBold}</b>
          {t.page3.shareNoticeAfter}
        </span>
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sc.levels.map((block, i) => (
          <SpellLevelCard key={block.level} ctx={ctx} block={block} index={i} />
        ))}
      </div>
    </div>
  );
}
