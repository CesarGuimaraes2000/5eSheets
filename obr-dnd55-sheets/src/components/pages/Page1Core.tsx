import { Heart, Minus, Plus, Shield, Sparkles, Trash2, Wind, Zap } from 'lucide-react';
import type { SheetCtx } from '../sheetContext';
import type { Currency } from '../../types/character';
import { ABILITIES, CONDITIONS, MAX_EXHAUSTION, abilityAbbr } from '../../constants/dnd55Rules';
import { clamp, formatModifier } from '../../utils/calculations';
import { createBlankAttack } from '../../utils/storage';
import { AbilityBox } from '../shared/AbilityBox';
import { DerivedValue } from '../shared/DerivedValue';
import { SkillRow } from '../shared/SkillRow';
import { Dot, Field, NumberInput, Panel, StatBox, TextArea, TextInput, Toggle, cx } from '../shared/ui';

const COINS: { key: keyof Currency; label: string; color: string }[] = [
  { key: 'cp', label: 'CP', color: 'text-orange-300' },
  { key: 'sp', label: 'SP', color: 'text-slate-300' },
  { key: 'ep', label: 'EP', color: 'text-sky-300' },
  { key: 'gp', label: 'GP', color: 'text-gold-400' },
  { key: 'pp', label: 'PP', color: 'text-violet-300' },
];

/** Page 1 of the sheet: abilities, skills, combat, attacks, equipment and personality. */
export function Page1Core({ ctx }: { ctx: SheetCtx }) {
  const { sheet, stats, mutate, readOnly } = ctx;
  const auto = sheet.autoCalculate;
  const c = sheet.combat;
  const hpPct = c.hpMax > 0 ? clamp((c.hpCurrent / c.hpMax) * 100, 0, 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.95fr)]">
      {/* ================= COLUMN 1 ================= */}
      <div className="flex min-w-0 flex-col gap-3">
        <Panel title="Ability Scores">
          <div className="grid grid-cols-3 gap-2">
            {ABILITIES.map((a) => (
              <AbilityBox key={a.key} ctx={ctx} ability={a.key} label={a.label} abbr={a.abbr} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-700 bg-ink-850/80 px-2 py-1.5">
              <span className="field-label">Proficiency</span>
              <DerivedValue
                auto={auto}
                readOnly={readOnly}
                asModifier
                label="Proficiency bonus"
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
              <Sparkles className="h-3.5 w-3.5" /> Heroic Inspiration
            </button>
          </div>
        </Panel>

        <Panel title="Saving Throws" bodyClassName="p-2">
          <div className="grid grid-cols-2 gap-x-1">
            {ABILITIES.map((a) => (
              <SkillRow
                key={a.key}
                name={a.label}
                abilityAbbr={a.abbr}
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
          title="Skills"
          bodyClassName="p-2"
          actions={<span className="text-[10px] text-ink-400">○ none · ● prof · ◉ expertise</span>}
        >
          <div className="flex flex-col">
            {sheet.skills.map((skill, i) => (
              <SkillRow
                key={skill.id}
                name={skill.name}
                abilityAbbr={abilityAbbr(skill.ability)}
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
            <span className="field-label">Passive Wisdom (Perception)</span>
            <DerivedValue
              auto={auto}
              readOnly={readOnly}
              label="Passive perception"
              value={stats.passivePerception}
              onChange={(v) => mutate((d) => void (d.manualStats.passivePerception = v))}
            />
          </div>
        </Panel>

        <Panel title="Other Proficiencies & Languages">
          <TextArea
            id="other-proficiencies"
            value={sheet.otherProficienciesAndLanguages}
            disabled={readOnly}
            placeholder="Armor, weapons, tools, languages..."
            onChange={(v) => mutate((d) => void (d.otherProficienciesAndLanguages = v))}
          />
        </Panel>
      </div>

      {/* ================= COLUMN 2 ================= */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <StatBox label={<span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" /> Armor Class</span>}>
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
          <StatBox label={<span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" /> Initiative</span>}>
            <DerivedValue
              auto={auto}
              readOnly={readOnly}
              asModifier
              size="lg"
              label="Initiative"
              value={stats.initiative}
              onChange={(v) => mutate((d) => void (d.manualStats.initiative = v))}
            />
          </StatBox>
          <StatBox label={<span className="inline-flex items-center gap-1"><Wind className="h-3 w-3" /> Speed</span>}>
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

        <Panel title={<span className="inline-flex items-center gap-1.5"><Heart className="h-3 w-3" /> Hit Points</span>}>
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
            <Field label="Maximum" htmlFor="hp-max">
              <NumberInput
                id="hp-max"
                value={c.hpMax}
                min={0}
                disabled={readOnly}
                onChange={(v) => mutate((d) => void (d.combat.hpMax = v))}
              />
            </Field>
            <Field label="Current" htmlFor="hp-current">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn-icon"
                  disabled={readOnly}
                  aria-label="Decrease HP"
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
                  aria-label="Increase HP"
                  onClick={() =>
                    mutate((d) => void (d.combat.hpCurrent = Math.min(d.combat.hpMax, d.combat.hpCurrent + 1)))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </Field>
            <Field label="Temporary" htmlFor="hp-temp">
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
              <span className="field-label">Hit Dice</span>
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="Total" htmlFor="hd-total">
                  <TextInput
                    id="hd-total"
                    value={c.hitDiceTotal}
                    disabled={readOnly}
                    placeholder="5d10"
                    onChange={(v) => mutate((d) => void (d.combat.hitDiceTotal = v))}
                  />
                </Field>
                <Field label="Remaining" htmlFor="hd-current">
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
              <span className="field-label">Death Saves</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-life-400">Successes</span>
                <div className="flex gap-1">
                  {c.deathSaves.successes.map((v, i) => (
                    <Dot
                      key={i}
                      tone="life"
                      checked={v}
                      disabled={readOnly}
                      title={`Success ${i + 1}`}
                      onChange={(nv) => mutate((d) => void (d.combat.deathSaves.successes[i] = nv))}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-blood-400">Failures</span>
                <div className="flex gap-1">
                  {c.deathSaves.failures.map((v, i) => (
                    <Dot
                      key={i}
                      tone="blood"
                      checked={v}
                      disabled={readOnly}
                      title={`Failure ${i + 1}`}
                      onChange={(nv) => mutate((d) => void (d.combat.deathSaves.failures[i] = nv))}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Conditions"
          actions={
            <div className="flex items-center gap-1.5">
              <span className="field-label">Exhaustion</span>
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
                  {cond}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Attacks & Spellcasting"
          bodyClassName="p-2"
          actions={
            !readOnly && (
              <button
                type="button"
                id="add-attack"
                className="btn-ghost px-2! py-1!"
                onClick={() => mutate((d) => void d.attacks.push(createBlankAttack()))}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )
          }
        >
          {sheet.attacks.length === 0 ? (
            <p className="px-1 py-3 text-center text-xs text-ink-400">No attacks yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-[1.4fr_0.6fr_1.3fr_auto] gap-1.5 px-1">
                <span className="field-label">Name</span>
                <span className="field-label">Atk</span>
                <span className="field-label">Damage / Type</span>
                <span className="w-7" />
              </div>
              {sheet.attacks.map((atk, i) => (
                <div key={atk.id} className="rounded-md bg-ink-850/60 p-1">
                  <div className="grid grid-cols-[1.4fr_0.6fr_1.3fr_auto] items-center gap-1.5">
                    <TextInput
                      value={atk.name}
                      disabled={readOnly}
                      placeholder="Longsword"
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
                      placeholder="1d8+3 slashing"
                      onChange={(v) => mutate((d) => void (d.attacks[i].damageType = v))}
                    />
                    <button
                      type="button"
                      className="btn-icon hover:text-blood-400!"
                      disabled={readOnly}
                      aria-label="Remove attack"
                      onClick={() => mutate((d) => void d.attacks.splice(i, 1))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <TextInput
                    bare
                    value={atk.notes ?? ''}
                    disabled={readOnly}
                    placeholder="Notes / Weapon Mastery (Vex, Topple, Nick...)"
                    className="mt-1 text-xs! text-ink-300!"
                    onChange={(v) => mutate((d) => void (d.attacks[i].notes = v))}
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Equipment">
          <div className="mb-2 grid grid-cols-5 gap-1.5">
            {COINS.map((coin) => (
              <div key={coin.key} className="flex flex-col items-center gap-0.5">
                <span className={cx('text-[10px] font-bold tracking-wider', coin.color)}>{coin.label}</span>
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
            placeholder="Backpack, rope, rations..."
            onChange={(v) => mutate((d) => void (d.equipment = v))}
          />
        </Panel>
      </div>

      {/* ================= COLUMN 3 ================= */}
      <div className="flex min-w-0 flex-col gap-3">
        {(
          [
            ['traits', 'Personality Traits'],
            ['ideals', 'Ideals'],
            ['bonds', 'Bonds'],
            ['flaws', 'Flaws'],
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
        <Panel title="Features & Traits" className="flex-1">
          <TextArea
            id="features-traits"
            value={sheet.featuresAndTraits}
            disabled={readOnly}
            rows={16}
            placeholder="Class features, species traits, feats..."
            onChange={(v) => mutate((d) => void (d.featuresAndTraits = v))}
          />
        </Panel>
        {!readOnly && (
          <div className="rounded-lg border border-dashed border-ink-700 px-3 py-2 text-[11px] leading-relaxed text-ink-400">
            <Toggle
              checked={auto}
              label="Automatic calculations"
              onChange={ctx.setAutoCalculate}
            />
            <p className="mt-1">
              {auto
                ? 'Locked values are calculated from your scores. Turn this off in the header to edit them manually.'
                : 'Manual mode: every calculated value can be edited freely.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
