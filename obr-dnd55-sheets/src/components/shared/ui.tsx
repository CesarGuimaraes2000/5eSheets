import { useEffect, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
export { cx };

// ---------------------------------------------------------------------------

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx('panel animate-fade-in', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-ink-700/60 px-3 py-2">
          {title && <h3 className="panel-title">{title}</h3>}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cx('p-3', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface TextInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  bare?: boolean;
}

export function TextInput({ id, value, onChange, placeholder, className, disabled, bare }: TextInputProps) {
  return (
    <input
      id={id}
      type="text"
      className={cx(bare ? 'input-bare' : 'input', className)}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled,
  rows,
}: Omit<TextInputProps, 'bare'> & { rows?: number }) {
  return (
    <textarea
      id={id}
      className={cx('textarea', className)}
      value={value}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Number input that keeps its own text while typing (so "-" or "" are allowed)
 * and only commits valid numbers.
 */
export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  className,
  disabled,
  bare,
  title,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
  bare?: boolean;
  title?: string;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText((current) => (Number(current) === value && current !== '' ? current : String(value)));
  }, [value]);

  const clampValue = (n: number) => {
    let out = n;
    if (min !== undefined) out = Math.max(min, out);
    if (max !== undefined) out = Math.min(max, out);
    return out;
  };

  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      title={title}
      className={cx(bare ? 'input-bare' : 'input', 'text-center tabular-nums', className)}
      value={text}
      disabled={disabled}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(clampValue(Math.trunc(n)));
      }}
      onBlur={() => setText(String(value))}
    />
  );
}

// ---------------------------------------------------------------------------

export function Toggle({
  id,
  checked,
  onChange,
  label,
  disabled,
}: {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={cx(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-gold-500 bg-gold-500/80' : 'border-ink-600 bg-ink-800',
        )}
      >
        <span
          className={cx(
            'absolute h-3.5 w-3.5 rounded-full bg-ink-100 shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
          )}
        />
      </span>
      {label && <span className="group-hover:text-ink-100">{label}</span>}
    </button>
  );
}

/** Round checkbox, as on the paper sheet. */
export function Dot({
  checked,
  onChange,
  title,
  tone = 'gold',
  disabled,
  size = 'md',
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  title?: string;
  tone?: 'gold' | 'life' | 'blood' | 'arcane';
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const tones = {
    gold: 'border-gold-500 bg-gold-500',
    life: 'border-life-500 bg-life-500',
    blood: 'border-blood-500 bg-blood-500',
    arcane: 'border-arcane-500 bg-arcane-500',
  } as const;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={checked}
      disabled={disabled || !onChange}
      onClick={() => onChange?.(!checked)}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 transition-all enabled:cursor-pointer enabled:hover:scale-110',
        size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5',
        checked ? cx(tones[tone], 'animate-pop') : 'border-ink-600 bg-transparent',
      )}
    >
      {checked && size === 'md' && <Check className="h-2.5 w-2.5 text-ink-950" strokeWidth={4} />}
    </button>
  );
}

/** A row of clickable pips (spell slots, death saves...). Clicking pip i sets the count to i+1 (or i when already set). */
export function Pips({
  total,
  filled,
  onChange,
  tone = 'arcane',
  disabled,
  label,
}: {
  total: number;
  filled: number;
  onChange?: (filled: number) => void;
  tone?: 'gold' | 'life' | 'blood' | 'arcane';
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <Dot
          key={i}
          size="sm"
          tone={tone}
          checked={i < filled}
          disabled={disabled}
          title={`${label ?? ''} ${i + 1}`.trim()}
          onChange={onChange ? () => onChange(i < filled ? i : i + 1) : undefined}
        />
      ))}
    </div>
  );
}

/** Large stat box (AC, Initiative, Speed...). */
export function StatBox({
  label,
  children,
  hint,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-ink-700 bg-ink-850/80 px-2 py-2 text-center',
        className,
      )}
    >
      <span className="field-label leading-tight">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-ink-400">{hint}</span>}
    </div>
  );
}
