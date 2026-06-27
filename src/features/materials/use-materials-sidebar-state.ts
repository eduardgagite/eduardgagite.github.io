import { useEffect, useMemo, useState } from 'react';
import { readSidebarState, writeSidebarState } from './sidebar-state';
import type { SidebarState } from './types';
import { buildSectionStateKey } from './route';

interface UseMaterialsSidebarStateArgs {
  activeCategoryId?: string;
  activeSectionId?: string;
  isArticle: boolean;
}

export function useMaterialsSidebarState({
  activeCategoryId,
  activeSectionId,
  isArticle,
}: UseMaterialsSidebarStateArgs) {
  const sidebarState = useMemo<SidebarState>(() => readSidebarState(), []);

  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>(sidebarState.categories);
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>(sidebarState.sections);

  useEffect(() => {
    if (!isArticle || !activeCategoryId) return;
    setCategoryOpen((prev) => {
      if (prev[activeCategoryId]) return prev;
      return { ...prev, [activeCategoryId]: true };
    });
  }, [activeCategoryId, isArticle]);

  useEffect(() => {
    if (!isArticle || !activeCategoryId || !activeSectionId) return;
    const targetSectionKey = buildSectionStateKey(activeCategoryId, activeSectionId);
    setSectionOpen((prev) => {
      if (prev[targetSectionKey]) return prev;
      return { ...prev, [targetSectionKey]: true };
    });
  }, [activeCategoryId, activeSectionId, isArticle]);

  useEffect(() => {
    const id = setTimeout(() => {
      writeSidebarState({ categories: categoryOpen, sections: sectionOpen });
    }, 250);
    return () => clearTimeout(id);
  }, [categoryOpen, sectionOpen]);

  const toggleCategory = (categoryId: string) => {
    setCategoryOpen((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleSection = (categoryId: string, sectionId: string) => {
    const key = buildSectionStateKey(categoryId, sectionId);
    setSectionOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return {
    categoryOpen,
    sectionOpen,
    toggleCategory,
    toggleSection,
  };
}
