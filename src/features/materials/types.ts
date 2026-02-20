export interface SidebarState {
  categories: Record<string, boolean>;
  sections: Record<string, boolean>;
}

export interface SidebarCopy {
  heading: string;
  intro: string;
  searchLabel: string;
  searchPlaceholder: string;
  levelLabel: string;
  tagsLabel: string;
  resetLabel: string;
  emptyLabel: string;
  filtersTitle: string;
  structureTitle: string;
}

export interface FilterCriteria {
  query: string;
  tag: string | null;
  level: string | null;
}

export interface FilterOptions {
  tags: string[];
  levels: string[];
}
