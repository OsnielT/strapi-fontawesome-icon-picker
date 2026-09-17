import * as React from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../pluginId';
import { loadPackage } from '../utils/iconCache';

/**
 * Loads the selected package's catalog (categorized icons) and runs debounced
 * search within it. Returns what the panel body renders.
 */
export const useIconCatalog = (open, pkg, query) => {
  const { get } = useFetchClient();
  const [catalog, setCatalog] = React.useState(null); // { icons, categories }
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // Load the selected package (per-package, cached in IndexedDB).
  React.useEffect(() => {
    if (!open || !pkg) return undefined;
    let active = true;
    setLoading(true);
    setCatalog(null);
    loadPackage(get, pkg)
      .then((data) => active && setCatalog(data))
      .catch(() => active && setCatalog({ icons: {}, categories: [] }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, pkg, get]);

  // Debounced search, scoped to the selected package.
  React.useEffect(() => {
    if (!open || !query) {
      setResults([]);
      return undefined;
    }
    let active = true;
    setLoading(true);
    const handle = setTimeout(() => {
      get(`/${PLUGIN_ID}/icons`, { params: { q: query, package: pkg } })
        .then(({ data }) => active && setResults(Array.isArray(data) ? data : []))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, open, pkg, get]);

  // Resolve category icon-name references to concrete icon objects.
  const displayCategories = React.useMemo(() => {
    if (!catalog) return [];
    return catalog.categories
      .map((cat) => ({
        id: cat.id,
        label: cat.label,
        icons: cat.icons.map((iconName) => catalog.icons[iconName]).filter(Boolean),
      }))
      .filter((cat) => cat.icons.length > 0);
  }, [catalog]);

  return { displayCategories, results, loading };
};
