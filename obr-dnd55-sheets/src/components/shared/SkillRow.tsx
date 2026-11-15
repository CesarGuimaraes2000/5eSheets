import type { ProficiencyLevel } from '../../types/character';
import { DerivedValue } from './DerivedValue';
import { cx } from './ui';

const NEXT: Record<ProficiencyLevel, ProficiencyLevel> = {
  none: 'proficient',
  proficient: 'expertise',
  expertise: 'none',
};

const LABEL: Record<ProficiencyLevel, string> = {
  none: 'Not proficient',
  proficient: 'Proficient',
  expertise: 'Expertise',
};

/** Click cycles: empty → proficient → expertise (or just on/off when `allowExpertise` is false). */
export function ProficiencyToggle({
  level,
  onChange,
  allowExpertise = true,
  disabled,
}: {
  level: ProficiencyLevel;
  onChange: (level: ProficiencyLevel) => void;
  allowExpertise?: boolean;
  disabled?: boolean;
}) {
  const next = allowExpertise ? NEXT[level] : level === 'none' ? 'proficient' : 'none';
  return (
    <button
      type="button"
      disabled={disabled}
      title={`${LABEL[level]} — click for ${LABEL[next].toLowerCase()}`}
      aria-label={LABEL[level]}
      onClick={() => onChange(next)}
      className={cx(
        'relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all enabled:cursor-pointer enabled:hover:scale-110',
        level === 'none' && 'border-ink-600',
        level === 'proficient' && 'animate-pop border-gold-500 bg-gold-500',
        level === 'expertise' && 'animate-pop border-gold-300 bg-gold-500 ring-2 ring-gold-400/40',
      )}
    >
      {level === 'expertise' && <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />}
    </button>
  );
}

/** One line of the skills / saving throws list. */
export function SkillRow({
  name,
  abilityAbbr,
  level,
  onLevelChange,
  total,
  onTotalChange,
  auto,
  readOnly,
  allowExpertise = true,
}: {
  name: string;
  abilityAbbr: string;
  level: ProficiencyLevel;
  onLevelChange: (level: ProficiencyLevel) => void;
  total: number;
  onTotalChange: (value: number) => void;
  auto: boolean;
  readOnly: boolean;
  allowExpertise?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-1.5 py-[3px] transition-colors hover:bg-ink-800/60">
      <ProficiencyToggle
        level={level}
        onChange={onLevelChange}
        allowExpertise={allowExpertise}
        disabled={readOnly}
      />
      <DerivedValue
        auto={auto}
        readOnly={readOnly}
        size="sm"
        asModifier
        label={name}
        value={total}
        onChange={onTotalChange}
      />
      <span className="min-w-0 flex-1 truncate text-[13px] text-ink-100">{name}</span>
      <span className="text-[10px] font-semibold tracking-wider text-ink-400">{abilityAbbr}</span>
    </div>
  );
}
