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
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { CharacterSheet } from '../types/character';
import type { CharacterSummary } from '../types/summary';
import type { PartyMember, PlayerInfo, RoomBackend } from '../obr/backend';
import { PLAYER_REQUEST_KEY, ROOM_METADATA_LIMIT } from '../constants/keys';
import { useLocalSheets } from '../hooks/useLocalSheets';
import { useRoomSummaries, type SaveState } from '../hooks/useRoomSummaries';
import { LanguageSwitch, useI18n } from '../i18n/I18nContext';
import {
  createBlankCharacter,
  downloadSheet,
  parseSheetFile,
  pickJsonFile,
} from '../utils/storage';
import {
  applySummaryToSheet,
  summaryDiffersFromSheet,
  toSummary,
} from '../utils/summary';
import { SheetEditor } from '../components/SheetEditor';
import { useToast } from '../components/shared/Toast';
import { PartyCard } from './PartyCard';
import { CharacterDetail } from './CharacterDetail';
import { StorageMeter } from './StorageMeter';

interface ContextMenuRequest {
  type: 'open' | 'link';
  characterId?: string;
  itemId?: string;
  ts: number;
}

function isContextMenuRequest(val: unknown): val is ContextMenuRequest {
  if (typeof val !== 'object' || val === null) return false;
  const v = val as Partial<ContextMenuRequest>;
  return (v.type === 'open' || v.type === 'link') && typeof v.ts === 'number';
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
  const { lang, t } = useI18n();
  const toast = useToast();

  const [party, setParty] = useState<PartyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewFullSheet, setViewFullSheet] = useState(false);
  const [linkingTokenId, setLinkingTokenId] = useState<string | null>(null);

  const isGM = player.role === 'GM';

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
      setSelectedId(raw.characterId);
      setViewFullSheet(false);
    } else if (raw.type === 'link' && raw.itemId) {
      setLinkingTokenId(raw.itemId);
    }
  }, [player.metadata, backend]);

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

  // Select first character automatically once loaded
  useEffect(() => {
    if (!loaded) return;
    if (!selectedId || !summaries[selectedId]) {
      setSelectedId(list[0]?.id ?? null);
      setViewFullSheet(false);
    }
  }, [loaded, list, selectedId, summaries]);

  const selectedSummary = selectedId ? summaries[selectedId] : undefined;
  const selectedLocalSheet = selectedId ? localSheets[selectedId] : undefined;
  const canEditSelected = Boolean(
    selectedSummary && (isGM || selectedSummary.o === player.id),
  );

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
    setSelectedId(withOwner.id);
    if (successMsg) toast.show(successMsg, 'success');
  };

  const handleImportJson = async () => {
    const text = await pickJsonFile();
    if (!text) return;
    try {
      const sheet = parseSheetFile(text, lang);
      sheet.ownerId = player.id;
      sheet.ownerName = player.name;
      publishSheet(sheet, t.table.importedToTable(sheet.header.characterName || t.common.unnamed));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t.common.couldNotImport, 'error');
    }
  };

  const handleCreateQuick = () => {
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

  // Full 3-page sheet view inside the popover (for locally stored characters)
  if (viewFullSheet && selectedSummary && selectedLocalSheet) {
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
            title={t.table.createQuickTitle}
          >
            <Plus className="h-3.5 w-3.5" /> {t.common.newShort}
          </button>
        </div>
      </header>

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
      {list.length === 0 ? (
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
