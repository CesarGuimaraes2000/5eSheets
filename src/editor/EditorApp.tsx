import { useMemo, useState } from 'react';
import {
  Copy,
  Dices,
  Download,
  ExternalLink,
  FileJson,
  Pencil,
  Plus,
  Skull,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import type { CharacterSheet } from '../types/character';
import type { MonsterSheet } from '../types/monster';
import { useLocalMonsters } from '../hooks/useLocalMonsters';
import { useLocalSheets } from '../hooks/useLocalSheets';
import { LanguageSwitch, useI18n } from '../i18n/I18nContext';
import {
  createBlankMonster,
  downloadMonster,
  duplicateMonster,
  parseAnyJsonFile,
} from '../utils/monsterStorage';
import { createBlankCharacter, downloadSheet, duplicateSheet, pickJsonFile } from '../utils/storage';
import { SheetEditor } from '../components/SheetEditor';
import { MonsterDetail } from '../components/monster/MonsterDetail';
import { MonsterEditor } from '../components/monster/MonsterEditor';
import { useToast } from '../components/shared/Toast';
import { cx } from '../components/shared/ui';

/** Standalone site: create and edit character sheets & GM monsters stored in this browser. */
export function EditorApp() {
  const { sheets, upsert, remove } = useLocalSheets();
  const { monsters, upsert: upsertMonster, remove: removeMonster } = useLocalMonsters();
  const { lang, t } = useI18n();
  const toast = useToast();

  const [mode, setMode] = useState<'characters' | 'monsters'>('characters');
  const [monsterTab, setMonsterTab] = useState<'edit' | 'view'>('edit');

  const list = useMemo(
    () => Object.values(sheets).sort((a, b) => b.updatedAt - a.updatedAt),
    [sheets],
  );
  const monsterList = useMemo(
    () => Object.values(monsters).sort((a, b) => b.updatedAt - a.updatedAt),
    [monsters],
  );

  const [selectedId, setSelectedId] = useState<string | null>(() => list[0]?.id ?? null);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(
    () => monsterList[0]?.id ?? null,
  );

  const selected = selectedId ? sheets[selectedId] : undefined;
  const selectedMonster = selectedMonsterId ? monsters[selectedMonsterId] : undefined;

  const create = () => {
    if (mode === 'monsters') {
      const m = createBlankMonster();
      upsertMonster(m);
      setSelectedMonsterId(m.id);
      setMonsterTab('edit');
      return;
    }
    const sheet = createBlankCharacter();
    upsert(sheet);
    setSelectedId(sheet.id);
  };

  const importFile = async () => {
    const text = await pickJsonFile();
    if (!text) return;
    try {
      const imported = parseAnyJsonFile(text, lang);
      if (imported.kind === 'monster') {
        upsertMonster(imported.monster);
        setMode('monsters');
        setSelectedMonsterId(imported.monster.id);
        setMonsterTab('view');
        toast.show(
          t.monster.importedMonster(imported.monster.name || t.monster.unnamedMonster),
          'success',
        );
        return;
      }

      const sheet = imported.sheet;
      const exists = Boolean(sheets[sheet.id]);
      upsert(sheet);
      setMode('characters');
      setSelectedId(sheet.id);
      toast.show(exists ? t.editor.updatedFromFile : t.editor.imported, 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t.common.couldNotImport, 'error');
    }
  };

  const del = (sheet: CharacterSheet) => {
    const name = sheet.header.characterName || t.common.unnamed;
    if (!window.confirm(t.editor.confirmDelete(name))) return;
    remove(sheet.id);
    if (selectedId === sheet.id) setSelectedId(list.find((s) => s.id !== sheet.id)?.id ?? null);
  };

  const delMonster = (monster: MonsterSheet) => {
    const name = monster.name || t.monster.unnamedMonster;
    if (!window.confirm(t.monster.confirmDelete(name))) return;
    removeMonster(monster.id);
    if (selectedMonsterId === monster.id) {
      setSelectedMonsterId(monsterList.find((m) => m.id !== monster.id)?.id ?? null);
    }
  };

  const updateMonster = (recipe: (draft: MonsterSheet) => void) => {
    if (!selectedMonster) return;
    const draft = structuredClone(selectedMonster);
    recipe(draft);
    upsertMonster(draft);
  };

  const manifestUrl = `${window.location.origin}/manifest.json`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-ink-800 bg-ink-950/70 px-4 py-2.5 backdrop-blur">
        <img src="/icon.png" alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0">
          <h1 className="font-display text-sm font-bold tracking-wide text-ink-100">{t.editor.title}</h1>
          <p className="text-[11px] text-ink-400">{t.editor.subtitle}</p>
        </div>

        <div className="inline-flex rounded-lg border border-ink-800 bg-ink-900 p-0.5">
          <button
            type="button"
            onClick={() => setMode('characters')}
            className={cx(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
              mode === 'characters'
                ? 'bg-gold-500/20 text-gold-300'
                : 'text-ink-400 hover:text-ink-100',
            )}
          >
            <UserRound className="h-3.5 w-3.5" />
            {t.monster.sectionParty} ({list.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('monsters')}
            className={cx(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
              mode === 'monsters'
                ? 'bg-blood-700/35 text-blood-400'
                : 'text-ink-400 hover:text-ink-100',
            )}
          >
            <Skull className="h-3.5 w-3.5" />
            {t.monster.sectionMonsters} ({monsterList.length})
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitch />
          <button id="import-json" type="button" className="btn-ghost" onClick={() => void importFile()}>
            <Upload className="h-3.5 w-3.5" /> {t.common.importJson}
          </button>
          <button id="new-character" type="button" className="btn-primary" onClick={create}>
            <Plus className="h-3.5 w-3.5" />{' '}
            {mode === 'monsters' ? t.monster.newMonster : t.common.newCharacter}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r border-ink-800 bg-ink-950/40 p-3 md:flex">
          {mode === 'characters' ? (
            <>
              <h2 className="panel-title px-1">{t.editor.yourCharacters}</h2>
              {list.length === 0 && <p className="px-1 text-xs text-ink-400">{t.editor.noCharacters}</p>}
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
                      {s.header.characterName || t.common.unnamedHero}
                    </div>
                    <div className="truncate text-[11px] text-ink-400">
                      {[s.header.speciesOrRace, s.header.classAndLevel].filter(Boolean).join(' · ') ||
                        t.common.noneDash}
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <>
              <h2 className="panel-title px-1 text-blood-400!">{t.monster.sectionMonsters}</h2>
              {monsterList.length === 0 && (
                <p className="px-1 text-xs text-ink-400">{t.monster.emptyTitle}</p>
              )}
              {monsterList.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMonsterId(m.id)}
                  className={cx(
                    'group flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all',
                    m.id === selectedMonsterId
                      ? 'border-blood-500/70 bg-ink-850 shadow-[0_0_0_1px_rgb(217_68_82/0.2)]'
                      : 'border-transparent hover:border-ink-700 hover:bg-ink-900',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blood-500/40 bg-ink-800">
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Skull className="h-4 w-4 text-blood-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink-100">
                      {m.name || t.monster.unnamedMonster}
                    </div>
                    <div className="truncate text-[11px] text-ink-400">
                      {[m.creatureType, `${t.monster.crPrefix} ${m.challengeRating || '0'}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          <div className="mt-auto rounded-lg border border-ink-800 bg-ink-900/60 p-2.5 text-[11px] leading-relaxed text-ink-400">
            <p className="mb-1 font-semibold text-ink-300">{t.editor.obrExtension}</p>
            {t.editor.obrInstallHint}
            <code
              className="mt-1 block truncate rounded bg-ink-850 px-1.5 py-1 text-[10px] text-gold-300"
              title={manifestUrl}
            >
              {manifestUrl}
            </code>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto p-3 md:p-4">
          {/* Mobile selector */}
          {mode === 'characters' && list.length > 0 && (
            <select
              className="input mb-3 md:hidden"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.header.characterName || t.common.unnamedHero}
                </option>
              ))}
            </select>
          )}
          {mode === 'monsters' && monsterList.length > 0 && (
            <select
              className="input mb-3 md:hidden"
              value={selectedMonsterId ?? ''}
              onChange={(e) => setSelectedMonsterId(e.target.value)}
            >
              {monsterList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || t.monster.unnamedMonster}
                </option>
              ))}
            </select>
          )}

          {mode === 'monsters' ? (
            selectedMonster ? (
              <div className="mx-auto max-w-[1160px]">
                <div className="panel mb-3 flex flex-wrap items-center justify-between gap-2 p-2.5">
                  <div className="inline-flex rounded-lg border border-ink-800 bg-ink-900 p-0.5">
                    <button
                      type="button"
                      onClick={() => setMonsterTab('edit')}
                      className={cx(
                        'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                        monsterTab === 'edit'
                          ? 'bg-gold-500/20 text-gold-300'
                          : 'text-ink-400 hover:text-ink-100',
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5" /> {t.monster.editMonster}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonsterTab('view')}
                      className={cx(
                        'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                        monsterTab === 'view'
                          ? 'bg-blood-700/35 text-blood-400'
                          : 'text-ink-400 hover:text-ink-100',
                      )}
                    >
                      <Dices className="h-3.5 w-3.5" /> {t.monster.statblockView}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => downloadMonster(selectedMonster)}
                    >
                      <Download className="h-3.5 w-3.5" /> {t.common.exportJson}
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title={t.common.duplicate}
                      aria-label={t.common.duplicate}
                      onClick={() => {
                        const copy = duplicateMonster(selectedMonster, lang, monsterList, true);
                        upsertMonster(copy);
                        setSelectedMonsterId(copy.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hover:text-blood-400!"
                      title={t.common.delete}
                      aria-label={t.common.delete}
                      onClick={() => delMonster(selectedMonster)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {monsterTab === 'edit' ? (
                  <MonsterEditor monster={selectedMonster} onChange={upsertMonster} />
                ) : (
                  <MonsterDetail
                    monster={selectedMonster}
                    onUpdate={updateMonster}
                    onDuplicateInstance={() => {
                      const copy = duplicateMonster(selectedMonster, lang, monsterList, true);
                      upsertMonster(copy);
                      setSelectedMonsterId(copy.id);
                    }}
                    onEdit={() => setMonsterTab('edit')}
                    onExport={() => downloadMonster(selectedMonster)}
                    onDelete={() => delMonster(selectedMonster)}
                  />
                )}
                <p className="mt-3 text-center text-[11px] text-ink-600">{t.monster.privateNotice}</p>
              </div>
            ) : (
              <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-14 text-center">
                <Skull className="mb-4 h-14 w-14 text-blood-500/70" />
                <h2 className="font-display text-2xl font-bold text-ink-100">{t.monster.emptyTitle}</h2>
                <p className="mt-2 max-w-md text-sm text-ink-300">{t.monster.emptySubtitle}</p>
                <div className="mt-6 flex gap-2">
                  <button type="button" className="btn-primary px-4! py-2! text-sm!" onClick={create}>
                    <Plus className="h-4 w-4" /> {t.monster.newMonster}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-4! py-2! text-sm!"
                    onClick={() => void importFile()}
                  >
                    <Upload className="h-4 w-4" /> {t.common.importJson}
                  </button>
                </div>
              </div>
            )
          ) : selected ? (
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
                      title={t.editor.exportTitle}
                      onClick={() => downloadSheet(selected)}
                    >
                      <Download className="h-3.5 w-3.5" /> {t.common.exportJson}
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title={t.common.duplicate}
                      aria-label={t.common.duplicate}
                      onClick={() => {
                        const copy = duplicateSheet(selected, lang);
                        upsert(copy);
                        setSelectedId(copy.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hover:text-blood-400!"
                      title={t.common.delete}
                      aria-label={t.common.delete}
                      onClick={() => del(selected)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                }
              />
              <p className="mt-3 text-center text-[11px] text-ink-600">{t.editor.autoSaveNote}</p>
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
  const { t } = useI18n();
  const steps = [
    { icon: Plus, title: t.editor.step1Title, text: t.editor.step1Text },
    { icon: FileJson, title: t.editor.step2Title, text: t.editor.step2Text },
    { icon: ExternalLink, title: t.editor.step3Title, text: t.editor.step3Text },
  ];
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-12 text-center">
      <img
        src="/icon.png"
        alt=""
        className="mb-5 h-16 w-16 rounded-2xl object-contain drop-shadow-[0_0_24px_rgba(226,163,54,0.35)]"
      />
      <h2 className="font-display text-3xl font-bold text-ink-100">{t.editor.heroTitle}</h2>
      <p className="mt-2 max-w-lg text-sm text-ink-300">{t.editor.heroSubtitle}</p>
      <div className="mt-6 flex gap-2">
        <button type="button" className="btn-primary px-4! py-2! text-sm!" onClick={onCreate}>
          <Plus className="h-4 w-4" /> {t.common.newCharacter}
        </button>
        <button type="button" className="btn-ghost px-4! py-2! text-sm!" onClick={onImport}>
          <Upload className="h-4 w-4" /> {t.common.importJson}
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
        {t.editor.manifestUrlLabel} <code className="text-gold-300">{manifestUrl}</code>
      </p>
    </div>
  );
}
