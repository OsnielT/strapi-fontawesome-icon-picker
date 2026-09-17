import * as React from 'react';

import { parseStored } from '../utils/iconValue';

/**
 * Manages the scroll container + per-category refs, and (in browse mode) scrolls
 * to the category holding the currently-selected icon when the picker opens.
 */
export const useScrollToSelected = (open, query, value, displayCategories) => {
  const scrollRef = React.useRef(null);
  const sectionRefs = React.useRef({});

  const jumpToCategory = React.useCallback((id, behavior = 'smooth') => {
    const el = sectionRefs.current[id];
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop - 8, behavior });
    }
  }, []);

  React.useEffect(() => {
    if (!open || query || !value || displayCategories.length === 0) return undefined;
    const targetName = parseStored(value)?.name;
    if (!targetName) return undefined;
    const cat = displayCategories.find((c) => c.icons.some((i) => i.name === targetName));
    if (!cat) return undefined;
    const handle = setTimeout(() => jumpToCategory(cat.id, 'auto'), 50);
    return () => clearTimeout(handle);
  }, [open, query, value, displayCategories, jumpToCategory]);

  return { scrollRef, sectionRefs, jumpToCategory };
};
