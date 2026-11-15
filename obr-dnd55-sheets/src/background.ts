import OBR from '@owlbear-rodeo/sdk';
import { EXT_ID, PLAYER_REQUEST_KEY, TOKEN_LINK_KEY } from './constants/keys';

/**
 * Background script loaded by Owlbear Rodeo (`background_url` in manifest.json).
 * Registers token context menu actions to open or link a character sheet.
 */
OBR.onReady(() => {
  // 1. Open linked character sheet when the token already has a linked character
  void OBR.contextMenu.create({
    id: `${EXT_ID}/open-sheet`,
    icons: [
      {
        icon: '/icon.svg',
        label: 'Open D&D 5.5 Sheet',
        filter: {
          min: 1,
          max: 1,
          every: [
            { key: 'layer', value: 'CHARACTER' },
            { key: ['metadata', TOKEN_LINK_KEY], value: undefined, operator: '!=' },
          ],
        },
      },
    ],
    onClick: async (context) => {
      const item = context.items[0];
      const characterId = item?.metadata[TOKEN_LINK_KEY];
      if (typeof characterId !== 'string') return;
      await OBR.player.setMetadata({
        [PLAYER_REQUEST_KEY]: { type: 'open', characterId, ts: Date.now() },
      });
      await OBR.action.open();
    },
  });

  // 2. Link (or relink) a character token to a sheet
  void OBR.contextMenu.create({
    id: `${EXT_ID}/link-sheet`,
    icons: [
      {
        icon: '/icon.svg',
        label: 'Link D&D 5.5 Sheet',
        filter: {
          min: 1,
          max: 1,
          every: [{ key: 'layer', value: 'CHARACTER' }],
        },
      },
    ],
    onClick: async (context) => {
      const item = context.items[0];
      if (!item) return;
      await OBR.player.setMetadata({
        [PLAYER_REQUEST_KEY]: { type: 'link', itemId: item.id, ts: Date.now() },
      });
      await OBR.action.open();
    },
  });
});
