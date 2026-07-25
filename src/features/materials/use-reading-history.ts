import { useCallback, useRef, useState } from 'react';

const READ_KEY = 'materials.read';
const LIMIT = 400;

function readHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}

export function useReadingHistory() {
  const [keys, setKeys] = useState<string[]>(() => readHistory());
  const setRef = useRef(new Set(keys));

  const markRead = useCallback((key: string) => {
    if (setRef.current.has(key)) return;
    setKeys((prev) => {
      const next = [...prev.filter((item) => item !== key), key].slice(-LIMIT);
      setRef.current = new Set(next);
      try {
        window.localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {
        // приватный режим — история просто не сохранится
      }
      return next;
    });
  }, []);

  // keys нужен как триггер перерисовки: сам Set живёт в ref
  const isRead = useCallback((key: string) => setRef.current.has(key), [keys]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isRead, markRead };
}
