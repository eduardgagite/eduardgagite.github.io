import { useCallback, useEffect, useState } from 'react';
import { loadMaterialsTree, type MaterialsTree } from '../../materials/loader';

type MaterialsTreeState =
  { status: 'loading'; tree: null } | { status: 'ready'; tree: MaterialsTree } | { status: 'error'; tree: null };

const EMPTY_TREE: MaterialsTree = {
  categories: [],
  byId: {},
  availableLanguages: {},
};

export function useMaterialsTree(lang: 'ru' | 'en') {
  const [treeState, setTreeState] = useState<MaterialsTreeState>({ status: 'loading', tree: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTreeState({ status: 'loading', tree: null });

    loadMaterialsTree(lang)
      .then((nextTree) => {
        if (cancelled) return;
        setTreeState({ status: 'ready', tree: nextTree });
      })
      .catch(() => {
        if (cancelled) return;
        setTreeState({ status: 'error', tree: null });
      });

    return () => {
      cancelled = true;
    };
  }, [lang, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    tree: treeState.tree ?? EMPTY_TREE,
    isTreeReady: treeState.status === 'ready',
    isTreeLoading: treeState.status === 'loading',
    isTreeError: treeState.status === 'error',
    reload,
  };
}
