import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { openUrl } from '@tauri-apps/plugin-opener';
import { App } from './App';
import './styles.css';
import './sequence.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const anchor = target.closest<HTMLAnchorElement>('a[href]');
  if (!anchor) {
    return;
  }

  const url = anchor.href;
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return;
  }

  event.preventDefault();
  void openUrl(url).catch((error: unknown) => {
    console.error("Impossible d'ouvrir le lien dans le navigateur système.", error);
  });
});

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
