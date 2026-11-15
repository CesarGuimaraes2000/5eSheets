import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { I18nProvider } from './i18n/I18nContext';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
