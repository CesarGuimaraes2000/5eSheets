import { Dices, Heart, Minus, Plus, Shield, Sparkles, Swords, Trash2, Wind, Zap } from 'lucide-react';
import type { SheetCtx } from '../sheetContext';
import type { Currency } from '../../types/character';
import { ABILITIES, CONDITIONS, MAX_EXHAUSTION } from '../../constants/dnd55Rules';
import { useI18n } from '../../i18n/I18nContext';
import { clamp, formatModifier } from '../../utils/calculations';
import { extractDiceNotation, extractHitDieType, isSaveDcText, parseBonusString } from '../../utils/dice';
import { createBlankAttack } from '../../utils/storage';
import { AbilityBox } from '../shared/AbilityBox';
import { DerivedValue } from '../shared/DerivedValue';
import { useDiceRoller } from '../shared/DiceRoller';
import { SkillRow } from '../shared/SkillRow';
import { Dot, Field, NumberInput, Panel, StatBox, TextArea, TextInput, Toggle, cx } from '../shared/ui';

const COINS: { key: keyof Currency; color: string }[] = [
  { key: 'cp', color: 'text-orange-300' },
  { key: 'sp', color: 'text-slate-300' },
  { key: 'ep', color: 'text-sky-300' },
  { key: 'gp', color: 'text-gold-400' },
  { key: 'pp', color: 'text-violet-300' },
];

/** Page 1 of the sheet: abilities, skills, combat, attacks, equipment and personality. */
export function Page1Core({ ctx }: { ctx: SheetCtx }) {
  const { sheet, stats, mutate, readOnly } = ctx;
  const { t } = useI18n();
  const { promptRoll, promptHitDice, promptDamage } = useDiceRoller();
  const auto = sheet.autoCalculate;
  const c = sheet.combat;
  const hpPct = c.hpMax > 0 ? clamp((c.hpCurrent / c.hpMax) * 100, 0, 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.95fr)]">
      {/* ================= COLUMN 1 ================= */}
      <div className="flex min-w-0 flex-col gap-3">
        <Panel title={t.page1.abilityScores}>
          <div className="grid grid-cols-3 gap-2">
            {ABILITIES.map((a) => (
              <AbilityBox
                key={a.key}
                ctx={ctx}
                ability={a.key}
                label={t.abilities[a.key].label}
                abbr={t.abilities[a.key].abbr}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-700 bg-ink-850/80 px-2 py-1.5">
              <span className="field-label">{t.page1.proficiency}</span>
              <DerivedValue
                auto={auto}
                readOnly={readOnly}
                asModifier
                label={t.page1.proficiencyBonus}
                value={stats.proficiencyBonus}
                onChange={(v) => mutate((d) => void (d.manualStats.proficiencyBonus = v))}
              />
            </div>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => mutate((d) => void (d.heroicInspiration = !d.heroicInspiration))}
              className={cx(
                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-all disabled:cursor-not-allowed',
                sheet.heroicInspiration
                  ? 'border-gold-500 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_-4px_rgb(226_163_54/0.6)]'
                  : 'border-ink-700 bg-ink-850/80 text-ink-400 hover:text-ink-100',
              )}
            >
              <Sparkles className="h-3.5 w-3.5" /> {t.page1.heroicInspiration}
            </button>
          </div>
        </Panel>

        <Panel title={t.page1.savingThrows} bodyClassName="p-2">
          <div className="grid grid-cols-2 gap-x-1">
            {ABILITIES.map((a) => (
              <SkillRow
                key={a.key}
                name={t.abilities[a.key].label}
                rollLabel={`${t.table.savingThrowTitle} — ${t.abilities[a.key].label}`}
                abilityAbbr={t.abilities[a.key].abbr}
                level={sheet.savingThrows[a.key] ? 'proficient' : 'none'}
                allowExpertise={false}
                onLevelChange={(lvl) => mutate((d) => void (d.savingThrows[a.key] = lvl !== 'none'))}
                total={stats.savingThrows[a.key]}
                onTotalChange={(v) => mutate((d) => void (d.manualStats.savingThrows[a.key] = v))}
                auto={auto}
                readOnly={readOnly}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title={t.page1.skills}
          bodyClassName="p-2"
          actions={<span className="text-[10px] text-ink-400">{t.page1.skillsLegend}</span>}
        >
          <div className="flex flex-col">
            {sheet.skills.map((skill, i) => (
              <SkillRow
                key={skill.id}
                name={t.skills[skill.id] ?? skill.name}
                abilityAbbr={t.abilities[skill.ability].abbr}
                level={skill.proficiency}
                onLevelChange={(lvl) => mutate((d) => void (d.skills[i].proficiency = lvl))}
                total={stats.skills[skill.id] ?? 0}
                onTotalChange={(v) => mutate((d) => void (d.manualStats.skills[skill.id] = v))}
                auto={auto}
                readOnly={readOnly}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-ink-700 bg-ink-850/80 px-2 py-1.5">
            <span className="field-label">{t.page1.passiveWisdom}</span>
            <DerivedValue
              auto={auto}
              readOnly={readOnly}
              label={t.page1.passivePerception}
              value={stats.passivePerception}
              onChange={(v) => mutate((d) => void (d.manualStats.passivePerception = v))}
            />
          </div>
        </Panel>

        <Panel title={t.page1.otherProficiencies}>
          <TextArea
            id="other-proficiencies"
            value={sheet.otherProficienciesAndLanguages}
            disabled={readOnly}
            placeholder={t.page1.otherProficienciesPh}
            onChange={(v) => mutate((d) => void (d.otherProficienciesAndLanguages = v))}
          />
        </Panel>
      </div>

      {/* ================= COLUMN 2 ================= */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <StatBox label={<span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" /> {t.page1.armorClass}</span>}>
            <NumberInput
              id="armor-class"
              value={c.armorClass}
              min={0}
              max={40}
              disabled={readOnly}
              bare
              className="font-display text-xl! font-bold"
              onChange={(v) => mutate((d) => void (d.combat.armorClass = v))}
            />
          </StatBox>
          <StatBox
            label={
              <button
                type="button"
                onClick={() => promptRoll({ label: t.page1.initiative, bonus: stats.initiative })}
                title={t.roll.rollTooltip(t.page1.initiative)}
                className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-gold-300"
              >
                <Zap className="h-3 w-3" /> {t.page1.initiative}
                <Dices className="h-3 w-3 text-gold-400/80" />
              </button>
            }
          >
            <DerivedValue
              auto={auto}
              readOnly={readOnly}
              asModifier
              size="lg"
              label={t.page1.initiative}
              value={stats.initiative}
              onChange={(v) => mutate((d) => void (d.manualStats.initiative = v))}
            />
          </StatBox>
          <StatBox label={<span className="inline-flex items-center gap-1"><Wind className="h-3 w-3" /> {t.page1.speed}</span>}>
            <TextInput
              id="speed"
              value={c.speed}
              bare
              disabled={readOnly}
              className="text-center font-display text-lg! font-bold"
              onChange={(v) => mutate((d) => void (d.combat.speed = v))}
            />
          </StatBox>
        </div>

        <Panel title={<span className="inline-flex items-center gap-1.5"><Heart className="h-3 w-3" /> {t.page1.hitPoints}</span>}>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink-800">
            <div
              className={cx(
                'h-full rounded-full transition-all duration-500',
                hpPct > 50 ? 'bg-life-500' : hpPct > 20 ? 'bg-gold-500' : 'bg-blood-500',
              )}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="grid grid-cols-[1fr_1.4fr_1fr] items-end gap-2">
            <Field label={t.page1.hpMax} htmlFor="hp-max">
              <NumberInput
                id="hp-max"
                value={c.hpMax}
                min={0}
                disabled={readOnly}
                onChange={(v) => mutate((d) => void (d.combat.hpMax = v))}
              />
            </Field>
            <Field label={t.page1.hpCurrent} htmlFor="hp-current">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn-icon"
                  disabled={readOnly}
                  aria-label={t.page1.hpDecrease}
                  onClick={() => mutate((d) => void (d.combat.hpCurrent = Math.max(0, d.combat.hpCurrent - 1)))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <NumberInput
                  id="hp-current"
                  value={c.hpCurrent}
                  min={0}
                  disabled={readOnly}
                  className="font-display text-base! font-bold"
                  onChange={(v) => mutate((d) => void (d.combat.hpCurrent = v))}
                />
                <button
                  type="button"
                  className="btn-icon"
                  disabled={readOnly}
                  aria-label={t.page1.hpIncrease}
                  onClick={() =>
                    mutate((d) => void (d.combat.hpCurrent = Math.min(d.combat.hpMax, d.combat.hpCurrent + 1)))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </Field>
            <Field label={t.page1.hpTemp} htmlFor="hp-temp">
              <NumberInput
                id="hp-temp"
                value={c.hpTemp}
                min={0}
                disabled={readOnly}
                className="text-arcane-400!"
                onChange={(v) => mutate((d) => void (d.combat.hpTemp = v))}
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink-700/60 pt-3">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  promptHitDice({
                    label: t.page1.hitDice,
                    dieType: extractHitDieType(c.hitDiceTotal, c.hitDiceCurrent),
                    conMod: stats.abilityModifiers.constitution,
                  })
                }
                title={t.roll.rollTooltip(t.page1.hitDice)}
                className="field-label inline-flex cursor-pointer items-center gap-1 self-start transition-colors hover:text-gold-300"
              >
                <span>{t.page1.hitDice}</span>
                <Dices className="h-3 w-3 text-gold-400/80" />
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <Field label={t.page1.hdTotal} htmlFor="hd-total">
                  <TextInput
                    id="hd-total"
                    value={c.hitDiceTotal}
                    disabled={readOnly}
                    placeholder="5d10"
                    onChange={(v) => mutate((d) => void (d.combat.hitDiceTotal = v))}
                  />
                </Field>
                <Field label={t.page1.hdRemaining} htmlFor="hd-current">
                  <TextInput
                    id="hd-current"
                    value={c.hitDiceCurrent}
                    disabled={readOnly}
                    onChange={(v) => mutate((d) => void (d.combat.hitDiceCurrent = v))}
                  />
                </Field>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => promptRoll({ label: t.page1.deathSaves, bonus: 0 })}
                title={t.roll.rollTooltip(t.page1.deathSaves)}
                className="field-label inline-flex cursor-pointer items-center gap-1 self-start transition-colors hover:text-gold-300"
              >
                <span>{t.page1.deathSaves}</span>
                <Dices className="h-3 w-3 text-gold-400/80" />
              </button>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-life-400">{t.page1.successes}</span>
                <div className="flex gap-1">
                  {c.deathSaves.successes.map((v, i) => (
                    <Dot
                      key={i}
                      tone="life"
                      checked={v}
                      disabled={readOnly}
                      title={`${t.page1.success} ${i + 1}`}
                      onChange={(nv) => mutate((d) => void (d.combat.deathSaves.successes[i] = nv))}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-blood-400">{t.page1.failures}</span>
                <div className="flex gap-1">
                  {c.deathSaves.failures.map((v, i) => (
                    <Dot
                      key={i}
                      tone="blood"
                      checked={v}
                      disabled={readOnly}
                      title={`${t.page1.failure} ${i + 1}`}
                      onChange={(nv) => mutate((d) => void (d.combat.deathSaves.failures[i] = nv))}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title={t.page1.conditions}
          actions={
            <div className="flex items-center gap-1.5">
              <span className="field-label">{t.page1.exhaustion}</span>
              <NumberInput
                id="exhaustion"
                value={c.exhaustion}
                min={0}
                max={MAX_EXHAUSTION}
                disabled={readOnly}
                className={cx('h-6 w-10 py-0!', c.exhaustion > 0 && 'border-blood-500! text-blood-400!')}
                onChange={(v) => mutate((d) => void (d.combat.exhaustion = v))}
              />
            </div>
          }
        >
          <div className="flex flex-wrap gap-1">
            {CONDITIONS.map((cond) => {
              const active = c.conditions.includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    mutate((d) => {
                      d.combat.conditions = active
                        ? d.combat.conditions.filter((x) => x !== cond)
                        : [...d.combat.conditions, cond];
                    })
                  }
                  className={cx(
                    'chip cursor-pointer transition-colors disabled:cursor-not-allowed',
                    active
                      ? 'border-blood-500/70 bg-blood-700/40 text-blood-400'
                      : 'border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-100',
                  )}
                >
                  {t.conditions[cond] ?? cond}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          title={t.page1.attacksAndSpellcasting}
          bodyClassName="p-2"
          actions={
            !readOnly && (
              <button
                type="button"
                id="add-attack"
                className="btn-ghost px-2! py-1!"
                onClick={() => mutate((d) => void d.attacks.push(createBlankAttack()))}
              >
                <Plus className="h-3 w-3" /> {t.common.add}
              </button>
            )
          }
        >
          {sheet.attacks.length === 0 ? (
            <p className="px-1 py-3 text-center text-xs text-ink-400">{t.page1.noAttacks}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-[1.4fr_0.6fr_1.3fr_auto] gap-1.5 px-1">
                <span className="field-label">{t.page1.atkName}</span>
                <span className="field-label">{t.page1.atkBonus}</span>
                <span className="field-label">{t.page1.atkDamage}</span>
                <span className="w-[92px]" />
              </div>
              {sheet.attacks.map((atk, i) => {
                const isDc = isSaveDcText(atk.atkBonus);
                const hasDmg = Boolean(extractDiceNotation(atk.damageType));
                return (
                  <div key={atk.id} className="rounded-md bg-ink-850/60 p-1">
                    <div className="grid grid-cols-[1.4fr_0.6fr_1.3fr_auto] items-center gap-1.5">
                      <TextInput
                        value={atk.name}
                        disabled={readOnly}
                        placeholder={t.page1.atkNamePh}
                        onChange={(v) => mutate((d) => void (d.attacks[i].name = v))}
                      />
                      <TextInput
                        value={atk.atkBonus}
                        disabled={readOnly}
                        placeholder={formatModifier(stats.proficiencyBonus + stats.abilityModifiers.strength)}
                        className="text-center"
                        onChange={(v) => mutate((d) => void (d.attacks[i].atkBonus = v))}
                      />
                      <TextInput
                        value={atk.damageType}
                        disabled={readOnly}
                        placeholder={t.page1.atkDamagePh}
                        onChange={(v) => mutate((d) => void (d.attacks[i].damageType = v))}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn-icon text-gold-400! hover:text-gold-300!"
                          title={t.roll.rollTooltip(atk.name || t.page1.atkNamePh)}
                          aria-label={t.roll.rollTooltip(atk.name || t.page1.atkNamePh)}
                          onClick={() =>
                            promptRoll({
                              label: atk.name || t.page1.atkNamePh,
                              bonus: isDc
                                ? 0
                                : parseBonusString(
                                    atk.atkBonus,
                                    stats.proficiencyBonus + stats.abilityModifiers.strength,
                                  ),
                              damageRaw: atk.damageType,
                              isSaveDc: isDc,
                            })
                          }
                        >
                          <Dices className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-gold-300! hover:text-gold-400!"
                          disabled={!hasDmg}
                          title={t.roll.rollTooltip(`${atk.name || t.page1.atkNamePh} — ${t.table.damage}`)}
                          aria-label={t.roll.rollTooltip(`${atk.name || t.page1.atkNamePh} — ${t.table.damage}`)}
                          onClick={() =>
                            promptDamage({
                              label: `${atk.name || t.page1.atkNamePh} — ${t.table.damage}`,
                              damageRaw: atk.damageType,
                            })
                          }
                        >
                          <Swords className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon hover:text-blood-400!"
                          disabled={readOnly}
                          aria-label={t.page1.removeAttack}
                          onClick={() => mutate((d) => void d.attacks.splice(i, 1))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <TextInput
                      bare
                      value={atk.notes ?? ''}
                      disabled={readOnly}
                      placeholder={t.page1.atkNotesPh}
                      className="mt-1 text-xs! text-ink-300!"
                      onChange={(v) => mutate((d) => void (d.attacks[i].notes = v))}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title={t.page1.equipment}>
          <div className="mb-2 grid grid-cols-5 gap-1.5">
            {COINS.map((coin) => (
              <div key={coin.key} className="flex flex-col items-center gap-0.5">
                <span className={cx('text-[10px] font-bold tracking-wider', coin.color)}>
                  {t.currencies[coin.key]}
                </span>
                <NumberInput
                  id={`coin-${coin.key}`}
                  value={sheet.currency[coin.key]}
                  min={0}
                  disabled={readOnly}
                  className="px-1!"
                  onChange={(v) => mutate((d) => void (d.currency[coin.key] = v))}
                />
              </div>
            ))}
          </div>
          <TextArea
            id="equipment"
            value={sheet.equipment}
            disabled={readOnly}
            rows={6}
            placeholder={t.page1.equipmentPh}
            onChange={(v) => mutate((d) => void (d.equipment = v))}
          />
        </Panel>
      </div>

      {/* ================= COLUMN 3 ================= */}
      <div className="flex min-w-0 flex-col gap-3">
        {(
          [
            ['traits', t.page1.traits],
            ['ideals', t.page1.ideals],
            ['bonds', t.page1.bonds],
            ['flaws', t.page1.flaws],
          ] as const
        ).map(([key, label]) => (
          <Panel key={key} title={label}>
            <TextArea
              id={`personality-${key}`}
              value={sheet.personality[key]}
              disabled={readOnly}
              rows={3}
              onChange={(v) => mutate((d) => void (d.personality[key] = v))}
            />
          </Panel>
        ))}
        <Panel title={t.page1.featuresAndTraits} className="flex-1">
          <TextArea
            id="features-traits"
            value={sheet.featuresAndTraits}
            disabled={readOnly}
            rows={16}
            placeholder={t.page1.featuresAndTraitsPh}
            onChange={(v) => mutate((d) => void (d.featuresAndTraits = v))}
          />
        </Panel>
        {!readOnly && (
          <div className="rounded-lg border border-dashed border-ink-700 px-3 py-2 text-[11px] leading-relaxed text-ink-400">
            <Toggle
              checked={auto}
              label={t.page1.autoCalcLabel}
              onChange={ctx.setAutoCalculate}
            />
            <p className="mt-1">
              {auto ? t.page1.autoCalcHintOn : t.page1.autoCalcHintOff}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
