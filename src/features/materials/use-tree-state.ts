import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MaterialsCategory } from '../../materials/loader';
import { buildSectionStateKey } from './route';
import { readTreeState, writeTreeState } from './tree-state';

interface UseTreeStateArgs {
  categories: MaterialsCategory[];
  activeCategoryId?: string;
  activeSectionId?: string;
  activeMaterialKey?: string | null;
  treeOpen: boolean;
}

export function useTreeState({
  categories,
  activeCategoryId,
  activeSectionId,
  activeMaterialKey,
  treeOpen,
}: UseTreeStateArgs) {
  const stored = useMemo(() => readTreeState(), []);
  const [openCategory, setOpenCategory] = useState<string | null>(stored.category);
  const [openSections, setOpenSections] = useState<string[]>(stored.sections);
  const treeScrollRef = useRef<HTMLDivElement | null>(null);
  const activeRowRef = useRef<HTMLAnchorElement | null>(null);
  const prunedRef = useRef(false);

  // Ветки, которых больше нет в дереве (переименовали раздел), молча забываем.
  useEffect(() => {
    if (prunedRef.current || categories.length === 0) return;
    prunedRef.current = true;
    const knownCategories = new Set(categories.map((category) => category.id));
    const knownSections = new Set(
      categories.flatMap((category) =>
        category.sections.map((section) => buildSectionStateKey(category.id, section.id)),
      ),
    );
    setOpenCategory((prev) => (prev && knownCategories.has(prev) ? prev : null));
    setOpenSections((prev) => prev.filter((key) => knownSections.has(key)));
  }, [categories]);

  useEffect(() => {
    if (!activeCategoryId) return;
    setOpenCategory(activeCategoryId);
  }, [activeCategoryId]);

  useEffect(() => {
    if (!activeCategoryId || !activeSectionId) return;
    const key = buildSectionStateKey(activeCategoryId, activeSectionId);
    setOpenSections((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }, [activeCategoryId, activeSectionId]);

  useEffect(() => {
    const id = window.setTimeout(() => writeTreeState({ category: openCategory, sections: openSections }), 250);
    return () => window.clearTimeout(id);
  }, [openCategory, openSections]);

  // Активную строку подводим к центру списка. scrollIntoView здесь нельзя —
  // он утащил бы и внешний скроллер страницы.
  useEffect(() => {
    const box = treeScrollRef.current;
    const row = activeRowRef.current;
    if (!box || !row) return;
    const boxRect = box.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top < boxRect.top + 8 || rowRect.bottom > boxRect.bottom - 8) {
      box.scrollTop += rowRect.top - boxRect.top - box.clientHeight / 2 + rowRect.height / 2;
    }
  }, [activeMaterialKey, treeOpen, openSections]);

  const toggleCategory = useCallback((categoryId: string) => {
    setOpenCategory((prev) => {
      if (prev === categoryId) return null;
      return categoryId;
    });
    setOpenSections((prev) => prev.filter((key) => key.startsWith(`${categoryId}/`)));
  }, []);

  const toggleSection = useCallback((categoryId: string, sectionId: string) => {
    const key = buildSectionStateKey(categoryId, sectionId);
    setOpenSections((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }, []);

  const isCategoryOpen = useCallback((categoryId: string) => openCategory === categoryId, [openCategory]);
  const isSectionOpen = useCallback(
    (categoryId: string, sectionId: string) => openSections.includes(buildSectionStateKey(categoryId, sectionId)),
    [openSections],
  );

  return { isCategoryOpen, isSectionOpen, toggleCategory, toggleSection, treeScrollRef, activeRowRef };
}
