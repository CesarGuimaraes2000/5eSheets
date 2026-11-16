import { useCallback, useEffect, useState } from 'react';
import type { MonsterSheet } from '../types/monster';
import { LS_MONSTERS } from '../constants/keys';
import { normalizeMonster } from '../utils/monsterStorage';

type MonsterMap = Record<string, MonsterSheet>;

function load(): MonsterMap {
  try {
    const raw = localStorage.getItem(LS_MONSTERS);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: MonsterMap = {};
    for (const value of Object.values(parsed as Record<string, unknown>)) {
      const monster = normalizeMonster(value);
      out[monster.id] = monster;
    }
    return out;
  } catch {
    return {};
  }
}

/** GM-only enemy/monster statblocks stored locally in this browser (never shared in OBR room metadata). */
export function useLocalMonsters() {
  const [monsters, setMonsters] = useState<MonsterMap>(load);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_MONSTERS) setMonsters(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((updater: (prev: MonsterMap) => MonsterMap) => {
    setMonsters((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(LS_MONSTERS, JSON.stringify(next));
      } catch (err) {
        console.error('Could not save monsters to localStorage', err);
      }
      return next;
    });
  }, []);

  const upsert = useCallback(
    (monster: MonsterSheet) =>
      persist((prev) => ({ ...prev, [monster.id]: { ...monster, updatedAt: Date.now() } })),
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

  return { monsters, upsert, remove };
}
