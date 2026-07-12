import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

function ErrorFallback() {
  const { t } = useTranslation();

  return (
    <main className="grid min-h-dvh place-items-center bg-theme-background px-4 text-theme-text">
      <section className="w-full max-w-lg rounded-[28px] border border-theme-border bg-theme-surface p-6 text-center shadow-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-theme-error">runtime_error</p>
        <h1 className="mt-3 text-2xl font-semibold">{t('common.errorTitle')}</h1>
        <p className="mt-3 text-sm leading-6 text-theme-text-subtle">{t('common.errorDescription')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl border border-theme-accent/30 bg-theme-accent/15 px-4 py-2.5 text-sm font-semibold text-theme-accent transition-colors hover:bg-theme-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
        >
          {t('common.reload')}
        </button>
      </section>
    </main>
  );
}
