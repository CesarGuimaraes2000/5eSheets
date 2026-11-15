import { useEffect } from 'react';
import { useOBR } from './hooks/useOBR';
import { useI18n } from './i18n/I18nContext';
import { DiceRollerProvider } from './components/shared/DiceRoller';
import { EditorApp } from './editor/EditorApp';
import { TableApp } from './table/TableApp';

export function App() {
  const mode = useOBR();
  const { t } = useI18n();

  useEffect(() => {
    document.body.classList.toggle('in-obr', mode.kind === 'table' && mode.backend.kind === 'obr');
  }, [mode]);

  if (mode.kind === 'loading') {
    return (
      <div className="flex h-full items-center justify-center gap-2.5 text-sm text-ink-300">
        <img src="/icon.png" alt="" className="h-6 w-6 animate-pulse object-contain" />
        {t.common.connectingObr}
      </div>
    );
  }

  return (
    <DiceRollerProvider>
      {mode.kind === 'table' ? (
        <TableApp backend={mode.backend} player={mode.player} />
      ) : (
        <EditorApp />
      )}
    </DiceRollerProvider>
  );
}
