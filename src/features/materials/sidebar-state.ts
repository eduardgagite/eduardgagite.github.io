import type { SidebarState } from './types';

const SIDEBAR_STATE_KEY = 'materials.sidebarState';
const EMPTY_SIDEBAR_STATE: SidebarState = {
  categories: {},
  sections: {},
};

export function readSidebarState(): SidebarState {
  if (typeof window === 'undefined') return EMPTY_SIDEBAR_STATE;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    if (!raw) return EMPTY_SIDEBAR_STATE;
    const parsed = JSON.parse(raw) as Partial<SidebarState> | null;
    return {
      categories: parsed?.categories ?? {},
      sections: parsed?.sections ?? {},
    };
  } catch {
    return EMPTY_SIDEBAR_STATE;
  }
}

export function writeSidebarState(state: SidebarState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
  } catch {
    // noop
  }
}
