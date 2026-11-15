import { useState, type ReactNode } from 'react';
import { ImageOff, UserRound } from 'lucide-react';
import type { SheetCtx } from '../sheetContext';
import type { CharacterSheet } from '../../types/character';
import { Field, Panel, TextArea, TextInput } from '../shared/ui';

/** Image preview that degrades gracefully when the URL is empty or broken. */
export function ImagePreview({
  url,
  alt,
  className,
  fallback,
}: {
  url: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const valid = /^https?:\/\//i.test(url.trim()) && failedUrl !== url;
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-lg border border-ink-700 bg-ink-850 ${className ?? ''}`}
    >
      {valid ? (
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(url)}
          referrerPolicy="no-referrer"
        />
      ) : (
        (fallback ?? (
          <div className="flex flex-col items-center gap-1 text-ink-600">
            {url ? <ImageOff className="h-8 w-8" /> : <UserRound className="h-8 w-8" />}
            <span className="text-[10px]">{url ? 'Image not available' : 'Paste an image URL'}</span>
          </div>
        ))
      )}
    </div>
  );
}

const PHYSICAL: { key: keyof CharacterSheet['details'] & ('age' | 'height' | 'weight' | 'eyes' | 'skin' | 'hair'); label: string }[] = [
  { key: 'age', label: 'Age' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'skin', label: 'Skin' },
  { key: 'hair', label: 'Hair' },
];

/** Page 2 of the sheet: appearance, allies, backstory and treasure. */
export function Page2Lore({ ctx }: { ctx: SheetCtx }) {
  const { sheet, mutate, readOnly } = ctx;
  const d = sheet.details;

  return (
    <div className="flex flex-col gap-3">
      <Panel bodyClassName="grid grid-cols-3 gap-2 p-3 sm:grid-cols-6">
        {PHYSICAL.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`detail-${f.key}`}>
            <TextInput
              id={`detail-${f.key}`}
              value={d[f.key]}
              disabled={readOnly}
              onChange={(v) => mutate((s) => void (s.details[f.key] = v))}
            />
          </Field>
        ))}
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="Character Appearance">
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <ImagePreview url={d.appearanceUrl} alt="Character portrait" className="aspect-[3/4] w-full" />
              <div className="flex min-w-0 flex-col gap-2">
                <Field label="Image URL (shown at the table)" htmlFor="appearance-url">
                  <TextInput
                    id="appearance-url"
                    value={d.appearanceUrl}
                    disabled={readOnly}
                    placeholder="https://..."
                    onChange={(v) => mutate((s) => void (s.details.appearanceUrl = v.trim()))}
                  />
                </Field>
                <TextArea
                  id="appearance-notes"
                  value={d.appearanceNotes}
                  disabled={readOnly}
                  rows={6}
                  placeholder="Describe how your character looks..."
                  onChange={(v) => mutate((s) => void (s.details.appearanceNotes = v))}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Allies & Organizations">
            <div className="grid grid-cols-[1fr_72px] gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Field label="Name" htmlFor="ally-name">
                  <TextInput
                    id="ally-name"
                    value={d.alliesAndOrganizations.name}
                    disabled={readOnly}
                    onChange={(v) => mutate((s) => void (s.details.alliesAndOrganizations.name = v))}
                  />
                </Field>
                <Field label="Symbol URL" htmlFor="ally-symbol">
                  <TextInput
                    id="ally-symbol"
                    value={d.alliesAndOrganizations.symbolUrl}
                    disabled={readOnly}
                    placeholder="https://..."
                    onChange={(v) => mutate((s) => void (s.details.alliesAndOrganizations.symbolUrl = v.trim()))}
                  />
                </Field>
              </div>
              <ImagePreview
                url={d.alliesAndOrganizations.symbolUrl}
                alt="Organization symbol"
                className="aspect-square w-full self-end"
                fallback={<span className="text-[10px] text-ink-600">Symbol</span>}
              />
            </div>
            <TextArea
              id="ally-description"
              className="mt-2"
              value={d.alliesAndOrganizations.description}
              disabled={readOnly}
              rows={7}
              placeholder="Allies, factions, contacts..."
              onChange={(v) => mutate((s) => void (s.details.alliesAndOrganizations.description = v))}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="Character Backstory">
            <TextArea
              id="backstory"
              value={d.backstory}
              disabled={readOnly}
              rows={10}
              onChange={(v) => mutate((s) => void (s.details.backstory = v))}
            />
          </Panel>
          <Panel title="Additional Features & Traits">
            <TextArea
              id="additional-features"
              value={d.additionalFeaturesAndTraits}
              disabled={readOnly}
              rows={6}
              onChange={(v) => mutate((s) => void (s.details.additionalFeaturesAndTraits = v))}
            />
          </Panel>
          <Panel title="Treasure">
            <TextArea
              id="treasure"
              value={d.treasure}
              disabled={readOnly}
              rows={5}
              onChange={(v) => mutate((s) => void (s.details.treasure = v))}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
