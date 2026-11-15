import { useCallback, useEffect, useState } from 'react';
import type { CharacterSheet } from '../types/character';
import { LS_SHEETS } from '../constants/keys';
import { normalizeSheet } from '../utils/storage';

type SheetMap = Record<string, CharacterSheet>;

function load(): SheetMap {
  try {
    const raw = localStorage.getItem(LS_SHEETS);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: SheetMap = {};
    for (const value of Object.values(parsed as Record<string, unknown>)) {
      const sheet = normalizeSheet(value);
      out[sheet.id] = sheet;
    }
    return out;
  } catch {
    return {};
  }
}

/** Full character sheets stored in this browser (localStorage), synced across tabs. */
export function useLocalSheets() {
  const [sheets, setSheets] = useState<SheetMap>(load);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_SHEETS) setSheets(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((updater: (prev: SheetMap) => SheetMap) => {
    setSheets((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(LS_SHEETS, JSON.stringify(next));
      } catch (err) {
        console.error('Could not save sheets to localStorage', err);
      }
      return next;
    });
  }, []);

  const upsert = useCallback(
    (sheet: CharacterSheet) => persist((prev) => ({ ...prev, [sheet.id]: sheet })),
    [persist],
  );

  const remove = useCallback(
    (id: string) =>
      persist((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      }),
    [persist],
  );

  return { sheets, upsert, remove };
}
