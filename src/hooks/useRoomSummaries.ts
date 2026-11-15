import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterSummary } from '../types/summary';
import type { Metadata, RoomBackend } from '../obr/backend';
import { ROOM_METADATA_LIMIT, SUMMARY_PREFIX } from '../constants/keys';
import { byteSize, isCharacterSummary } from '../utils/summary';

const DEBOUNCE_MS = 400;

function extractSummaries(metadata: Metadata): Record<string, CharacterSummary> {
  const out: Record<string, CharacterSummary> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (key.startsWith(SUMMARY_PREFIX) && isCharacterSummary(value)) out[value.id] = value;
  }
  return out;
}

export type SaveState = 'idle' | 'pending' | 'saving' | 'error';

/**
 * Character summaries stored in room metadata, one key per character.
 * Writes are debounced (400 ms) per character and only send that character's key,
 * so edits on different characters never overwrite each other.
 */
export function useRoomSummaries(backend: RoomBackend) {
  const [summaries, setSummaries] = useState<Record<string, CharacterSummary>>({});
  const [roomBytes, setRoomBytes] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [loaded, setLoaded] = useState(false);

  const metadataRef = useRef<Metadata>({});
  const pending = useRef(new Map<string, CharacterSummary>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  /** Remote state + local edits that were not flushed yet. */
  const applyRemote = useCallback((metadata: Metadata) => {
    metadataRef.current = metadata;
    setRoomBytes(byteSize(metadata));
    const remote = extractSummaries(metadata);
    for (const [id, local] of pending.current) remote[id] = local;
    setSummaries(remote);
  }, []);

  useEffect(() => {
    let active = true;
    void backend.getRoomMetadata().then((m) => {
      if (!active) return;
      applyRemote(m);
      setLoaded(true);
    });
    const unsubscribe = backend.onRoomMetadataChange(applyRemote);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [backend, applyRemote]);

  // Send pending writes right away when the UI unmounts / the popover closes.
  useEffect(() => {
    const timersMap = timers.current;
    const pendingMap = pending.current;
    const flushAll = () => {
      timersMap.forEach((t) => clearTimeout(t));
      timersMap.clear();
      if (pendingMap.size === 0) return;
      const update: Metadata = {};
      pendingMap.forEach((s, id) => (update[SUMMARY_PREFIX + id] = s));
      pendingMap.clear();
      void backend.setRoomMetadata(update);
    };
    window.addEventListener('pagehide', flushAll);
    return () => {
      window.removeEventListener('pagehide', flushAll);
      flushAll();
    };
  }, [backend]);

  /** Bytes the room would use if `summary` replaced the current value for its key. */
  const projectedBytes = useCallback((summary: CharacterSummary) => {
    return byteSize({ ...metadataRef.current, [SUMMARY_PREFIX + summary.id]: summary });
  }, []);

  const flush = useCallback(
    async (id: string) => {
      const summary = pending.current.get(id);
      if (!summary) return;
      if (projectedBytes(summary) > ROOM_METADATA_LIMIT) {
        pending.current.delete(id);
        setSaveState('error');
        backend.notify(
          'Room storage is full (16 kB). Remove a character from the room to save changes.',
          'ERROR',
        );
        applyRemote(metadataRef.current);
        return;
      }
      setSaveState('saving');
      try {
        await backend.setRoomMetadata({ [SUMMARY_PREFIX + id]: summary });
        if (pending.current.get(id) === summary) pending.current.delete(id);
        setSaveState(pending.current.size ? 'pending' : 'idle');
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    },
    [backend, projectedBytes, applyRemote],
  );

  /** Optimistically updates a summary and schedules a debounced room write. */
  const saveSummary = useCallback(
    (summary: CharacterSummary) => {
      pending.current.set(summary.id, summary);
      setSummaries((prev) => ({ ...prev, [summary.id]: summary }));
      setSaveState('pending');
      const existing = timers.current.get(summary.id);
      if (existing) clearTimeout(existing);
      timers.current.set(
        summary.id,
        setTimeout(() => {
          timers.current.delete(summary.id);
          void flush(summary.id);
        }, DEBOUNCE_MS),
      );
    },
    [flush],
  );

  const removeSummary = useCallback(
    async (id: string) => {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      timers.current.delete(id);
      pending.current.delete(id);
      setSummaries((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await backend.setRoomMetadata({ [SUMMARY_PREFIX + id]: undefined });
    },
    [backend],
  );

  return {
    summaries,
    loaded,
    roomBytes,
    saveState,
    saveSummary,
    removeSummary,
    projectedBytes,
    isPending: (id: string) => pending.current.has(id),
  };
}
