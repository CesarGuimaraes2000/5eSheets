import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { LS_LANG } from '../constants/keys';
import { DICTIONARIES, type Lang, type Translations } from './translations';
import { cx } from '../components/shared/ui';

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  setLang: () => undefined,
  t: DICTIONARIES.en,
});

function readSavedLang(): Lang {
  try {
    return localStorage.getItem(LS_LANG) === 'pt' ? 'pt' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readSavedLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LS_LANG, next);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: DICTIONARIES[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Compact EN / PT switcher for top bars. */
export function LanguageSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div
      className="inline-flex items-center rounded-md border border-ink-700 bg-ink-850 p-0.5 text-[11px] font-semibold"
      role="group"
      aria-label="Language"
    >
      {(['en', 'pt'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cx(
            'cursor-pointer rounded px-1.5 py-0.5 uppercase transition-colors',
            lang === code
              ? 'bg-gold-500 text-ink-950'
              : 'text-ink-400 hover:text-ink-100',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
