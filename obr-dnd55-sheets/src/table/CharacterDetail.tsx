import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  Download,
  Heart,
  HeartPulse,
  Minus,
  Plus,
  ScrollText,
  Shield,
  ShieldPlus,
  Sparkles,
  Swords,
  Trash2,
  Wind,
  Zap,
  Eye,
  Wand2,
} from 'lucide-react';
import type { CharacterSummary } from '../types/summary';
import type { PartyMember } from '../obr/backend';
import { ABILITIES, CONDITIONS, MAX_EXHAUSTION, SKILLS } from '../constants/dnd55Rules';
import { useI18n } from '../i18n/I18nContext';
import { formatModifier } from '../utils/calculations';
import { NumberInput, Panel, Pips, cx } from '../components/shared/ui';
import { Portrait, hpTone } from './PartyCard';

type Recipe = (draft: CharacterSummary) => void;

function Tile({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-ink-700 bg-ink-850/80 px-1 py-2">
      <span className="field-label inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="stat-value text-lg!">{children}</span>
    </div>
  );
}

/** Live, compact character view shown at the table (backed by the room summary). */
export function CharacterDetail({
  summary: s,
  canEdit,
  isGM,
  hasLocalSheet,
  party,
  onUpdate,
  onOpenSheet,
  onExport,
  onRemove,
  onAssignOwner,
}: {
  summary: CharacterSummary;
  canEdit: boolean;
  isGM: boolean;
  hasLocalSheet: boolean;
  party: PartyMember[];
  onUpdate: (recipe: Recipe) => void;
  onOpenSheet: () => void;
  onExport: () => void;
  onRemove: () => void;
  onAssignOwner: (member: PartyMember) => void;
}) {
  const { t } = useI18n();
  const [amount, setAmount] = useState(0);
  const [cur, max, temp] = s.hp;
  const pct = max > 0 ? Math.min(100, Math.max(0, (cur / max) * 100)) : 0;
  const ro = !canEdit;

  const damage = () =>
    onUpdate((d) => {
      const fromTemp = Math.min(d.hp[2], amount);
      d.hp[2] -= fromTemp;
      d.hp[0] = Math.max(0, d.hp[0] - (amount - fromTemp));
    });
  const heal = () =>
    onUpdate((d) => {
      const wasDown = d.hp[0] === 0;
      d.hp[0] = Math.min(d.hp[1], d.hp[0] + amount);
      if (wasDown && d.hp[0] > 0) d.ds = [0, 0];
    });
  const setTemp = () => onUpdate((d) => void (d.hp[2] = Math.max(0, amount)));

  const ownerOptions = [...party];
  if (!ownerOptions.some((p) => p.id === s.o)) {
    ownerOptions.unshift({ id: s.o, name: s.on || t.table.unknownPlayer });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="panel flex items-center gap-3 p-3">
        <Portrait url={s.img} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-bold text-ink-100">{s.n}</h2>
          <p className="truncate text-xs text-ink-300">
            {[s.sp, s.cl].filter(Boolean).join(' · ') || t.common.noneDash}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-400">
            {t.table.playerLabel}
            {isGM ? (
              <select
                className="input h-6 w-auto max-w-[160px] py-0! text-[11px]!"
                value={s.o}
                onChange={(e) => {
                  const m = ownerOptions.find((p) => p.id === e.target.value);
                  if (m) onAssignOwner(m);
                }}
              >
                {ownerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-ink-100">{s.on}</span>
            )}
            {ro && <span className="chip border-ink-700 text-ink-400">{t.table.viewOnly}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1.5">
            {hasLocalSheet && (
              <>
                <button id="open-full-sheet" type="button" className="btn-primary" onClick={onOpenSheet}>
                  <ScrollText className="h-3.5 w-3.5" /> {t.table.fullSheetBtn}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  title={t.table.exportUpdatedTooltip}
                  onClick={onExport}
                >
                  <Download className="h-3.5 w-3.5" /> {t.common.export}
                </button>
              </>
            )}
            {canEdit && (
              <button
                type="button"
                className="btn-icon hover:text-blood-400!"
                title={t.table.removeFromRoom}
                aria-label={t.table.removeFromRoom}
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={ro}
            onClick={() => onUpdate((d) => void (d.insp = d.insp ? 0 : 1))}
            className={cx(
              'chip cursor-pointer transition-all disabled:cursor-default',
              s.insp
                ? 'border-gold-500 bg-gold-500/15 text-gold-300 shadow-[0_0_14px_-4px_rgb(226_163_54/0.7)]'
                : 'border-ink-700 text-ink-400 enabled:hover:text-ink-100',
            )}
          >
            <Sparkles className="h-3 w-3" /> {t.page1.heroicInspiration}
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-5 gap-2">
        <Tile icon={<Shield className="h-3 w-3" />} label={t.table.tileAc}>{s.ac}</Tile>
        <Tile icon={<Zap className="h-3 w-3" />} label={t.table.tileInit}>{formatModifier(s.ini)}</Tile>
        <Tile icon={<Wind className="h-3 w-3" />} label={t.table.tileSpeed}>
          <span className="text-sm">{s.spd || t.common.noneDash}</span>
        </Tile>
        <Tile icon={<Plus className="h-3 w-3" />} label={t.table.tileProf}>{formatModifier(s.pb)}</Tile>
        <Tile icon={<Eye className="h-3 w-3" />} label={t.table.tilePassive}>{s.pp}</Tile>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_1fr]">
        {/* HP */}
        <Panel title={<span className="inline-flex items-center gap-1.5"><Heart className="h-3 w-3" /> {t.table.hitPoints}</span>}>
          <div className="flex items-end justify-between">
            <div className="font-display tabular-nums">
              <span className="text-3xl font-bold text-ink-100">{cur}</span>
              <span className="text-base text-ink-400"> / {max}</span>
              {temp > 0 && (
                <span className="ml-2 text-base font-bold text-arcane-400">
                  +{temp} {t.table.tempSuffix}
                </span>
              )}
            </div>
            {canEdit && (
              <label className="flex items-center gap-1 text-[10px] text-ink-400">
                {t.table.hpMaxLabel}
                <NumberInput
                  value={max}
                  min={0}
                  className="h-6 w-12 py-0!"
                  onChange={(v) => onUpdate((d) => {
                    d.hp[1] = v;
                    d.hp[0] = Math.min(d.hp[0], v);
                  })}
                />
              </label>
            )}
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-800">
            <div className={cx('h-full rounded-full transition-all duration-500', hpTone(s))} style={{ width: `${pct}%` }} />
          </div>
          {canEdit && (
            <div className="mt-3 grid grid-cols-[64px_1fr_1fr_1fr] gap-1.5">
              <NumberInput id="hp-amount" value={amount} min={0} onChange={setAmount} title={t.table.amountTitle} />
              <button id="hp-damage" type="button" className="btn-danger" onClick={damage} disabled={amount <= 0}>
                <Minus className="h-3.5 w-3.5" /> {t.table.damage}
              </button>
              <button
                id="hp-heal"
                type="button"
                className="btn border border-life-500/50 bg-life-500/15 text-life-400 hover:bg-life-500/25"
                onClick={heal}
                disabled={amount <= 0}
              >
                <HeartPulse className="h-3.5 w-3.5" /> {t.table.heal}
              </button>
              <button
                id="hp-temp"
                type="button"
                className="btn border border-arcane-500/50 bg-arcane-500/15 text-arcane-400 hover:bg-arcane-500/25"
                onClick={setTemp}
              >
                <ShieldPlus className="h-3.5 w-3.5" /> {t.table.tempBtn}
              </button>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink-700/60 pt-3">
            <div className="flex flex-col gap-1.5">
              <span className="field-label">{t.table.deathSaves}</span>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-life-400">{t.table.successes}</span>
                <Pips total={3} filled={s.ds[0]} tone="life" label={t.table.successLabel} disabled={ro}
                  onChange={ro ? undefined : (n) => onUpdate((d) => void (d.ds[0] = n))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blood-400">{t.table.failures}</span>
                <Pips total={3} filled={s.ds[1]} tone="blood" label={t.table.failureLabel} disabled={ro}
                  onChange={ro ? undefined : (n) => onUpdate((d) => void (d.ds[1] = n))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="field-label">{t.table.hitDice}</span>
              <div className="flex items-center gap-1.5 text-xs text-ink-300">
                <input
                  className="input h-6 w-12 py-0! text-center"
                  value={s.hd[0]}
                  disabled={ro}
                  aria-label={t.table.hitDiceRemaining}
                  onChange={(e) => onUpdate((d) => void (d.hd[0] = e.target.value.slice(0, 12)))}
                />
                <span>{t.table.of} {s.hd[1] || t.common.noneDash}</span>
              </div>
              <span className="field-label mt-1">{t.table.exhaustion}</span>
              <div className="flex items-center gap-1">
                <Pips total={MAX_EXHAUSTION} filled={s.ex} tone="blood" label={t.table.exhaustionLevel} disabled={ro}
                  onChange={ro ? undefined : (n) => onUpdate((d) => void (d.ex = n))} />
              </div>
            </div>
          </div>
        </Panel>

        {/* Conditions */}
        <Panel title={t.table.conditions}>
          <div className="flex flex-wrap gap-1">
            {CONDITIONS.filter((c) => canEdit || s.cnd.includes(c)).map((cond) => {
              const active = s.cnd.includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  disabled={ro}
                  onClick={() =>
                    onUpdate((d) => {
                      d.cnd = active ? d.cnd.filter((x) => x !== cond) : [...d.cnd, cond];
                    })
                  }
                  className={cx(
                    'chip transition-colors enabled:cursor-pointer',
                    active
                      ? 'border-blood-500/70 bg-blood-700/40 text-blood-400'
                      : 'border-ink-700 text-ink-400 enabled:hover:border-ink-600 enabled:hover:text-ink-100',
                  )}
                >
                  {t.conditions[cond] ?? cond}
                </button>
              );
            })}
            {ro && s.cnd.length === 0 && <span className="text-xs text-ink-400">{t.table.noConditions}</span>}
          </div>
        </Panel>
      </div>

      {/* Abilities & saves */}
      <Panel title={t.table.abilitiesAndSaves} bodyClassName="grid grid-cols-6 gap-2 p-3">
        {ABILITIES.map((a, i) => (
          <div key={a.key} className="flex flex-col items-center gap-0.5 rounded-lg border border-ink-700 bg-ink-850/70 py-2">
            <span className="font-display text-[10px] font-bold tracking-[0.18em] text-ink-300">
              {t.abilities[a.key].abbr}
            </span>
            <span className="stat-value text-gold-300!">{formatModifier(s.am[i] ?? 0)}</span>
            <span className="text-[10px] text-ink-400">{s.ab[i]}</span>
            <span
              className={cx(
                'mt-1 rounded-full px-1.5 text-[10px] font-semibold',
                s.svp & (1 << i) ? 'bg-gold-500/20 text-gold-300' : 'text-ink-400',
              )}
              title={t.table.savingThrowTitle}
            >
              {t.table.savePrefix} {formatModifier(s.sv[i] ?? 0)}
            </span>
          </div>
        ))}
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Skills */}
        <Panel title={t.table.skills} bodyClassName="grid grid-cols-2 gap-x-2 p-2">
          {SKILLS.map((sk, i) => {
            const p = s.skp[i] ?? '0';
            return (
              <div key={sk.id} className="flex items-center gap-1.5 rounded px-1 py-[3px] hover:bg-ink-800/60">
                <span
                  className={cx(
                    'h-2.5 w-2.5 shrink-0 rounded-full border',
                    p === '0' && 'border-ink-600',
                    p === '1' && 'border-gold-500 bg-gold-500',
                    p === '2' && 'border-gold-300 bg-gold-500 ring-2 ring-gold-400/40',
                  )}
                />
                <span className="w-7 text-right text-xs font-semibold text-gold-300 tabular-nums">
                  {formatModifier(s.sk[i] ?? 0)}
                </span>
                <span className="truncate text-[12px] text-ink-100">{t.skills[sk.id] ?? sk.name}</span>
              </div>
            );
          })}
        </Panel>

        {/* Attacks */}
        <Panel title={<span className="inline-flex items-center gap-1.5"><Swords className="h-3 w-3" /> {t.table.attacks}</span>} bodyClassName="p-2">
          {s.atk.length === 0 ? (
            <p className="py-3 text-center text-xs text-ink-400">{t.table.noAttacks}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {s.atk.map(([name, bonus, dmg], i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md bg-ink-850/60 px-2 py-1.5">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-ink-100">{name}</div>
                    <div className="truncate text-[11px] text-ink-400">{dmg || t.common.noneDash}</div>
                  </div>
                  <span className="rounded-md border border-gold-500/40 px-1.5 py-0.5 text-xs font-bold text-gold-300 tabular-nums">
                    {bonus || t.common.noneDash}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Spellcasting */}
      {s.sc && (
        <Panel
          title={<span className="inline-flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> {t.table.spellcasting}</span>}
          actions={
            <div className="flex items-center gap-2 text-[11px] text-ink-300">
              {s.sc.cls && <span>{s.sc.cls}</span>}
              {s.sc.a && <span className="chip border-ink-700 text-ink-300">{s.sc.a}</span>}
              <span className="chip border-arcane-500/50 text-arcane-400">{t.table.dcLabel} {s.sc.dc}</span>
              <span className="chip border-arcane-500/50 text-arcane-400">{t.table.atkLabel} {formatModifier(s.sc.at)}</span>
            </div>
          }
        >
          {s.sc.sl.some(([total]) => total > 0) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {s.sc.sl.map(([total, used], i) =>
                total > 0 ? (
                  <div key={i} className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850/70 px-2 py-1">
                    <span className="font-display text-[11px] font-bold text-arcane-400">{i + 1}</span>
                    <Pips
                      total={total}
                      filled={used}
                      tone="arcane"
                      label={t.table.slotUsedLabel(i + 1)}
                      disabled={ro}
                      onChange={ro ? undefined : (n) => onUpdate((d) => {
                        if (d.sc) d.sc.sl[i] = [total, n];
                      })}
                    />
                  </div>
                ) : null,
              )}
            </div>
          )}
          {s.sc.sp.length === 0 ? (
            <p className="text-xs text-ink-400">{t.table.noPreparedSpells}</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
              {Array.from(new Set(s.sc.sp.map((sp) => sp[1]))).sort((a, b) => a - b).map((level) => (
                <div key={level}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <Wand2 className="h-3 w-3 text-arcane-400" />
                    <span className="field-label text-arcane-400!">{t.spellLevels[level]}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {s.sc!.sp.filter((sp) => sp[1] === level).map(([name, , flags, time, range], i) => (
                      <div key={`${name}-${i}`} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-ink-800/60">
                        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink-100">{name}</span>
                        {flags & 2 ? <span className="chip border-arcane-500/50 px-1! py-0! text-[9px]! text-arcane-400" title={t.page3.concentration}>C</span> : null}
                        {flags & 4 ? <span className="chip border-arcane-500/50 px-1! py-0! text-[9px]! text-arcane-400" title={t.page3.ritual}>R</span> : null}
                        <span className="shrink-0 text-[10px] text-ink-400">{[time, range].filter(Boolean).join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
