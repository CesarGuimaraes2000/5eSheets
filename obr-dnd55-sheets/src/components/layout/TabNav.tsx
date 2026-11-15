import type { LucideIcon } from 'lucide-react';
import { cx } from '../shared/ui';

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

/** Pill-style tab navigation. */
export function TabNav<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav className="flex gap-1 rounded-xl border border-ink-700/70 bg-ink-900/80 p-1" role="tablist">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={cx(
              'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              isActive
                ? 'bg-gradient-to-b from-ink-700 to-ink-800 text-gold-300 shadow-[0_0_0_1px_rgb(226_163_54/0.35)]'
                : 'text-ink-400 hover:bg-ink-800/70 hover:text-ink-100',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
