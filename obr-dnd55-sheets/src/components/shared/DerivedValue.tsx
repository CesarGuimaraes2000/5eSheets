import { Lock } from 'lucide-react';
import { formatModifier } from '../../utils/calculations';
import { useI18n } from '../../i18n/I18nContext';
import { NumberInput, cx } from './ui';

/**
 * A calculated value. Read-only (with a lock hint) while automatic calculations
 * are on; becomes an editable number when they are off.
 */
export function DerivedValue({
  auto,
  value,
  onChange,
  asModifier = false,
  readOnly = false,
  size = 'md',
  className,
  label,
}: {
  auto: boolean;
  value: number;
  onChange: (value: number) => void;
  asModifier?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) {
  const { t } = useI18n();
  const displayLabel = label ?? t.shared.valueFallback;
  const sizes = {
    sm: 'w-10 text-xs',
    md: 'w-12 text-sm',
    lg: 'w-16 text-xl font-display font-bold',
  } as const;

  if (auto || readOnly) {
    return (
      <span
        title={auto ? t.shared.calculatedAuto(displayLabel) : label}
        aria-label={label}
        className={cx(
          'inline-flex items-center justify-center gap-0.5 rounded-md px-1 py-0.5 tabular-nums font-semibold text-gold-300',
          sizes[size],
          className,
        )}
      >
        {asModifier ? formatModifier(value) : value}
        {auto && size !== 'sm' && <Lock className="h-2.5 w-2.5 text-ink-600" aria-hidden />}
      </span>
    );
  }

  return (
    <NumberInput
      value={value}
      onChange={onChange}
      title={t.shared.manualTooltip(displayLabel)}
      className={cx(sizes[size], 'border-gold-600/50! px-1! py-0.5!', className)}
    />
  );
}
