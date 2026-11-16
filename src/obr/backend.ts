import OBR from '@owlbear-rodeo/sdk';
import {
  LS_MOCK_PLAYER,
  LS_MOCK_ROOM,
  TOKEN_LINK_KEY,
  TOKEN_MONSTER_LINK_KEY,
} from '../constants/keys';

export type Metadata = Record<string, unknown>;
export type Role = 'GM' | 'PLAYER';

export interface PlayerInfo {
  id: string;
  name: string;
  role: Role;
  metadata: Metadata;
}

export interface PartyMember {
  id: string;
  name: string;
}

/**
 * Thin abstraction over the Owlbear Rodeo SDK so the table UI can also run
 * outside OBR with a localStorage mock (`?obr=mock`), handy for layout tests.
 */
export interface RoomBackend {
  kind: 'obr' | 'mock';
  getPlayer(): Promise<PlayerInfo>;
  onPlayerChange(cb: (player: PlayerInfo) => void): () => void;
  setPlayerMetadata(update: Metadata): Promise<void>;
  getParty(): Promise<PartyMember[]>;
  onPartyChange(cb: (party: PartyMember[]) => void): () => void;
  getRoomMetadata(): Promise<Metadata>;
  /** Partial update; keys set to `undefined` are deleted. */
  setRoomMetadata(update: Metadata): Promise<void>;
  onRoomMetadataChange(cb: (metadata: Metadata) => void): () => void;
  notify(message: string, variant?: 'DEFAULT' | 'ERROR' | 'SUCCESS' | 'WARNING' | 'INFO'): void;
  linkToken(itemId: string, characterId: string | null): Promise<void>;
  linkMonsterToken(itemId: string, monsterId: string | null): Promise<void>;
}

// ---------------------------------------------------------------------------
// Real Owlbear Rodeo backend
// ---------------------------------------------------------------------------

export function createObrBackend(): RoomBackend {
  return {
    kind: 'obr',
    async getPlayer() {
      const [name, role, metadata] = await Promise.all([
        OBR.player.getName(),
        OBR.player.getRole(),
        OBR.player.getMetadata(),
      ]);
      return { id: OBR.player.id, name, role, metadata };
    },
    onPlayerChange(cb) {
      return OBR.player.onChange((p) =>
        cb({ id: p.id, name: p.name, role: p.role, metadata: p.metadata }),
      );
    },
    setPlayerMetadata: (update) => OBR.player.setMetadata(update),
    async getParty() {
      const players = await OBR.party.getPlayers();
      return players.map((p) => ({ id: p.id, name: p.name }));
    },
    onPartyChange(cb) {
      return OBR.party.onChange((players) => cb(players.map((p) => ({ id: p.id, name: p.name }))));
    },
    getRoomMetadata: () => OBR.room.getMetadata(),
    setRoomMetadata: (update) => OBR.room.setMetadata(update),
    onRoomMetadataChange: (cb) => OBR.room.onMetadataChange(cb),
    notify(message, variant = 'DEFAULT') {
      void OBR.notification.show(message, variant);
    },
    async linkToken(itemId, characterId) {
      await OBR.scene.items.updateItems([itemId], (items) => {
        for (const item of items) {
          if (characterId) {
            item.metadata[TOKEN_LINK_KEY] = characterId;
            delete item.metadata[TOKEN_MONSTER_LINK_KEY];
          } else {
            delete item.metadata[TOKEN_LINK_KEY];
          }
        }
      });
    },
    async linkMonsterToken(itemId, monsterId) {
      await OBR.scene.items.updateItems([itemId], (items) => {
        for (const item of items) {
          if (monsterId) {
            item.metadata[TOKEN_MONSTER_LINK_KEY] = monsterId;
            delete item.metadata[TOKEN_LINK_KEY];
          } else {
            delete item.metadata[TOKEN_MONSTER_LINK_KEY];
          }
        }
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Mock backend (localStorage + `storage` events → works across browser tabs)
// Usage: http://localhost:5173/?obr=mock&name=Alice&role=GM
// ---------------------------------------------------------------------------

function readJson(key: string): Metadata {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? (parsed as Metadata) : {};
  } catch {
    return {};
  }
}

export function createMockBackend(params: URLSearchParams): RoomBackend {
  const name = params.get('name') ?? 'Mock Player';
  const role: Role = params.get('role')?.toUpperCase() === 'GM' ? 'GM' : 'PLAYER';
  const id = `mock-${name.toLowerCase().replace(/\s+/g, '-')}`;
  const playerKey = `${LS_MOCK_PLAYER}.${id}`;
  const roomListeners = new Set<(m: Metadata) => void>();
  const playerListeners = new Set<(p: PlayerInfo) => void>();

  const player = (): PlayerInfo => ({ id, name, role, metadata: readJson(playerKey) });

  window.addEventListener('storage', (e) => {
    if (e.key === LS_MOCK_ROOM) roomListeners.forEach((cb) => cb(readJson(LS_MOCK_ROOM)));
  });

  const writeRoom = (update: Metadata) => {
    const next = { ...readJson(LS_MOCK_ROOM), ...update };
    for (const [k, v] of Object.entries(next)) if (v === undefined) delete next[k];
    localStorage.setItem(LS_MOCK_ROOM, JSON.stringify(next));
    roomListeners.forEach((cb) => cb(next));
  };

  return {
    kind: 'mock',
    getPlayer: async () => player(),
    onPlayerChange(cb) {
      playerListeners.add(cb);
      return () => playerListeners.delete(cb);
    },
    async setPlayerMetadata(update) {
      localStorage.setItem(playerKey, JSON.stringify({ ...readJson(playerKey), ...update }));
      playerListeners.forEach((cb) => cb(player()));
    },
    getParty: async () => [
      { id: 'mock-alice', name: 'Alice' },
      { id: 'mock-bob', name: 'Bob' },
    ].filter((p) => p.id !== id),
    onPartyChange: () => () => undefined,
    getRoomMetadata: async () => readJson(LS_MOCK_ROOM),
    async setRoomMetadata(update) {
      await new Promise((r) => setTimeout(r, 60)); // simulate network
      writeRoom(update);
    },
    onRoomMetadataChange(cb) {
      roomListeners.add(cb);
      return () => roomListeners.delete(cb);
    },
    notify(message) {
      console.info(`[OBR notification] ${message}`);
    },
    async linkToken() {
      /* no tokens in mock mode */
    },
    async linkMonsterToken() {
      /* no tokens in mock mode */
    },
  };
}
