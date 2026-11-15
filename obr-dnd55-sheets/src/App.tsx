import { useEffect } from 'react';
import { Dices } from 'lucide-react';
import { useOBR } from './hooks/useOBR';
import { EditorApp } from './editor/EditorApp';
import { TableApp } from './table/TableApp';

export function App() {
  const mode = useOBR();

  useEffect(() => {
    document.body.classList.toggle('in-obr', mode.kind === 'table' && mode.backend.kind === 'obr');
  }, [mode]);

  if (mode.kind === 'loading') {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-300">
        <Dices className="h-5 w-5 animate-spin text-gold-400" />
        Connecting to Owlbear Rodeo...
      </div>
    );
  }

  if (mode.kind === 'table') {
    return <TableApp backend={mode.backend} player={mode.player} />;
  }

  return <EditorApp />;
}
