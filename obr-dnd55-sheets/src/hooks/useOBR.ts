import { useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import {
  createMockBackend,
  createObrBackend,
  type PlayerInfo,
  type RoomBackend,
} from '../obr/backend';

export type AppMode =
  | { kind: 'loading' }
  | { kind: 'standalone' }
  | { kind: 'table'; backend: RoomBackend; player: PlayerInfo };

/**
 * Detects where the app is running:
 * - inside Owlbear Rodeo → table mode (real SDK)
 * - `?obr=mock` → table mode with a localStorage mock
 * - otherwise → standalone full sheet editor
 */
export function useOBR(): AppMode {
  const [mode, setMode] = useState<AppMode>(() => {
    if (OBR.isAvailable) return { kind: 'loading' };
    if (new URLSearchParams(window.location.search).get('obr') === 'mock') return { kind: 'loading' };
    return { kind: 'standalone' };
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const start = async (backend: RoomBackend) => {
      const player = await backend.getPlayer();
      if (cancelled) return;
      setMode({ kind: 'table', backend, player });
      unsubscribe = backend.onPlayerChange((p) =>
        setMode((m) => (m.kind === 'table' ? { ...m, player: p } : m)),
      );
    };

    if (OBR.isAvailable) {
      OBR.onReady(() => void start(createObrBackend()));
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('obr') === 'mock') void start(createMockBackend(params));
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return mode;
}
