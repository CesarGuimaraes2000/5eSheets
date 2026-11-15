import { useMemo, useState } from 'react';
import {
  Copy,
  Dices,
  Download,
  ExternalLink,
  FileJson,
  Plus,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import type { CharacterSheet } from '../types/character';
import { useLocalSheets } from '../hooks/useLocalSheets';
import {
  createBlankCharacter,
  downloadSheet,
  duplicateSheet,
  parseSheetFile,
  pickJsonFile,
} from '../utils/storage';
import { SheetEditor } from '../components/SheetEditor';
import { useToast } from '../components/shared/Toast';
import { cx } from '../components/shared/ui';

/** Standalone site: create and edit full character sheets stored in this browser. */
export function EditorApp() {
  const { sheets, upsert, remove } = useLocalSheets();
  const toast = useToast();
  const list = useMemo(
    () => Object.values(sheets).sort((a, b) => b.updatedAt - a.updatedAt),
    [sheets],
  );
  const [selectedId, setSelectedId] = useState<string | null>(() => list[0]?.id ?? null);
  const selected = selectedId ? sheets[selectedId] : undefined;

  const create = () => {
    const sheet = createBlankCharacter();
    upsert(sheet);
    setSelectedId(sheet.id);
  };

  const importFile = async () => {
    const text = await pickJsonFile();
    if (!text) return;
    try {
      const sheet = parseSheetFile(text);
      const exists = Boolean(sheets[sheet.id]);
      upsert(sheet);
      setSelectedId(sheet.id);
      toast.show(exists ? 'Character updated from file.' : 'Character imported.', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not import file.', 'error');
    }
  };

  const del = (sheet: CharacterSheet) => {
    if (!window.confirm(`Delete "${sheet.header.characterName || 'Unnamed'}" from this browser?`)) return;
    remove(sheet.id);
    if (selectedId === sheet.id) setSelectedId(list.find((s) => s.id !== sheet.id)?.id ?? null);
  };

  const manifestUrl = `${window.location.origin}/manifest.json`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-ink-800 bg-ink-950/70 px-4 py-2.5 backdrop-blur">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-[0_0_20px_-4px_rgb(226_163_54/0.7)]">
          <Dices className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-sm font-bold tracking-wide text-ink-100">D&amp;D 5.5 Character Sheets</h1>
          <p className="text-[11px] text-ink-400">Full sheet editor · export JSON · import it at your Owlbear Rodeo table</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button id="import-json" type="button" className="btn-ghost" onClick={() => void importFile()}>
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
          <button id="new-character" type="button" className="btn-primary" onClick={create}>
            <Plus className="h-3.5 w-3.5" /> New Character
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r border-ink-800 bg-ink-950/40 p-3 md:flex">
          <h2 className="panel-title px-1">Your Characters</h2>
          {list.length === 0 && <p className="px-1 text-xs text-ink-400">No characters yet.</p>}
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={cx(
                'group flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all',
                s.id === selectedId
                  ? 'border-gold-500/60 bg-ink-850 shadow-[0_0_0_1px_rgb(226_163_54/0.15)]'
                  : 'border-transparent hover:border-ink-700 hover:bg-ink-900',
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink-700 bg-ink-800">
                {s.details.appearanceUrl ? (
                  <img src={s.details.appearanceUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-4 w-4 text-ink-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-100">
                  {s.header.characterName || 'Unnamed Hero'}
                </div>
                <div className="truncate text-[11px] text-ink-400">
                  {[s.header.speciesOrRace, s.header.classAndLevel].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            </button>
          ))}

          <div className="mt-auto rounded-lg border border-ink-800 bg-ink-900/60 p-2.5 text-[11px] leading-relaxed text-ink-400">
            <p className="mb-1 font-semibold text-ink-300">Owlbear Rodeo extension</p>
            Add this URL in OBR → Extensions → Add:
            <code className="mt-1 block truncate rounded bg-ink-850 px-1.5 py-1 text-[10px] text-gold-300" title={manifestUrl}>
              {manifestUrl}
            </code>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto p-3 md:p-4">
          {/* Mobile selector */}
          {list.length > 0 && (
            <select
              className="input mb-3 md:hidden"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.header.characterName || 'Unnamed Hero'}
                </option>
              ))}
            </select>
          )}

          {selected ? (
            <div className="mx-auto max-w-[1280px]">
              <SheetEditor
                sheet={selected}
                onChange={upsert}
                headerRight={
                  <div className="flex items-center gap-1.5">
                    <button
                      id="export-json"
                      type="button"
                      className="btn-primary"
                      title="Download this character as JSON (import it in Owlbear Rodeo)"
                      onClick={() => downloadSheet(selected)}
                    >
                      <Download className="h-3.5 w-3.5" /> Export JSON
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Duplicate"
                      aria-label="Duplicate character"
                      onClick={() => {
                        const copy = duplicateSheet(selected);
                        upsert(copy);
                        setSelectedId(copy.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hover:text-blood-400!"
                      title="Delete"
                      aria-label="Delete character"
                      onClick={() => del(selected)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                }
              />
              <p className="mt-3 text-center text-[11px] text-ink-600">
                Saved automatically in this browser · Export a JSON file to back it up or to use it in Owlbear Rodeo.
              </p>
            </div>
          ) : (
            <EmptyState onCreate={create} onImport={() => void importFile()} manifestUrl={manifestUrl} />
          )}
        </main>
      </div>
      {toast.node}
    </div>
  );
}

function EmptyState({
  onCreate,
  onImport,
  manifestUrl,
}: {
  onCreate: () => void;
  onImport: () => void;
  manifestUrl: string;
}) {
  const steps = [
    { icon: Plus, title: 'Create', text: 'Fill in the full 3-page D&D 5.5 sheet. Saved in your browser.' },
    { icon: FileJson, title: 'Export', text: 'Download your character as a JSON file.' },
    { icon: ExternalLink, title: 'Play', text: 'Import it in the Owlbear Rodeo extension. Only the essentials are shared with the table.' },
  ];
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-[0_0_40px_-6px_rgb(226_163_54/0.7)]">
        <Dices className="h-8 w-8" />
      </div>
      <h2 className="font-display text-3xl font-bold text-ink-100">Forge your next hero</h2>
      <p className="mt-2 max-w-lg text-sm text-ink-300">
        Complete character sheets for D&amp;D 5.5 (2024) with automatic calculations you can override anytime.
      </p>
      <div className="mt-6 flex gap-2">
        <button type="button" className="btn-primary px-4! py-2! text-sm!" onClick={onCreate}>
          <Plus className="h-4 w-4" /> New Character
        </button>
        <button type="button" className="btn-ghost px-4! py-2! text-sm!" onClick={onImport}>
          <Upload className="h-4 w-4" /> Import JSON
        </button>
      </div>
      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="panel p-4 text-left">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-500/60 font-display text-[11px] text-gold-300">
                {i + 1}
              </span>
              <s.icon className="h-4 w-4 text-gold-400" />
              <span className="font-semibold text-ink-100">{s.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-ink-400">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[11px] text-ink-400">
        Owlbear Rodeo manifest URL: <code className="text-gold-300">{manifestUrl}</code>
      </p>
    </div>
  );
}
