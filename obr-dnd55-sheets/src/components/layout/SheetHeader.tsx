import type { ReactNode } from 'react';
import type { SheetCtx } from '../sheetContext';
import type { CharacterSheet } from '../../types/character';
import { useI18n } from '../../i18n/I18nContext';
import { parseTotalLevel } from '../../utils/calculations';
import { Field, TextInput, Toggle } from '../shared/ui';

/** Persistent sheet header: name, the 6 header fields of the PDF, auto-calc toggle and actions. */
export function SheetHeader({ ctx, left, right }: { ctx: SheetCtx; left?: ReactNode; right?: ReactNode }) {
  const { sheet, mutate, readOnly } = ctx;
  const { t } = useI18n();

  const fields: { key: keyof CharacterSheet['header']; label: string; placeholder?: string }[] = [
    { key: 'classAndLevel', label: t.header.classAndLevel, placeholder: t.header.classAndLevelPh },
    { key: 'background', label: t.header.background, placeholder: t.header.backgroundPh },
    { key: 'playerName', label: t.header.playerName },
    { key: 'speciesOrRace', label: t.header.species, placeholder: t.header.speciesPh },
    { key: 'alignment', label: t.header.alignment, placeholder: t.header.alignmentPh },
    { key: 'experiencePoints', label: t.header.experiencePoints },
  ];

  return (
    <header className="panel flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-3">
        {left}
        <div className="min-w-[200px] flex-1">
          <label htmlFor="character-name" className="field-label">
            {t.header.characterName}
          </label>
          <input
            id="character-name"
            className="w-full border-0 border-b border-transparent bg-transparent font-display text-2xl font-bold text-ink-100 transition-colors outline-none placeholder:text-ink-600 hover:border-ink-700 focus:border-gold-500"
            value={sheet.header.characterName}
            placeholder={t.common.unnamedHero}
            disabled={readOnly}
            onChange={(e) => mutate((d) => void (d.header.characterName = e.target.value))}
          />
        </div>
        <div className="flex flex-col items-end gap-1">
          {!readOnly && (
            <Toggle
              id="auto-calc-toggle"
              checked={sheet.autoCalculate}
              onChange={ctx.setAutoCalculate}
              label={sheet.autoCalculate ? t.header.autoCalculations : t.header.manualValues}
            />
          )}
          <span className="text-[10px] text-ink-400">
            {t.common.levelLabel(parseTotalLevel(sheet.header.classAndLevel))}
          </span>
        </div>
        {right}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`header-${f.key}`}>
            <TextInput
              id={`header-${f.key}`}
              value={sheet.header[f.key]}
              placeholder={f.placeholder}
              disabled={readOnly}
              onChange={(v) => mutate((d) => void (d.header[f.key] = v))}
            />
          </Field>
        ))}
      </div>
    </header>
  );
}
