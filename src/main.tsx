import { Component, lazy, StrictMode, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { openUrl } from '@tauri-apps/plugin-opener';
import './styles.css';
import './sequence.css';

const App = lazy(async () => {
  const module = await import('./App');
  return { default: module.App };
});

type AppErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur React non gérée.', error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="overlay">
        <section className="current-step current-step--hard_lock" aria-labelledby="app-error-title">
          <span className="type-badge">ERREUR</span>
          <div className="step-title-row">
            <h1 id="app-error-title">Le guide n’a pas pu s’afficher</h1>
          </div>
          <p className="instruction">
            Une erreur inattendue a interrompu l’interface. Ta progression locale n’a pas été supprimée.
          </p>
          <p className="instruction">{this.state.error.message}</p>
          <button className="complete-button" type="button" onClick={() => window.location.reload()}>
            RECHARGER L’INTERFACE
          </button>
        </section>
      </main>
    );
  }
}

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
    <AppErrorBoundary>
      <Suspense fallback={<main className="overlay">Chargement du guide…</main>}>
        <App />
      </Suspense>
    </AppErrorBoundary>
  </StrictMode>,
);
