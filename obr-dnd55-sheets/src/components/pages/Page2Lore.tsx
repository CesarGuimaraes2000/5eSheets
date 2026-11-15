import { useState, type ReactNode } from 'react';
import { ImageOff, UserRound } from 'lucide-react';
import type { SheetCtx } from '../sheetContext';
import type { CharacterSheet } from '../../types/character';
import { useI18n } from '../../i18n/I18nContext';
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
  const { t } = useI18n();
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
          <div className="flex flex-col items-center gap-1 px-1 text-center text-ink-600">
            {url ? <ImageOff className="h-8 w-8" /> : <UserRound className="h-8 w-8" />}
            <span className="text-[10px]">
              {url ? t.page2.imageUnavailable : t.page2.pasteImageUrl}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

type PhysicalKey = keyof CharacterSheet['details'] &
  ('age' | 'height' | 'weight' | 'eyes' | 'skin' | 'hair');

const PHYSICAL_KEYS: PhysicalKey[] = ['age', 'height', 'weight', 'eyes', 'skin', 'hair'];

/** Page 2 of the sheet: appearance, allies, backstory and treasure. */
export function Page2Lore({ ctx }: { ctx: SheetCtx }) {
  const { sheet, mutate, readOnly } = ctx;
  const { t } = useI18n();
  const d = sheet.details;

  return (
    <div className="flex flex-col gap-3">
      <Panel bodyClassName="grid grid-cols-3 gap-2 p-3 sm:grid-cols-6">
        {PHYSICAL_KEYS.map((key) => (
          <Field key={key} label={t.page2[key]} htmlFor={`detail-${key}`}>
            <TextInput
              id={`detail-${key}`}
              value={d[key]}
              disabled={readOnly}
              onChange={(v) => mutate((s) => void (s.details[key] = v))}
            />
          </Field>
        ))}
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title={t.page2.appearance}>
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <ImagePreview
                url={d.appearanceUrl}
                alt={t.page2.characterPortrait}
                className="aspect-[3/4] w-full"
              />
              <div className="flex min-w-0 flex-col gap-2">
                <Field label={t.page2.imageUrlTable} htmlFor="appearance-url">
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
                  placeholder={t.page2.appearancePh}
                  onChange={(v) => mutate((s) => void (s.details.appearanceNotes = v))}
                />
              </div>
            </div>
          </Panel>

          <Panel title={t.page2.alliesAndOrgs}>
            <div className="grid grid-cols-[1fr_72px] gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Field label={t.page2.orgName} htmlFor="ally-name">
                  <TextInput
                    id="ally-name"
                    value={d.alliesAndOrganizations.name}
                    disabled={readOnly}
                    onChange={(v) => mutate((s) => void (s.details.alliesAndOrganizations.name = v))}
                  />
                </Field>
                <Field label={t.page2.symbolUrl} htmlFor="ally-symbol">
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
                alt={t.page2.orgSymbol}
                className="aspect-square w-full self-end"
                fallback={<span className="text-[10px] text-ink-600">{t.page2.symbol}</span>}
              />
            </div>
            <TextArea
              id="ally-description"
              className="mt-2"
              value={d.alliesAndOrganizations.description}
              disabled={readOnly}
              rows={7}
              placeholder={t.page2.alliesPh}
              onChange={(v) => mutate((s) => void (s.details.alliesAndOrganizations.description = v))}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <Panel title={t.page2.backstory}>
            <TextArea
              id="backstory"
              value={d.backstory}
              disabled={readOnly}
              rows={10}
              onChange={(v) => mutate((s) => void (s.details.backstory = v))}
            />
          </Panel>
          <Panel title={t.page2.additionalFeatures}>
            <TextArea
              id="additional-features"
              value={d.additionalFeaturesAndTraits}
              disabled={readOnly}
              rows={6}
              onChange={(v) => mutate((s) => void (s.details.additionalFeaturesAndTraits = v))}
            />
          </Panel>
          <Panel title={t.page2.treasure}>
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
