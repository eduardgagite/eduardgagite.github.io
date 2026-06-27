import { useEffect } from 'react';

interface UseArticleKeyboardNavigationArgs {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function useArticleKeyboardNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: UseArticleKeyboardNavigationArgs) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (shouldIgnoreArticleNavigationShortcut(event)) return;

      if (event.key === 'ArrowLeft' && hasPrevious) {
        event.preventDefault();
        onPrevious();
        return;
      }

      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [hasNext, hasPrevious, onNext, onPrevious]);
}

function shouldIgnoreArticleNavigationShortcut(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return true;

  const target = event.target;
  if (!(target instanceof Element)) return false;

  return !!target.closest(
    'a, button, input, textarea, select, [contenteditable="true"], [role="dialog"], [role="button"], [role="link"]',
  );
}
