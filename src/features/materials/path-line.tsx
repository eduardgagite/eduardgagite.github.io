import { Link } from 'react-router-dom';

export interface PathSegment {
  label: string;
  to?: string;
}

/**
 * Верхняя полоса окна — живой путь из кликабельных сегментов.
 * Светофоров здесь нет: они уже заняты блоками кода и окном проектов.
 */
export function PathLine({ segments }: { segments: PathSegment[] }) {
  const fullPath = segments.map((segment) => segment.label).join('/');
  const head = segments.slice(0, -1);
  const last = segments[segments.length - 1];

  return (
    <span className="flex min-w-0 items-baseline font-mono text-xs" title={fullPath}>
      {head.length > 0 && (
        <>
          <span aria-hidden className="px-1 text-white/25 sm:hidden">
            …/
          </span>
          <span className="hidden sm:contents">
            {head.map((segment, index) => (
              <span key={`${segment.label}-${index}`} className="contents">
                {index > 0 && (
                  <span aria-hidden className="px-1 text-white/25">
                    /
                  </span>
                )}
                {segment.to ? (
                  <Link to={segment.to} className="shrink-0 text-white/50 transition-colors hover:text-white/85">
                    {segment.label}
                  </Link>
                ) : (
                  <span className="shrink-0 text-white/50">{segment.label}</span>
                )}
              </span>
            ))}
            <span aria-hidden className="px-1 text-white/25">
              /
            </span>
          </span>
        </>
      )}
      {last && <span className="min-w-0 truncate text-white/75">{last.label}</span>}
    </span>
  );
}
