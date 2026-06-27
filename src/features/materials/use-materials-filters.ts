import { useEffect, useMemo, useState } from 'react';
import type { MaterialsCategory } from '../../materials/loader';
import { deriveFilterOptions, filterCategoriesTree } from './filters';

interface UseMaterialsFiltersArgs {
  categories: MaterialsCategory[];
}

export function useMaterialsFilters({ categories }: UseMaterialsFiltersArgs) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const filterOptions = useMemo(
    () => deriveFilterOptions({ categories }),
    [categories],
  );

  const filteredCategories = useMemo(
    () =>
      filterCategoriesTree({
        categories,
        criteria: { query: searchQuery, tag: selectedTag, level: selectedLevel },
      }),
    [categories, searchQuery, selectedTag, selectedLevel],
  );

  useEffect(() => {
    if (selectedTag && !filterOptions.tags.includes(selectedTag)) setSelectedTag(null);
  }, [filterOptions.tags, selectedTag]);

  useEffect(() => {
    if (selectedLevel && !filterOptions.levels.includes(selectedLevel)) setSelectedLevel(null);
  }, [filterOptions.levels, selectedLevel]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
    setSelectedLevel(null);
  };

  return {
    filterOptions,
    filteredCategories,
    hasActiveFilters: searchQuery.trim().length > 0 || !!selectedTag || !!selectedLevel,
    searchQuery,
    selectedLevel,
    selectedTag,
    setSearchQuery,
    setSelectedLevel,
    setSelectedTag,
    resetFilters,
  };
}
