/** Namespace for every key this extension writes to Owlbear Rodeo. */
export const EXT_ID = 'com.dnd55.sheets';

/** Room metadata: one key per character summary → `${SUMMARY_PREFIX}${characterId}`. */
export const SUMMARY_PREFIX = `${EXT_ID}/c/`;

/** Item (token) metadata: id of the character linked to that token. */
export const TOKEN_LINK_KEY = `${EXT_ID}/character`;

/** Player metadata: request from the context menu (open/link a sheet). */
export const PLAYER_REQUEST_KEY = `${EXT_ID}/request`;

/** Room metadata limit documented by Owlbear Rodeo (shared by all extensions). */
export const ROOM_METADATA_LIMIT = 16 * 1024;

/** localStorage keys. */
export const LS_SHEETS = 'dnd55.sheets.v1';
export const LS_MOCK_ROOM = 'dnd55.mockRoom.v1';
export const LS_MOCK_PLAYER = 'dnd55.mockPlayer.v1';
export const LS_LANG = 'dnd55.lang.v1';

/** Export file format marker. */
export const FILE_FORMAT = 'dnd55-sheet';
