import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, ScrollText, Swords } from 'lucide-react';
import type { CharacterSheet } from '../types/character';
import { computeDerivedStats, getEffectiveStats } from '../utils/calculations';
import type { SheetCtx } from './sheetContext';
import { SheetHeader } from './layout/SheetHeader';
import { TabNav, type TabDef } from './layout/TabNav';
import { Page1Core } from './pages/Page1Core';
import { Page2Lore } from './pages/Page2Lore';
import { Page3Spells } from './pages/Page3Spells';

type Tab = 'core' | 'lore' | 'spells';

const TABS: TabDef<Tab>[] = [
  { id: 'core', label: 'Core & Combat', icon: Swords },
  { id: 'lore', label: 'Details & Story', icon: ScrollText },
  { id: 'spells', label: 'Spells & Grimoire', icon: BookOpen },
];

/** The full 3-page character sheet editor (used in the site and inside OBR). */
export function SheetEditor({
  sheet,
  onChange,
  readOnly = false,
  headerLeft,
  headerRight,
}: {
  sheet: CharacterSheet;
  onChange: (sheet: CharacterSheet) => void;
  readOnly?: boolean;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>('core');

  const mutate = useCallback(
    (recipe: (draft: CharacterSheet) => void) => {
      if (readOnly) return;
      const draft = structuredClone(sheet);
      recipe(draft);
      draft.updatedAt = Date.now();
      onChange(draft);
    },
    [sheet, onChange, readOnly],
  );

  const setAutoCalculate = useCallback(
    (on: boolean) =>
      mutate((d) => {
        // When switching to manual, start from the current calculated values.
        if (!on) d.manualStats = computeDerivedStats(d);
        d.autoCalculate = on;
      }),
    [mutate],
  );

  const ctx: SheetCtx = useMemo(
    () => ({ sheet, stats: getEffectiveStats(sheet), readOnly, mutate, setAutoCalculate }),
    [sheet, readOnly, mutate, setAutoCalculate],
  );

  return (
    <div className="flex flex-col gap-3">
      <SheetHeader ctx={ctx} left={headerLeft} right={headerRight} />
      <TabNav tabs={TABS} active={tab} onChange={setTab} />
      <div key={tab} className="animate-fade-in">
        {tab === 'core' && <Page1Core ctx={ctx} />}
        {tab === 'lore' && <Page2Lore ctx={ctx} />}
        {tab === 'spells' && <Page3Spells ctx={ctx} />}
      </div>
    </div>
  );
}
