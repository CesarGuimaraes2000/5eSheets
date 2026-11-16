import type { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MonsterEntry, MonsterSheet } from '../../types/monster';
import { ABILITIES } from '../../constants/dnd55Rules';
import { useI18n } from '../../i18n/I18nContext';
import { calculateAbilityModifier, formatModifier } from '../../utils/calculations';
import { createBlankMonsterEntry, proficiencyFromCr } from '../../utils/monsterStorage';
import { createId } from '../../utils/storage';
import { Dot, Field, NumberInput, Panel, Pips, TextArea, TextInput, cx } from '../shared/ui';

type MonsterEntryArrayKey =
  | 'traits'
  | 'actions'
  | 'bonusActions'
  | 'reactions'
  | 'legendaryActions'
  | 'lairActions';

function MonsterEntryEditorSection({
  title,
  entries,
  showCost = false,
  headerExtra,
  onAdd,
  onMutate,
}: {
  title: string;
  entries: MonsterEntry[];
  showCost?: boolean;
  headerExtra?: ReactNode;
  onAdd: () => void;
  onMutate: (fn: (list: MonsterEntry[]) => void) => void;
}) {
  const { t } = useI18n();

  return (
    <Panel
      title={title}
      bodyClassName="p-2.5"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {headerExtra}
          <button type="button" className="btn-ghost px-2! py-1!" onClick={onAdd}>
            <Plus className="h-3 w-3" /> {t.common.add}
          </button>
        </div>
      }
    >
      {entries.length === 0 ? (
        <p className="py-2 text-center text-xs text-ink-400">{t.common.noneDash}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className="flex flex-col gap-1.5 rounded-lg border border-ink-700/70 bg-ink-850/60 p-2"
            >
              <div
                className={cx(
                  'grid grid-cols-1 gap-1.5',
                  showCost
                    ? 'sm:grid-cols-[1.45fr_auto_0.55fr_0.55fr_0.85fr_auto]'
                    : 'sm:grid-cols-[1.6fr_0.6fr_0.6fr_0.9fr_auto]',
                )}
              >
                <TextInput
                  value={entry.name}
                  placeholder={t.monster.entryNamePh}
                  className="font-semibold"
                  onChange={(v) => onMutate((list) => void (list[idx].name = v))}
                />
                {showCost && (
                  <label
                    className="flex items-center gap-1 rounded-md border border-ink-700 bg-ink-850 px-1.5 text-[10px] font-semibold text-ink-300"
                    title={t.monster.actionCostLabel}
                  >
                    <span>{t.monster.actionCostLabel}</span>
                    <NumberInput
                      bare
                      value={entry.cost ?? 1}
                      min={1}
                      max={9}
                      className="w-8 text-xs! font-bold text-gold-300!"
                      onChange={(v) => onMutate((list) => void (list[idx].cost = v))}
                    />
                  </label>
                )}
                <TextInput
                  value={entry.atkBonus ?? ''}
                  placeholder={t.monster.entryAtkPh}
                  className="text-center text-xs!"
                  onChange={(v) => onMutate((list) => void (list[idx].atkBonus = v))}
                />
                <TextInput
                  value={entry.saveDc ?? ''}
                  placeholder={t.monster.entryDcPh}
                  className="text-center text-xs!"
                  onChange={(v) => onMutate((list) => void (list[idx].saveDc = v))}
                />
                <TextInput
                  value={entry.damage ?? ''}
                  placeholder={t.monster.entryDamagePh}
                  className="text-xs! text-gold-300!"
                  onChange={(v) => onMutate((list) => void (list[idx].damage = v))}
                />
                <button
                  type="button"
                  className="btn-icon justify-self-end hover:text-blood-400!"
                  aria-label={t.common.remove}
                  onClick={() => onMutate((list) => void list.splice(idx, 1))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextArea
                value={entry.detail}
                rows={2}
                placeholder={t.monster.entryDetailPh}
                className="min-h-[58px]! text-xs!"
                onChange={(v) => onMutate((list) => void (list[idx].detail = v))}
              />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/** Manual GM Monster Creator & Editor form. */
export function MonsterEditor({
  monster: m,
  onChange,
}: {
  monster: MonsterSheet;
  onChange: (updated: MonsterSheet) => void;
}) {
  const { t } = useI18n();

  const mutate = (recipe: (draft: MonsterSheet) => void) => {
    const draft = structuredClone(m);
    recipe(draft);
    draft.updatedAt = Date.now();
    onChange(draft);
  };

  const entrySections: { key: MonsterEntryArrayKey; label: string }[] = [
    { key: 'traits', label: t.monster.traits },
    { key: 'actions', label: t.monster.actions },
    { key: 'bonusActions', label: t.monster.bonusActions },
    { key: 'reactions', label: t.monster.reactions },
    { key: 'legendaryActions', label: t.monster.legendaryActions },
    { key: 'lairActions', label: t.monster.lairActions },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Identity & Challenge */}
      <Panel>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
          <Field label={t.monster.nameLabel} className="sm:col-span-2">
            <TextInput
              value={m.name}
              placeholder={t.monster.unnamedMonster}
              className="font-display font-bold"
              onChange={(v) => mutate((d) => void (d.name = v))}
            />
          </Field>
          <Field label={t.monster.size}>
            <TextInput
              value={m.size}
              placeholder={t.monster.sizePh}
              onChange={(v) => mutate((d) => void (d.size = v))}
            />
          </Field>
          <Field label={t.monster.creatureType}>
            <TextInput
              value={m.creatureType}
              placeholder={t.monster.creatureTypePh}
              onChange={(v) => mutate((d) => void (d.creatureType = v))}
            />
          </Field>
          <Field label={t.monster.alignment}>
            <TextInput
              value={m.alignment}
              placeholder={t.monster.alignmentPh}
              onChange={(v) => mutate((d) => void (d.alignment = v))}
            />
          </Field>
          <Field label={t.monster.portraitUrl} className="sm:col-span-2">
            <TextInput
              value={m.imageUrl}
              placeholder="https://..."
              onChange={(v) => mutate((d) => void (d.imageUrl = v))}
            />
          </Field>
          <div className="grid grid-cols-3 gap-1.5">
            <Field label={t.monster.challengeRating}>
              <TextInput
                value={m.challengeRating}
                className="text-center font-bold"
                onChange={(v) =>
                  mutate((d) => {
                    d.challengeRating = v;
                    d.proficiencyBonus = proficiencyFromCr(v);
                  })
                }
              />
            </Field>
            <Field label={t.page1.proficiency}>
              <NumberInput
                value={m.proficiencyBonus}
                min={1}
                max={12}
                onChange={(v) => mutate((d) => void (d.proficiencyBonus = v))}
              />
            </Field>
            <Field label={t.monster.xp}>
              <TextInput
                value={m.xp}
                className="text-center"
                onChange={(v) => mutate((d) => void (d.xp = v))}
              />
            </Field>
          </div>
        </div>
      </Panel>

      {/* Combat */}
      <Panel title={t.tabs.core}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
          <Field label={t.page1.armorClass}>
            <NumberInput
              value={m.ac}
              min={0}
              max={40}
              onChange={(v) => mutate((d) => void (d.ac = v))}
            />
          </Field>
          <Field label={t.monster.acType}>
            <TextInput
              value={m.acType}
              placeholder={t.monster.acTypePh}
              onChange={(v) => mutate((d) => void (d.acType = v))}
            />
          </Field>
          <Field label={t.page1.hpMax}>
            <NumberInput
              value={m.hpMax}
              min={0}
              onChange={(v) =>
                mutate((d) => {
                  if (d.hpCurrent === d.hpMax) d.hpCurrent = v;
                  d.hpMax = v;
                  d.hpCurrent = Math.min(d.hpCurrent, v);
                })
              }
            />
          </Field>
          <Field label={t.page1.hpCurrent}>
            <NumberInput
              value={m.hpCurrent}
              min={0}
              onChange={(v) => mutate((d) => void (d.hpCurrent = v))}
            />
          </Field>
          <Field label={t.monster.hpFormula}>
            <TextInput
              value={m.hpFormula}
              placeholder="4d8+8"
              onChange={(v) => mutate((d) => void (d.hpFormula = v))}
            />
          </Field>
          <Field label={t.monster.initiativeLabel}>
            <NumberInput
              value={m.initiativeBonus}
              onChange={(v) => mutate((d) => void (d.initiativeBonus = v))}
            />
          </Field>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <Field label={t.page1.speed}>
            <TextInput
              value={m.speed}
              placeholder={t.monster.speedPh}
              onChange={(v) => mutate((d) => void (d.speed = v))}
            />
          </Field>
          <Field label={t.monster.senses}>
            <TextInput
              value={m.senses}
              placeholder={t.monster.sensesPh}
              onChange={(v) => mutate((d) => void (d.senses = v))}
            />
          </Field>
          <Field label={t.monster.languages}>
            <TextInput
              value={m.languages}
              placeholder={t.monster.languagesPh}
              onChange={(v) => mutate((d) => void (d.languages = v))}
            />
          </Field>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-ink-700/60 pt-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Field label={t.monster.legendaryResistance}>
              <NumberInput
                value={m.legendaryResistancesTotal}
                min={0}
                max={10}
                onChange={(v) =>
                  mutate((d) => {
                    d.legendaryResistancesTotal = v;
                    d.legendaryResistancesUsed = Math.min(d.legendaryResistancesUsed, v);
                  })
                }
              />
            </Field>
            {m.legendaryResistancesTotal > 0 && (
              <Pips
                total={m.legendaryResistancesTotal}
                filled={m.legendaryResistancesUsed}
                tone="gold"
                label={t.monster.legendaryResistanceUsedLabel}
                onChange={(n) => mutate((d) => void (d.legendaryResistancesUsed = n))}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Field label={t.monster.legendaryActionsPerRound}>
              <NumberInput
                value={m.legendaryActionsTotal}
                min={0}
                max={10}
                onChange={(v) =>
                  mutate((d) => {
                    d.legendaryActionsTotal = v;
                    d.legendaryActionsUsed = Math.min(d.legendaryActionsUsed, v);
                  })
                }
              />
            </Field>
            {m.legendaryActionsTotal > 0 && (
              <Pips
                total={m.legendaryActionsTotal}
                filled={m.legendaryActionsUsed}
                tone="gold"
                label={t.monster.legendaryActionsUsedLabel}
                onChange={(n) => mutate((d) => void (d.legendaryActionsUsed = n))}
              />
            )}
          </div>

          <Field label={`${t.monster.lairActions} · ${t.monster.lairInitiativeLabel}`}>
            <NumberInput
              value={m.lairActionsInitiative}
              min={0}
              max={30}
              onChange={(v) => mutate((d) => void (d.lairActionsInitiative = v))}
            />
          </Field>
        </div>
      </Panel>

      {/* Abilities & Saves */}
      <Panel title={t.table.abilitiesAndSaves} bodyClassName="grid grid-cols-3 gap-2 p-3 sm:grid-cols-6">
        {ABILITIES.map((a) => {
          const score = m.abilities[a.key];
          const mod = calculateAbilityModifier(score);
          const isProf = m.savingThrowProficiencies[a.key];
          const saveBonus = mod + (isProf ? m.proficiencyBonus : 0);

          return (
            <div
              key={a.key}
              className="flex flex-col items-center gap-1 rounded-xl border border-ink-700 bg-ink-850/70 px-2 py-2"
            >
              <span className="font-display text-[10px] font-bold tracking-[0.16em] text-ink-300">
                {t.abilities[a.key].abbr}
              </span>
              <span className="stat-value text-gold-300!">{formatModifier(mod)}</span>
              <NumberInput
                value={score}
                min={1}
                max={30}
                className="h-7 w-14 rounded-full! py-0! text-xs! font-semibold"
                onChange={(v) =>
                  mutate((d) => {
                    const prevMod = calculateAbilityModifier(d.abilities[a.key]);
                    d.abilities[a.key] = v;
                    if (a.key === 'dexterity' && d.initiativeBonus === prevMod) {
                      d.initiativeBonus = calculateAbilityModifier(v);
                    }
                  })
                }
              />
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-300">
                <Dot
                  size="sm"
                  checked={isProf}
                  title={t.table.savingThrowTitle}
                  onChange={(nv) =>
                    mutate((d) => void (d.savingThrowProficiencies[a.key] = nv))
                  }
                />
                <span>
                  {t.table.savePrefix} {formatModifier(saveBonus)}
                </span>
              </div>
            </div>
          );
        })}
      </Panel>

      {/* Skills & Defenses */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel
          title={t.page1.skills}
          actions={
            <button
              type="button"
              className="btn-ghost px-2! py-1!"
              onClick={() =>
                mutate((d) =>
                  void d.skills.push({ id: createId(), name: '', bonus: d.proficiencyBonus }),
                )
              }
            >
              <Plus className="h-3 w-3" /> {t.monster.addSkill}
            </button>
          }
        >
          {m.skills.length === 0 ? (
            <p className="py-2 text-center text-xs text-ink-400">{t.common.noneDash}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {m.skills.map((sk, idx) => (
                <div key={sk.id} className="grid grid-cols-[1fr_72px_auto] items-center gap-1.5">
                  <TextInput
                    value={sk.name}
                    placeholder={t.monster.skillNamePh}
                    onChange={(v) => mutate((d) => void (d.skills[idx].name = v))}
                  />
                  <NumberInput
                    value={sk.bonus}
                    onChange={(v) => mutate((d) => void (d.skills[idx].bonus = v))}
                  />
                  <button
                    type="button"
                    className="btn-icon hover:text-blood-400!"
                    aria-label={t.common.remove}
                    onClick={() => mutate((d) => void d.skills.splice(idx, 1))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={t.monster.defensesAndSenses}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field label={t.monster.vulnerabilities}>
              <TextInput
                value={m.vulnerabilities}
                placeholder={t.monster.vulnerabilitiesPh}
                onChange={(v) => mutate((d) => void (d.vulnerabilities = v))}
              />
            </Field>
            <Field label={t.monster.resistances}>
              <TextInput
                value={m.resistances}
                placeholder={t.monster.resistancesPh}
                onChange={(v) => mutate((d) => void (d.resistances = v))}
              />
            </Field>
            <Field label={t.monster.damageImmunities}>
              <TextInput
                value={m.damageImmunities}
                placeholder={t.monster.damageImmunitiesPh}
                onChange={(v) => mutate((d) => void (d.damageImmunities = v))}
              />
            </Field>
            <Field label={t.monster.conditionImmunities}>
              <TextInput
                value={m.conditionImmunities}
                placeholder={t.monster.conditionImmunitiesPh}
                onChange={(v) => mutate((d) => void (d.conditionImmunities = v))}
              />
            </Field>
          </div>
        </Panel>
      </div>

      {/* Traits, Actions, Reactions, Legendary, Lair */}
      {entrySections.map((sec) => {
        const isLegendary = sec.key === 'legendaryActions';
        const isLair = sec.key === 'lairActions';

        const headerExtra = isLegendary ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-300">
              <span>{t.monster.legendaryActionsPerRound}:</span>
              <NumberInput
                value={m.legendaryActionsTotal}
                min={0}
                max={10}
                className="h-6 w-12 py-0! text-xs!"
                onChange={(v) =>
                  mutate((d) => {
                    d.legendaryActionsTotal = v;
                    d.legendaryActionsUsed = Math.min(d.legendaryActionsUsed, v);
                  })
                }
              />
            </label>
            {m.legendaryActionsTotal > 0 && (
              <Pips
                total={m.legendaryActionsTotal}
                filled={m.legendaryActionsUsed}
                tone="gold"
                label={t.monster.legendaryActionsUsedLabel}
                onChange={(n) => mutate((d) => void (d.legendaryActionsUsed = n))}
              />
            )}
          </div>
        ) : isLair ? (
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-300">
            <span>{t.monster.lairInitiativeLabel}:</span>
            <NumberInput
              value={m.lairActionsInitiative}
              min={0}
              max={30}
              className="h-6 w-12 py-0! text-xs!"
              onChange={(v) => mutate((d) => void (d.lairActionsInitiative = v))}
            />
          </label>
        ) : undefined;

        return (
          <MonsterEntryEditorSection
            key={sec.key}
            title={sec.label}
            entries={m[sec.key]}
            showCost={isLegendary}
            headerExtra={headerExtra}
            onAdd={() =>
              mutate((d) => {
                if (isLegendary && d.legendaryActionsTotal === 0) {
                  d.legendaryActionsTotal = 3;
                }
                d[sec.key].push(createBlankMonsterEntry());
              })
            }
            onMutate={(fn) => mutate((d) => fn(d[sec.key]))}
          />
        );
      })}

      {/* Notes */}
      <Panel title={t.monster.notes}>
        <TextArea
          value={m.notes}
          rows={3}
          placeholder={t.monster.notesPh}
          onChange={(v) => mutate((d) => void (d.notes = v))}
        />
      </Panel>
    </div>
  );
}
