import { useEffect } from 'react';

interface UseArticleKeyboardNavigationArgs {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFocusSearch?: () => void;
}

/**
 * Переход по материалам — «[» и «]». Стрелки специально не перехватываем:
 * ими прокручивают широкие блоки кода и таблицы.
 */
export function useArticleKeyboardNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onFocusSearch,
}: UseArticleKeyboardNavigationArgs) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (shouldIgnoreArticleNavigationShortcut(event)) return;

      if (event.key === '/' && onFocusSearch) {
        event.preventDefault();
        onFocusSearch();
        return;
      }

      if (event.key === '[' && hasPrevious) {
        event.preventDefault();
        onPrevious();
        return;
      }

      if (event.key === ']' && hasNext) {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [hasNext, hasPrevious, onFocusSearch, onNext, onPrevious]);
}

export function shouldIgnoreArticleNavigationShortcut(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return true;

  const target = event.target;
  if (!(target instanceof Element)) return false;

  return !!target.closest(
    'a, button, input, textarea, select, pre, table, [contenteditable="true"], [role="dialog"], [role="button"], [role="link"]',
  );
}
