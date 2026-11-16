import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  CloudAlert,
  Crown,
  Download,
  ExternalLink,
  Link2,
  Plus,
  Skull,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { CharacterSheet } from '../types/character';
import type { MonsterSheet } from '../types/monster';
import type { CharacterSummary } from '../types/summary';
import type { PartyMember, PlayerInfo, RoomBackend } from '../obr/backend';
import { PLAYER_REQUEST_KEY, ROOM_METADATA_LIMIT } from '../constants/keys';
import { useLocalMonsters } from '../hooks/useLocalMonsters';
import { useLocalSheets } from '../hooks/useLocalSheets';
import { useRoomSummaries, type SaveState } from '../hooks/useRoomSummaries';
import { LanguageSwitch, useI18n } from '../i18n/I18nContext';
import {
  createBlankMonster,
  downloadMonster,
  duplicateMonster,
  parseAnyJsonFile,
} from '../utils/monsterStorage';
import { createBlankCharacter, downloadSheet, pickJsonFile } from '../utils/storage';
import {
  applySummaryToSheet,
  summaryDiffersFromSheet,
  toSummary,
} from '../utils/summary';
import { SheetEditor } from '../components/SheetEditor';
import { MonsterDetail } from '../components/monster/MonsterDetail';
import { MonsterEditor } from '../components/monster/MonsterEditor';
import { useToast } from '../components/shared/Toast';
import { cx } from '../components/shared/ui';
import { PartyCard } from './PartyCard';
import { MonsterCard } from './MonsterCard';
import { CharacterDetail } from './CharacterDetail';
import { StorageMeter } from './StorageMeter';

interface ContextMenuRequest {
  type: 'open' | 'link' | 'open-monster';
  characterId?: string;
  monsterId?: string;
  itemId?: string;
  ts: number;
}

function isContextMenuRequest(val: unknown): val is ContextMenuRequest {
  if (typeof val !== 'object' || val === null) return false;
  const v = val as Partial<ContextMenuRequest>;
  return (
    (v.type === 'open' || v.type === 'link' || v.type === 'open-monster') &&
    typeof v.ts === 'number'
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const { t } = useI18n();
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blood-400">
        <CloudAlert className="h-3.5 w-3.5" /> {t.table.storageFull}
      </span>
    );
  }
  if (state === 'saving' || state === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-gold-300">
        <Cloud className="h-3.5 w-3.5 animate-pulse" /> {t.table.syncing}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-life-400">
      <CheckCircle2 className="h-3.5 w-3.5" /> {t.table.savedInRoom}
    </span>
  );
}

/** Table mode UI (inside Owlbear Rodeo popover or `?obr=mock`). */
export function TableApp({ backend, player }: { backend: RoomBackend; player: PlayerInfo }) {
  const { summaries, loaded, roomBytes, saveState, saveSummary, removeSummary, projectedBytes } =
    useRoomSummaries(backend);
  const { sheets: localSheets, upsert: upsertLocal } = useLocalSheets();
  const { monsters, upsert: upsertMonster, remove: removeMonster } = useLocalMonsters();
  const { lang, t } = useI18n();
  const toast = useToast();

  const isGM = player.role === 'GM';

  const [party, setParty] = useState<PartyMember[]>([]);
  const [activeSection, setActiveSection] = useState<'party' | 'monsters'>('party');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
  const [viewFullSheet, setViewFullSheet] = useState(false);
  const [editingMonster, setEditingMonster] = useState(false);
  const [linkingTokenId, setLinkingTokenId] = useState<string | null>(null);

  const section: 'party' | 'monsters' = isGM ? activeSection : 'party';

  // Load party members (for GM owner assignment)
  useEffect(() => {
    let active = true;
    const syncParty = (members: PartyMember[]) => {
      if (!active) return;
      const all = [{ id: player.id, name: player.name }, ...members.filter((m) => m.id !== player.id)];
      setParty(all);
    };
    void backend.getParty().then(syncParty);
    const unsub = backend.onPartyChange(syncParty);
    return () => {
      active = false;
      unsub();
    };
  }, [backend, player.id, player.name]);

  // Listen for requests sent by the token context menu via player metadata
  useEffect(() => {
    const raw = player.metadata[PLAYER_REQUEST_KEY];
    if (!isContextMenuRequest(raw)) return;
    void backend.setPlayerMetadata({ [PLAYER_REQUEST_KEY]: undefined });
    if (raw.type === 'open' && raw.characterId) {
      setActiveSection('party');
      setSelectedId(raw.characterId);
      setViewFullSheet(false);
    } else if (raw.type === 'open-monster' && raw.monsterId && isGM) {
      setActiveSection('monsters');
      setSelectedMonsterId(raw.monsterId);
      setEditingMonster(false);
    } else if (raw.type === 'link' && raw.itemId) {
      setLinkingTokenId(raw.itemId);
    }
  }, [player.metadata, backend, isGM]);

  // Keep local full sheet synced when room live stats (HP, slots, etc.) change
  useEffect(() => {
    for (const s of Object.values(summaries)) {
      const local = localSheets[s.id];
      if (local && summaryDiffersFromSheet(local, s)) {
        upsertLocal(applySummaryToSheet(local, s));
      }
    }
  }, [summaries, localSheets, upsertLocal]);

  const list = useMemo(
    () =>
      Object.values(summaries).sort((a, b) => {
        const aMine = a.o === player.id ? 1 : 0;
        const bMine = b.o === player.id ? 1 : 0;
        if (aMine !== bMine) return bMine - aMine;
        return a.n.localeCompare(b.n);
      }),
    [summaries, player.id],
  );

  const monsterList = useMemo(
    () => Object.values(monsters).sort((a, b) => a.name.localeCompare(b.name)),
    [monsters],
  );

  // Select first character automatically once loaded
  useEffect(() => {
    if (!loaded) return;
    if (!selectedId || !summaries[selectedId]) {
      setSelectedId(list[0]?.id ?? null);
      setViewFullSheet(false);
    }
  }, [loaded, list, selectedId, summaries]);

  // Select first monster automatically if active monster is missing
  useEffect(() => {
    if (!selectedMonsterId || !monsters[selectedMonsterId]) {
      setSelectedMonsterId(monsterList[0]?.id ?? null);
      setEditingMonster(false);
    }
  }, [monsterList, selectedMonsterId, monsters]);

  const selectedSummary = selectedId ? summaries[selectedId] : undefined;
  const selectedLocalSheet = selectedId ? localSheets[selectedId] : undefined;
  const canEditSelected = Boolean(
    selectedSummary && (isGM || selectedSummary.o === player.id),
  );

  const selectedMonster = selectedMonsterId ? monsters[selectedMonsterId] : undefined;

  const publishSheet = (sheet: CharacterSheet, successMsg?: string) => {
    const withOwner: CharacterSheet = {
      ...sheet,
      ownerId: sheet.ownerId || player.id,
      ownerName: sheet.ownerName || player.name,
      updatedAt: Date.now(),
    };
    const summary = toSummary(withOwner);
    if (projectedBytes(summary) > ROOM_METADATA_LIMIT) {
      toast.show(t.table.roomFullError, 'error');
      return;
    }
    upsertLocal(withOwner);
    saveSummary(summary);
    setActiveSection('party');
    setSelectedId(withOwner.id);
    setViewFullSheet(false);
    if (successMsg) toast.show(successMsg, 'success');
  };

  const handleImportJson = async () => {
    const text = await pickJsonFile();
    if (!text) return;
    try {
      const imported = parseAnyJsonFile(text, lang);
      if (imported.kind === 'monster') {
        if (!isGM) {
          toast.show(t.monster.gmOnlyImportError, 'error');
          return;
        }
        upsertMonster(imported.monster);
        setActiveSection('monsters');
        setSelectedMonsterId(imported.monster.id);
        setEditingMonster(false);
        toast.show(
          t.monster.importedMonster(imported.monster.name || t.monster.unnamedMonster),
          'success',
        );
        return;
      }

      const sheet = imported.sheet;
      sheet.ownerId = player.id;
      sheet.ownerName = player.name;
      publishSheet(sheet, t.table.importedToTable(sheet.header.characterName || t.common.unnamed));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t.common.couldNotImport, 'error');
    }
  };

  const handleCreateQuick = () => {
    if (section === 'monsters' && isGM) {
      const monster = createBlankMonster();
      upsertMonster(monster);
      setSelectedMonsterId(monster.id);
      setEditingMonster(true);
      toast.show(t.monster.createdMonster, 'success');
      return;
    }

    const sheet = createBlankCharacter(player.id, player.name);
    sheet.header.characterName = t.table.heroNameDefault(player.name);
    publishSheet(sheet, t.table.created);
    setViewFullSheet(true);
  };

  const handleUpdateSummary = (recipe: (draft: CharacterSummary) => void) => {
    if (!selectedSummary || !canEditSelected) return;
    const draft = structuredClone(selectedSummary);
    recipe(draft);
    draft.u = Date.now();
    saveSummary(draft);
  };

  const handleUpdateMonster = (recipe: (draft: MonsterSheet) => void) => {
    if (!selectedMonster || !isGM) return;
    const draft = structuredClone(selectedMonster);
    recipe(draft);
    upsertMonster(draft);
  };

  const handleDuplicateMonsterInstance = () => {
    if (!selectedMonster || !isGM) return;
    const copy = duplicateMonster(selectedMonster, lang, monsterList, true);
    upsertMonster(copy);
    setSelectedMonsterId(copy.id);
  };

  const handleDeleteMonster = () => {
    if (!selectedMonster || !isGM) return;
    const name = selectedMonster.name || t.monster.unnamedMonster;
    if (!window.confirm(t.monster.confirmDelete(name))) return;
    removeMonster(selectedMonster.id);
    toast.show(t.monster.deletedMonster(name), 'info');
  };

  const handleFullSheetChange = (updated: CharacterSheet) => {
    upsertLocal(updated);
    if (canEditSelected) {
      saveSummary(toSummary(updated));
    }
  };

  const handleExportSelected = () => {
    if (!selectedSummary) return;
    const base = selectedLocalSheet ?? createBlankCharacter(selectedSummary.o, selectedSummary.on);
    const merged = applySummaryToSheet(base, selectedSummary);
    downloadSheet(merged);
  };

  const handleRemoveSelected = async () => {
    if (!selectedSummary || !canEditSelected) return;
    if (!window.confirm(t.table.confirmRemove(selectedSummary.n))) return;
    await removeSummary(selectedSummary.id);
    toast.show(t.table.removedFromRoom(selectedSummary.n), 'info');
  };

  const handleLinkToken = async (characterId: string) => {
    if (!linkingTokenId) return;
    await backend.linkToken(linkingTokenId, characterId);
    const charName = summaries[characterId]?.n ?? t.table.fallbackCharName;
    backend.notify(t.table.tokenLinked(charName), 'SUCCESS');
    setLinkingTokenId(null);
    setSelectedId(characterId);
  };

  const handleLinkMonsterToken = async (monsterId: string) => {
    if (!linkingTokenId || !isGM) return;
    await backend.linkMonsterToken(linkingTokenId, monsterId);
    const name = monsters[monsterId]?.name || t.monster.fallbackMonsterName;
    backend.notify(t.monster.tokenLinked(name), 'SUCCESS');
    setLinkingTokenId(null);
    setSelectedMonsterId(monsterId);
  };

  // Full 3-page character sheet view inside the popover
  if (section === 'party' && viewFullSheet && selectedSummary && selectedLocalSheet) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-800 bg-ink-950/90 px-3 py-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setViewFullSheet(false)}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t.table.backToTable}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <SaveBadge state={saveState} />
            <StorageMeter bytes={roomBytes} />
            <LanguageSwitch />
            <button
              type="button"
              className="btn-primary"
              onClick={handleExportSelected}
              title={t.table.exportUpdatedTitle}
            >
              <Download className="h-3.5 w-3.5" /> {t.common.exportJson}
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <SheetEditor
            sheet={selectedLocalSheet}
            onChange={handleFullSheetChange}
            readOnly={!canEditSelected}
          />
        </div>
        {toast.node}
      </div>
    );
  }

  // GM Monster editor view inside the popover
  if (section === 'monsters' && isGM && editingMonster && selectedMonster) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-800 bg-ink-950/90 px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setEditingMonster(false)}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t.monster.backToStatblock}
            </button>
            <span className="chip border-blood-500/50 bg-blood-700/25 text-[10px]! text-blood-400">
              <Skull className="h-3 w-3" /> {t.monster.gmOnlyBadge}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitch />
            <button
              type="button"
              className="btn-primary"
              onClick={() => downloadMonster(selectedMonster)}
            >
              <Download className="h-3.5 w-3.5" /> {t.common.exportJson}
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <MonsterEditor monster={selectedMonster} onChange={upsertMonster} />
        </div>
        {toast.node}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-ink-800 bg-ink-950/90 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="" className="h-7 w-7 shrink-0 rounded-lg object-contain" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-xs font-bold tracking-wider text-ink-100 uppercase">
                {t.table.partyTitle}
              </h1>
              {isGM && (
                <span className="chip border-gold-500/50 bg-gold-500/15 px-1.5! py-0! text-[9px]! text-gold-300">
                  <Crown className="h-2.5 w-2.5" /> {t.table.gmBadge}
                </span>
              )}
            </div>
            <p className="text-[10px] text-ink-400">{player.name}</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SaveBadge state={saveState} />
          <StorageMeter bytes={roomBytes} />
          <LanguageSwitch />
          <a
            href={window.location.origin}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            title={t.table.sheetCreatorTitle}
          >
            <ExternalLink className="h-3.5 w-3.5" /> {t.table.sheetCreator}
          </a>
          <button
            id="table-import-json"
            type="button"
            className="btn-primary"
            onClick={() => void handleImportJson()}
          >
            <Upload className="h-3.5 w-3.5" /> {t.common.importJson}
          </button>
          <button
            id="table-new-char"
            type="button"
            className="btn-ghost"
            onClick={handleCreateQuick}
            title={section === 'monsters' ? t.monster.newMonster : t.table.createQuickTitle}
          >
            <Plus className="h-3.5 w-3.5" />{' '}
            {section === 'monsters' ? t.monster.newMonsterShort : t.common.newShort}
          </button>
        </div>
      </header>

      {/* GM-only section switcher: Party vs Enemies (completely hidden from players) */}
      {isGM && (
        <div className="flex items-center justify-between gap-2 border-b border-ink-800 bg-ink-950/75 px-3 py-1.5">
          <div className="inline-flex rounded-lg border border-ink-800 bg-ink-900 p-0.5">
            <button
              type="button"
              onClick={() => setActiveSection('party')}
              className={cx(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                section === 'party'
                  ? 'bg-gold-500/20 text-gold-300'
                  : 'text-ink-400 hover:text-ink-100',
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {t.table.partyCount(list.length)}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('monsters')}
              className={cx(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                section === 'monsters'
                  ? 'bg-blood-700/35 text-blood-400'
                  : 'text-ink-400 hover:text-ink-100',
              )}
            >
              <Skull className="h-3.5 w-3.5" />
              {t.monster.monstersCount(monsterList.length)}
            </button>
          </div>
          {section === 'monsters' && (
            <span className="hidden text-[11px] text-ink-400 sm:inline">
              {t.monster.privateNotice}
            </span>
          )}
        </div>
      )}

      {/* Token linking banner */}
      {linkingTokenId && (
        <div className="flex items-center justify-between gap-2 border-b border-gold-500/40 bg-gold-500/15 px-3 py-1.5 text-xs text-gold-300">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Link2 className="h-3.5 w-3.5" /> {t.table.linkingBanner}
          </span>
          <button
            type="button"
            className="btn-icon text-gold-300!"
            onClick={() => setLinkingTokenId(null)}
            aria-label={t.table.cancelLink}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Body */}
      {section === 'monsters' && isGM ? (
        monsterList.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <Skull className="mb-3 h-10 w-10 text-blood-500/60" />
            <h2 className="font-display text-lg font-bold text-ink-100">{t.monster.emptyTitle}</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-400">
              {t.monster.emptySubtitle}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-primary" onClick={() => void handleImportJson()}>
                <Upload className="h-3.5 w-3.5" /> {t.common.importJson}
              </button>
              <button type="button" className="btn-ghost" onClick={handleCreateQuick}>
                <Plus className="h-3.5 w-3.5" /> {t.monster.newMonster}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr]">
            <aside className="flex flex-col gap-2 overflow-y-auto border-b border-ink-800 bg-ink-950/40 p-2.5 md:border-r md:border-b-0">
              <div className="flex items-center justify-between px-1">
                <span className="panel-title text-blood-400!">
                  {t.monster.monstersCount(monsterList.length)}
                </span>
              </div>
              {monsterList.map((m) => (
                <MonsterCard
                  key={m.id}
                  monster={m}
                  selected={m.id === selectedMonsterId}
                  onSelect={() => setSelectedMonsterId(m.id)}
                  linkMode={Boolean(linkingTokenId)}
                  onLink={() => void handleLinkMonsterToken(m.id)}
                />
              ))}
            </aside>
            <main className="min-w-0 overflow-y-auto p-3">
              {selectedMonster && (
                <MonsterDetail
                  monster={selectedMonster}
                  onUpdate={handleUpdateMonster}
                  onDuplicateInstance={handleDuplicateMonsterInstance}
                  onEdit={() => setEditingMonster(true)}
                  onExport={() => downloadMonster(selectedMonster)}
                  onDelete={handleDeleteMonster}
                />
              )}
            </main>
          </div>
        )
      ) : list.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Users className="mb-3 h-10 w-10 text-ink-600" />
          <h2 className="font-display text-lg font-bold text-ink-100">{t.table.emptyTitle}</h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-400">
            {t.table.emptyBeforeCreator}
            <b className="text-ink-300">{t.table.emptyCreatorBold}</b>
            {t.table.emptyMid}
            <b className="text-gold-300">{t.table.emptyImportBold}</b>
            {t.table.emptyAfterImport}
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-primary" onClick={() => void handleImportJson()}>
              <Upload className="h-3.5 w-3.5" /> {t.common.importJson}
            </button>
            <a
              href={window.location.origin}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {t.table.openSheetCreator}
            </a>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Party sidebar */}
          <aside className="flex flex-col gap-2 overflow-y-auto border-b border-ink-800 bg-ink-950/40 p-2.5 md:border-r md:border-b-0">
            <div className="flex items-center justify-between px-1">
              <span className="panel-title">{t.table.partyCount(list.length)}</span>
            </div>
            {list.map((s) => (
              <PartyCard
                key={s.id}
                summary={s}
                selected={s.id === selectedId}
                mine={s.o === player.id}
                onSelect={() => setSelectedId(s.id)}
                linkMode={Boolean(linkingTokenId)}
                onLink={() => void handleLinkToken(s.id)}
              />
            ))}
          </aside>

          {/* Selected character detail */}
          <main className="min-w-0 overflow-y-auto p-3">
            {selectedSummary && (
              <CharacterDetail
                summary={selectedSummary}
                canEdit={canEditSelected}
                isGM={isGM}
                hasLocalSheet={Boolean(selectedLocalSheet)}
                party={party}
                onUpdate={handleUpdateSummary}
                onOpenSheet={() => setViewFullSheet(true)}
                onExport={handleExportSelected}
                onRemove={() => void handleRemoveSelected()}
                onAssignOwner={(member) =>
                  handleUpdateSummary((d) => {
                    d.o = member.id;
                    d.on = member.name;
                  })
                }
              />
            )}
          </main>
        </div>
      )}

      {toast.node}
    </div>
  );
}
