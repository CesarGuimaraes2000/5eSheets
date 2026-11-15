import type { ReactNode } from 'react';
import type { SheetCtx } from '../sheetContext';
import type { CharacterSheet } from '../../types/character';
import { parseTotalLevel } from '../../utils/calculations';
import { Field, TextInput, Toggle } from '../shared/ui';

const FIELDS: { key: keyof CharacterSheet['header']; label: string; placeholder?: string }[] = [
  { key: 'classAndLevel', label: 'Class & Level', placeholder: 'Fighter 5' },
  { key: 'background', label: 'Background', placeholder: 'Soldier' },
  { key: 'playerName', label: 'Player Name' },
  { key: 'speciesOrRace', label: 'Species', placeholder: 'Human' },
  { key: 'alignment', label: 'Alignment', placeholder: 'Neutral Good' },
  { key: 'experiencePoints', label: 'Experience Points' },
];

/** Persistent sheet header: name, the 6 header fields of the PDF, auto-calc toggle and actions. */
export function SheetHeader({ ctx, left, right }: { ctx: SheetCtx; left?: ReactNode; right?: ReactNode }) {
  const { sheet, mutate, readOnly } = ctx;
  return (
    <header className="panel flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-3">
        {left}
        <div className="min-w-[200px] flex-1">
          <label htmlFor="character-name" className="field-label">
            Character Name
          </label>
          <input
            id="character-name"
            className="w-full border-0 border-b border-transparent bg-transparent font-display text-2xl font-bold text-ink-100 transition-colors outline-none placeholder:text-ink-600 hover:border-ink-700 focus:border-gold-500"
            value={sheet.header.characterName}
            placeholder="Unnamed Hero"
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
              label={sheet.autoCalculate ? 'Auto calculations' : 'Manual values'}
            />
          )}
          <span className="text-[10px] text-ink-400">
            Level {parseTotalLevel(sheet.header.classAndLevel)}
          </span>
        </div>
        {right}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {FIELDS.map((f) => (
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
