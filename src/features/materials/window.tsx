import { forwardRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NetworkBackground } from '../../components/background/network-canvas';
import { PathLine, type PathSegment } from './path-line';

export interface MaterialsWindowProps {
  pathSegments: PathSegment[];
  tree: ReactNode;
  children: ReactNode;
  rail?: ReactNode;
  statusLeft?: ReactNode;
  statusRight?: ReactNode;
  treeOpen: boolean;
  onToggleTree: () => void;
  announce?: string;
}

export const MATERIALS_SCROLLER_ID = 'materials-scroller';

/**
 * Одна плита на страницу. overflow-hidden на окне и на обёртках ставить нельзя —
 * от него молча перестают залипать адресная строка, указатель и рельс оглавления.
 */
export const MaterialsWindow = forwardRef<HTMLElement, MaterialsWindowProps>(function MaterialsWindow(
  { pathSegments, tree, children, rail, statusLeft, statusRight, treeOpen, onToggleTree, announce },
  ref,
) {
  const { t } = useTranslation();

  return (
    <section
      id={MATERIALS_SCROLLER_ID}
      ref={ref}
      tabIndex={-1}
      className="materials-scope relative h-full w-full overflow-y-auto overflow-x-hidden focus:outline-none"
    >
      <div className="pointer-events-none fixed inset-0 -z-10">
        <NetworkBackground density="low" />
      </div>

      {/* Ширина и поля общие с главной: три плиты сайта не должны стоять по разным линиям. */}
      <div className="relative mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.28),_transparent_65%)] opacity-70 blur-3xl"
          />

          <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="sticky top-0 z-20 flex h-11 items-center rounded-t-[27px] border-b border-white/10 bg-theme-background px-4">
              <PathLine segments={pathSegments} />
            </div>

            <button
              type="button"
              aria-expanded={treeOpen}
              aria-controls="materials-tree"
              onClick={onToggleTree}
              className="flex w-full items-baseline gap-2 border-b border-white/[0.07] px-4 py-3 font-mono text-[12px] text-white/50 transition-colors hover:text-white/80 lg:hidden"
            >
              <span aria-hidden className="w-2">
                {treeOpen ? '▾' : '▸'}
              </span>
              {t('materials.treeToggle')}
            </button>

            <div
              className={
                rail
                  ? 'lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:grid-cols-[17.5rem_minmax(0,1fr)_11.5rem]'
                  : 'lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]'
              }
            >
              <div
                id="materials-tree"
                className={`lg:block ${treeOpen ? 'block border-b border-white/[0.07]' : 'hidden'}`}
              >
                <div className="flex max-h-[70dvh] flex-col lg:sticky lg:top-11 lg:max-h-[var(--materials-rail)]">
                  {tree}
                </div>
              </div>

              <div className="min-w-0 border-white/[0.07] px-5 py-7 sm:px-8 sm:py-9 lg:border-l lg:px-12">
                {children}
              </div>

              {rail && <div className="hidden py-7 pl-5 pr-4 xl:block">{rail}</div>}
            </div>

            <div className="flex min-h-[2.25rem] flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-[27px] border-t border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[11px]">
              <span className="flex min-w-0 items-baseline gap-3">{statusLeft}</span>
              {statusRight && <span className="flex shrink-0 items-baseline gap-4">{statusRight}</span>}
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </section>
  );
});
