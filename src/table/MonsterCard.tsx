import { Link2, Shield, Skull } from 'lucide-react';
import type { MonsterSheet } from '../types/monster';
import { useI18n } from '../i18n/I18nContext';
import { cx } from '../components/shared/ui';

function monsterHpTone(cur: number, max: number): string {
  const pct = max > 0 ? cur / max : 0;
  if (cur <= 0) return 'bg-ink-600';
  return pct > 0.5 ? 'bg-life-500' : pct > 0.2 ? 'bg-gold-500' : 'bg-blood-500';
}

export function MonsterPortrait({
  url,
  size = 'md',
}: {
  url: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-16 w-16' } as const;
  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blood-500/40 bg-ink-800',
        sizes[size],
      )}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <Skull className="h-1/2 w-1/2 text-blood-400" />
      )}
    </div>
  );
}

/** Compact enemy/monster card for the GM-only sidebar. */
export function MonsterCard({
  monster: m,
  selected,
  onSelect,
  linkMode,
  onLink,
}: {
  monster: MonsterSheet;
  selected: boolean;
  onSelect: () => void;
  linkMode: boolean;
  onLink: () => void;
}) {
  const { t } = useI18n();
  const pct = m.hpMax > 0 ? Math.min(100, Math.max(0, (m.hpCurrent / m.hpMax) * 100)) : 0;
  const subtitle = [m.size, m.creatureType].filter(Boolean).join(' · ') || t.common.noneDash;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      className={cx(
        'group animate-fade-in relative flex cursor-pointer flex-col gap-2 rounded-xl border p-2.5 transition-all',
        selected
          ? 'border-blood-500/70 bg-ink-850 shadow-[0_0_0_1px_rgb(217_68_82/0.2),0_8px_24px_-12px_rgb(217_68_82/0.35)]'
          : 'border-ink-700/70 bg-ink-900/80 hover:border-ink-600 hover:bg-ink-850',
      )}
    >
      <div className="flex items-center gap-2.5">
        <MonsterPortrait url={m.imageUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-ink-100">
              {m.name || t.monster.unnamedMonster}
            </span>
          </div>
          <div className="truncate text-[11px] text-ink-400">{subtitle}</div>
        </div>
        <div
          className="relative flex h-9 w-8 shrink-0 items-center justify-center"
          title={t.table.armorClassTitle}
        >
          <Shield className="absolute h-9 w-8 text-ink-700" strokeWidth={1.5} fill="currentColor" />
          <span className="relative font-display text-xs font-bold text-ink-100">{m.ac}</span>
        </div>
      </div>

      <div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-ink-800">
          <div
            className={cx('h-full transition-all duration-500', monsterHpTone(m.hpCurrent, m.hpMax))}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-ink-400">
          <span className="tabular-nums">
            <b className="text-ink-100">{m.hpCurrent}</b>/{m.hpMax} {t.table.hpAbbr}
            {m.hpTemp > 0 && <span className="ml-1 text-arcane-400">+{m.hpTemp}</span>}
          </span>
          <span className="chip border-blood-500/40 px-1.5! py-0! text-[9px]! text-blood-400">
            {t.monster.crPrefix} {m.challengeRating || '0'}
          </span>
        </div>
      </div>

      {m.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {m.conditions.slice(0, 3).map((c) => (
            <span key={c} className="chip border-blood-500/40 text-blood-400">
              {t.conditions[c] ?? c}
            </span>
          ))}
          {m.conditions.length > 3 && (
            <span className="chip border-ink-700 text-ink-400">+{m.conditions.length - 3}</span>
          )}
        </div>
      )}

      {linkMode && (
        <button
          type="button"
          className="btn-primary w-full"
          onClick={(e) => {
            e.stopPropagation();
            onLink();
          }}
        >
          <Link2 className="h-3.5 w-3.5" /> {t.table.linkToToken}
        </button>
      )}
    </div>
  );
}
