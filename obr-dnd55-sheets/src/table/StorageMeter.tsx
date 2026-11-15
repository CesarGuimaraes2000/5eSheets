import { Database } from 'lucide-react';
import { ROOM_METADATA_LIMIT } from '../constants/keys';
import { useI18n } from '../i18n/I18nContext';
import { cx } from '../components/shared/ui';

/** Shows how much of the 16 kB room metadata budget is in use (shared by all extensions). */
export function StorageMeter({ bytes }: { bytes: number }) {
  const { t } = useI18n();
  const pct = Math.min(100, (bytes / ROOM_METADATA_LIMIT) * 100);
  const tone = pct > 90 ? 'bg-blood-500' : pct > 70 ? 'bg-gold-500' : 'bg-life-500';
  const kb = (bytes / 1024).toFixed(1);
  return (
    <div className="flex items-center gap-2" title={t.table.storageTooltip(kb)}>
      <Database className="h-3.5 w-3.5 text-ink-400" />
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-800">
        <div className={cx('h-full rounded-full transition-all duration-500', tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-ink-400 tabular-nums">{kb}/16 kB</span>
    </div>
  );
}
