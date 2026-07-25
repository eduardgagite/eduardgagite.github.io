export interface TreeState {
  category: string | null;
  sections: string[];
}

const TREE_STATE_KEY = 'materials.tree.v2';
const SECTIONS_LIMIT = 12;
const EMPTY_TREE_STATE: TreeState = { category: null, sections: [] };

export function readTreeState(): TreeState {
  if (typeof window === 'undefined') return EMPTY_TREE_STATE;
  try {
    const raw = window.localStorage.getItem(TREE_STATE_KEY);
    if (!raw) return EMPTY_TREE_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return EMPTY_TREE_STATE;
    const value = parsed as Partial<TreeState>;
    return {
      category: typeof value.category === 'string' ? value.category : null,
      sections: Array.isArray(value.sections)
        ? value.sections.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return EMPTY_TREE_STATE;
  }
}

export function writeTreeState(state: TreeState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      TREE_STATE_KEY,
      JSON.stringify({ category: state.category, sections: state.sections.slice(-SECTIONS_LIMIT) }),
    );
  } catch {
    // приватный режим и переполненное хранилище нас не касаются
  }
}
