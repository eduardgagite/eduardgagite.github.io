import { useCallback, useMemo, useState } from 'react';
import type { MaterialsCategory } from '../../materials/loader';
import { searchMaterials, type MaterialHit } from './search';

interface UseMaterialsSearchArgs {
  categories: MaterialsCategory[];
}

export interface MaterialsSearch {
  query: string;
  hits: MaterialHit[];
  isSearching: boolean;
  selectedIndex: number;
  setQuery: (value: string) => void;
  clear: () => void;
  moveSelection: (delta: number) => void;
  selectedHit: MaterialHit | undefined;
}

export function useMaterialsSearch({ categories }: UseMaterialsSearchArgs): MaterialsSearch {
  const [query, setQueryState] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hits = useMemo(() => searchMaterials(categories, query), [categories, query]);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setSelectedIndex(0);
  }, []);

  const clear = useCallback(() => {
    setQueryState('');
    setSelectedIndex(0);
  }, []);

  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        if (hits.length === 0) return 0;
        const next = prev + delta;
        if (next < 0) return hits.length - 1;
        if (next >= hits.length) return 0;
        return next;
      });
    },
    [hits.length],
  );

  return {
    query,
    hits,
    isSearching: query.trim().length > 0,
    selectedIndex,
    setQuery,
    clear,
    moveSelection,
    selectedHit: hits[selectedIndex],
  };
}
