import { useState, type ReactNode } from 'react';
import {
  Copy,
  Dices,
  Download,
  Eye,
  Flame,
  Heart,
  HeartPulse,
  Minus,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  ShieldPlus,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  Wind,
  Zap,
} from 'lucide-react';
import type { MonsterEntry, MonsterSheet } from '../../types/monster';
import { ABILITIES, CONDITIONS } from '../../constants/dnd55Rules';
import { useI18n } from '../../i18n/I18nContext';
import { calculateAbilityModifier, formatModifier } from '../../utils/calculations';
import { extractDiceNotation } from '../../utils/dice';
import { analyzeMonsterEntryText } from '../../utils/monsterStorage';
import { useDiceRoller } from '../shared/DiceRoller';
import { NumberInput, Panel, cx } from '../shared/ui';
import { MonsterPortrait } from '../../table/MonsterCard';

type MonsterRecipe = (draft: MonsterSheet) => void;

function StatTile({
  icon,
  label,
  sublabel,
  onClick,
  title,
  children,
}: {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  title?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      <span className="field-label inline-flex items-center gap-1">
        {icon}
        {label}
        {onClick && (
          <Dices className="h-2.5 w-2.5 text-gold-400/75 transition-colors group-hover:text-gold-300" />
        )}
      </span>
      <span className="stat-value text-lg!">{children}</span>
      {sublabel && <span className="max-w-full truncate px-1 text-[9px] text-ink-400">{sublabel}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className="group flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-ink-700 bg-ink-850/80 px-1 py-2 transition-colors hover:border-gold-500/60 hover:bg-ink-800/90"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg border border-ink-700 bg-ink-850/80 px-1 py-2">
      {content}
    </div>
  );
}

function MonsterEntrySection({
  title,
  icon,
  entries,
  monsterName,
}: {
  title: string;
  icon: ReactNode;
  entries: MonsterEntry[];
  monsterName: string;
}) {
  const { t } = useI18n();
  const { promptRoll, promptDamage } = useDiceRoller();

  if (entries.length === 0) return null;

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-1.5">
          {icon} {title}
        </span>
      }
      bodyClassName="flex flex-col gap-2 p-2.5"
    >
      {entries.map((entry) => {
        const { atkBonus, saveDc, damageNotation } = analyzeMonsterEntryText(entry.detail, entry);
        const entryLabel = `${monsterName || t.monster.unnamedMonster}: ${entry.name || title}`;

        return (
          <div
            key={entry.id}
            className="rounded-lg border border-ink-700/60 bg-ink-850/60 p-2.5 transition-colors hover:border-ink-600"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-sm font-bold text-ink-100">
                {entry.name || title}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5">
                {atkBonus !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      promptRoll({
                        label: entryLabel,
                        bonus: atkBonus,
                        damageRaw: damageNotation ?? undefined,
                      })
                    }
                    title={t.roll.rollTooltip(entryLabel)}
                    className="chip cursor-pointer border-gold-500/50 bg-gold-500/15 text-gold-300 transition-colors hover:border-gold-400 hover:bg-gold-500/25"
                  >
                    <Dices className="h-3 w-3" />
                    {t.monster.rollAttackBtn(formatModifier(atkBonus))}
                  </button>
                )}

                {saveDc !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      promptRoll({
                        label: `${entryLabel} (${t.table.dcLabel} ${saveDc})`,
                        bonus: 0,
                        damageRaw: damageNotation ?? undefined,
                        isSaveDc: true,
                        dcValue: saveDc,
                      })
                    }
                    title={t.roll.rollTooltip(`${entryLabel} (${t.table.dcLabel} ${saveDc})`)}
                    className="chip cursor-pointer border-arcane-500/50 bg-arcane-500/15 text-arcane-400 transition-colors hover:border-arcane-400 hover:bg-arcane-500/25"
                  >
                    <Dices className="h-3 w-3" />
                    {t.monster.rollDcBtn(saveDc)}
                  </button>
                )}

                {damageNotation !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      promptDamage({
                        label: `${entryLabel} — ${t.table.damage}`,
                        damageRaw: damageNotation,
                      })
                    }
                    title={t.roll.rollTooltip(`${entryLabel} — ${t.table.damage}`)}
                    className="chip cursor-pointer border-blood-500/50 bg-blood-700/25 text-blood-400 transition-colors hover:border-blood-400 hover:bg-blood-700/40"
                  >
                    <Swords className="h-3 w-3" />
                    {t.monster.rollDamageBtn(damageNotation)}
                  </button>
                )}
              </div>
            </div>
            {entry.detail && (
              <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap text-ink-300">
                {entry.detail}
              </p>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

/** Interactive GM Monster Statblock with live HP/Condition controls and direct DiceV2 rolls. */
export function MonsterDetail({
  monster: m,
  onUpdate,
  onDuplicateInstance,
  onEdit,
  onExport,
  onDelete,
}: {
  monster: MonsterSheet;
  onUpdate: (recipe: MonsterRecipe) => void;
  onDuplicateInstance: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const { promptRoll, promptDamage } = useDiceRoller();
  const [amount, setAmount] = useState(0);

  const pct = m.hpMax > 0 ? Math.min(100, Math.max(0, (m.hpCurrent / m.hpMax) * 100)) : 0;
  const barTone =
    m.hpCurrent <= 0
      ? 'bg-ink-600'
      : pct > 50
        ? 'bg-life-500'
        : pct > 20
          ? 'bg-gold-500'
          : 'bg-blood-500';

  const displayName = m.name || t.monster.unnamedMonster;
  const hasHpDice = Boolean(extractDiceNotation(m.hpFormula));

  const damage = () =>
    onUpdate((d) => {
      const fromTemp = Math.min(d.hpTemp, amount);
      d.hpTemp -= fromTemp;
      d.hpCurrent = Math.max(0, d.hpCurrent - (amount - fromTemp));
    });

  const heal = () =>
    onUpdate((d) => {
      d.hpCurrent = Math.min(d.hpMax, d.hpCurrent + amount);
    });

  const setTemp = () => onUpdate((d) => void (d.hpTemp = Math.max(0, amount)));

  const defenseRows = [
    { label: t.monster.vulnerabilities, value: m.vulnerabilities },
    { label: t.monster.resistances, value: m.resistances },
    { label: t.monster.damageImmunities, value: m.damageImmunities },
    { label: t.monster.conditionImmunities, value: m.conditionImmunities },
    { label: t.monster.senses, value: m.senses },
    { label: t.monster.languages, value: m.languages },
  ].filter((r) => r.value.trim().length > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="panel flex flex-wrap items-center gap-3 border-blood-500/30 p-3">
        <MonsterPortrait url={m.imageUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-xl font-bold text-ink-100">{displayName}</h2>
            <span className="chip border-blood-500/50 bg-blood-700/25 text-[10px]! text-blood-400">
              <Skull className="h-3 w-3" /> {t.monster.gmOnlyBadge}
            </span>
          </div>
          <p className="truncate text-xs text-ink-300">
            {[m.size, m.creatureType, m.alignment].filter(Boolean).join(' · ') || t.common.noneDash}
          </p>
          <p className="mt-1 text-[10px] text-ink-400">{t.monster.privateNotice}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="btn-ghost"
            onClick={onDuplicateInstance}
            title={t.monster.duplicateInstanceTitle}
          >
            <Copy className="h-3.5 w-3.5" /> {t.monster.duplicateInstance}
          </button>
          <button type="button" className="btn-primary" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> {t.monster.editMonster}
          </button>
          <button
            type="button"
            className="btn-ghost"
            title={t.common.exportJson}
            onClick={onExport}
          >
            <Download className="h-3.5 w-3.5" /> {t.common.export}
          </button>
          <button
            type="button"
            className="btn-icon hover:text-blood-400!"
            title={t.common.delete}
            aria-label={t.common.delete}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-5 gap-2">
        <StatTile icon={<Shield className="h-3 w-3" />} label={t.table.tileAc} sublabel={m.acType || undefined}>
          {m.ac}
        </StatTile>
        <StatTile
          icon={<Zap className="h-3 w-3" />}
          label={t.table.tileInit}
          onClick={() => promptRoll({ label: `${displayName}: ${t.page1.initiative}`, bonus: m.initiativeBonus })}
          title={t.roll.rollTooltip(`${displayName}: ${t.page1.initiative}`)}
        >
          {formatModifier(m.initiativeBonus)}
        </StatTile>
        <StatTile icon={<Wind className="h-3 w-3" />} label={t.table.tileSpeed}>
          <span className="text-sm">{m.speed || t.common.noneDash}</span>
        </StatTile>
        <StatTile icon={<Plus className="h-3 w-3" />} label={t.table.tileProf}>
          {formatModifier(m.proficiencyBonus)}
        </StatTile>
        <StatTile
          icon={<Skull className="h-3 w-3" />}
          label={t.monster.crPrefix}
          sublabel={m.xp ? `${m.xp} XP` : undefined}
        >
          {m.challengeRating || '0'}
        </StatTile>
      </div>

      {/* HP & Conditions */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_1fr]">
        <Panel
          title={
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3 w-3" /> {t.table.hitPoints}
            </span>
          }
          actions={
            m.hpFormula ? (
              hasHpDice ? (
                <button
                  type="button"
                  onClick={() =>
                    promptDamage({
                      label: `${displayName} — ${t.table.hitPoints}`,
                      damageRaw: m.hpFormula,
                    })
                  }
                  title={t.monster.rollHpFormulaTitle}
                  className="chip cursor-pointer border-gold-500/45 bg-gold-500/10 text-[10px]! text-gold-300 hover:border-gold-400"
                >
                  <Dices className="h-3 w-3" /> {m.hpFormula}
                </button>
              ) : (
                <span className="text-[11px] text-ink-400">{m.hpFormula}</span>
              )
            ) : undefined
          }
        >
          <div className="flex items-end justify-between">
            <div className="font-display tabular-nums">
              <span className="text-3xl font-bold text-ink-100">{m.hpCurrent}</span>
              <span className="text-base text-ink-400"> / {m.hpMax}</span>
              {m.hpTemp > 0 && (
                <span className="ml-2 text-base font-bold text-arcane-400">
                  +{m.hpTemp} {t.table.tempSuffix}
                </span>
              )}
            </div>
            <label className="flex items-center gap-1 text-[10px] text-ink-400">
              {t.table.hpMaxLabel}
              <NumberInput
                value={m.hpMax}
                min={0}
                className="h-6 w-14 py-0!"
                onChange={(v) =>
                  onUpdate((d) => {
                    d.hpMax = v;
                    d.hpCurrent = Math.min(d.hpCurrent, v);
                  })
                }
              />
            </label>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-800">
            <div className={cx('h-full rounded-full transition-all duration-500', barTone)} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-[64px_1fr_1fr_1fr] gap-1.5">
            <NumberInput value={amount} min={0} onChange={setAmount} title={t.table.amountTitle} />
            <button type="button" className="btn-danger" onClick={damage} disabled={amount <= 0}>
              <Minus className="h-3.5 w-3.5" /> {t.table.damage}
            </button>
            <button
              type="button"
              className="btn border border-life-500/50 bg-life-500/15 text-life-400 hover:bg-life-500/25"
              onClick={heal}
              disabled={amount <= 0}
            >
              <HeartPulse className="h-3.5 w-3.5" /> {t.table.heal}
            </button>
            <button
              type="button"
              className="btn border border-arcane-500/50 bg-arcane-500/15 text-arcane-400 hover:bg-arcane-500/25"
              onClick={setTemp}
            >
              <ShieldPlus className="h-3.5 w-3.5" /> {t.table.tempBtn}
            </button>
          </div>
        </Panel>

        <Panel title={t.table.conditions}>
          <div className="flex flex-wrap gap-1">
            {CONDITIONS.map((cond) => {
              const active = m.conditions.includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() =>
                    onUpdate((d) => {
                      d.conditions = active
                        ? d.conditions.filter((x) => x !== cond)
                        : [...d.conditions, cond];
                    })
                  }
                  className={cx(
                    'chip cursor-pointer transition-colors',
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
      </div>

      {/* Abilities & Saves */}
      <Panel title={t.table.abilitiesAndSaves} bodyClassName="grid grid-cols-6 gap-2 p-3">
        {ABILITIES.map((a) => {
          const score = m.abilities[a.key];
          const mod = calculateAbilityModifier(score);
          const isProfSave = m.savingThrowProficiencies[a.key];
          const saveTotal = mod + (isProfSave ? m.proficiencyBonus : 0);

          return (
            <div
              key={a.key}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-ink-700 bg-ink-850/70 px-1 py-1.5"
            >
              <button
                type="button"
                onClick={() =>
                  promptRoll({
                    label: `${displayName}: ${t.abilities[a.key].label}`,
                    bonus: mod,
                  })
                }
                title={t.roll.rollTooltip(`${displayName}: ${t.abilities[a.key].label}`)}
                className="group flex w-full cursor-pointer flex-col items-center gap-0.5 rounded py-0.5 transition-colors hover:bg-ink-800/75"
              >
                <span className="font-display text-[10px] font-bold tracking-[0.18em] text-ink-300 group-hover:text-gold-300">
                  {t.abilities[a.key].abbr}
                </span>
                <span className="stat-value text-gold-300!">{formatModifier(mod)}</span>
                <span className="text-[10px] text-ink-400">{score}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  promptRoll({
                    label: `${displayName}: ${t.table.savingThrowTitle} — ${t.abilities[a.key].label}`,
                    bonus: saveTotal,
                  })
                }
                title={t.roll.rollTooltip(`${displayName}: ${t.table.savingThrowTitle} (${t.abilities[a.key].abbr})`)}
                className={cx(
                  'mt-0.5 inline-flex cursor-pointer items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                  isProfSave
                    ? 'bg-gold-500/20 text-gold-300 hover:bg-gold-500/35'
                    : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100',
                )}
              >
                {t.table.savePrefix} {formatModifier(saveTotal)}
              </button>
            </div>
          );
        })}
      </Panel>

      {/* Skills, Defenses & Senses */}
      {(m.skills.length > 0 || defenseRows.length > 0) && (
        <Panel
          title={
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3 w-3" /> {t.monster.defensesAndSenses}
            </span>
          }
          bodyClassName="flex flex-col gap-2 p-3"
        >
          {m.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {m.skills.map((sk) => (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() =>
                    promptRoll({
                      label: `${displayName}: ${sk.name}`,
                      bonus: sk.bonus,
                    })
                  }
                  title={t.roll.rollTooltip(`${displayName}: ${sk.name}`)}
                  className="chip cursor-pointer border-gold-500/40 bg-ink-850 text-ink-100 transition-colors hover:border-gold-400 hover:text-gold-300"
                >
                  <Dices className="h-3 w-3 text-gold-400" />
                  <span>{sk.name}</span>
                  <span className="font-bold text-gold-300">{formatModifier(sk.bonus)}</span>
                </button>
              ))}
            </div>
          )}

          {defenseRows.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
              {defenseRows.map((row) => (
                <div key={row.label} className="rounded bg-ink-850/60 px-2 py-1">
                  <span className="font-semibold text-ink-300">{row.label}: </span>
                  <span className="text-ink-100">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Traits, Actions, Bonus Actions, Reactions, Legendary, Lair */}
      <MonsterEntrySection
        title={t.monster.traits}
        icon={<Sparkles className="h-3 w-3" />}
        entries={m.traits}
        monsterName={displayName}
      />
      <MonsterEntrySection
        title={t.monster.actions}
        icon={<Swords className="h-3 w-3" />}
        entries={m.actions}
        monsterName={displayName}
      />
      <MonsterEntrySection
        title={t.monster.bonusActions}
        icon={<Zap className="h-3 w-3" />}
        entries={m.bonusActions}
        monsterName={displayName}
      />
      <MonsterEntrySection
        title={t.monster.reactions}
        icon={<ShieldAlert className="h-3 w-3" />}
        entries={m.reactions}
        monsterName={displayName}
      />
      <MonsterEntrySection
        title={t.monster.legendaryActions}
        icon={<Flame className="h-3 w-3" />}
        entries={m.legendaryActions}
        monsterName={displayName}
      />
      <MonsterEntrySection
        title={t.monster.lairActions}
        icon={<Skull className="h-3 w-3" />}
        entries={m.lairActions}
        monsterName={displayName}
      />

      {m.notes.trim() && (
        <Panel title={t.monster.notes}>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-ink-300">{m.notes}</p>
        </Panel>
      )}
    </div>
  );
}
