import * as React from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../pluginId';
import { loadPackages } from '../utils/iconCache';
import { splitFamily, titleCase } from '../utils/iconFamily';

const REMEMBER_KEY = `${PLUGIN_ID}:lastPackage`;
const readLast = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) || '';
  } catch {
    return '';
  }
};
const writeLast = (id) => {
  try {
    localStorage.setItem(REMEMBER_KEY, id);
  } catch {
    /* ignore */
  }
};

const uniqueBy = (list, keyFn, labelFn) => {
  const seen = new Map();
  list.forEach((p) => {
    const k = keyFn(p);
    if (!seen.has(k)) seen.set(k, labelFn(p));
  });
  return Array.from(seen, ([value, label]) => ({ value, label }));
};

/**
 * Owns the enabled-package list and the base -> variant -> weight selection,
 * persisting the last pick per viewer. Returns the data + handlers the
 * PackageSelectors component renders.
 */
export const usePackageSelection = (open) => {
  const { get } = useFetchClient();
  const [packages, setPackages] = React.useState([]);
  const [pkg, setPkg] = React.useState('');

  // Load the (small) package list once when the picker opens.
  React.useEffect(() => {
    if (!open || packages.length > 0) return undefined;
    let active = true;
    loadPackages(get)
      .then(({ packages: list, defaultPackage }) => {
        if (!active) return;
        setPackages(list);
        setPkg((cur) => {
          if (cur) return cur;
          const remembered = readLast();
          if (remembered && list.some((p) => p.id === remembered)) return remembered;
          return defaultPackage || (list[0] && list[0].id) || 'classic-solid';
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, packages.length, get]);

  const selectPkg = React.useCallback((id) => {
    setPkg(id);
    writeLast(id);
  }, []);

  const enriched = React.useMemo(
    () =>
      packages.map((p) => {
        const { base, variant } = splitFamily(p.family);
        return {
          ...p,
          base,
          baseLabel: titleCase(base) || 'Classic',
          variant,
          variantLabel: titleCase(variant),
          weightLabel: p.styleLabel || titleCase(p.style),
        };
      }),
    [packages]
  );

  const current = React.useMemo(() => enriched.find((p) => p.id === pkg) || {}, [enriched, pkg]);
  const selectedBase = current.base || '';
  const selectedVariant = current.variant || '';

  const bases = React.useMemo(() => uniqueBy(enriched, (p) => p.base, (p) => p.baseLabel), [enriched]);
  const variants = React.useMemo(
    () =>
      uniqueBy(
        enriched.filter((p) => p.base === selectedBase),
        (p) => p.variant,
        (p) => p.variantLabel
      ),
    [enriched, selectedBase]
  );
  const weights = React.useMemo(
    () => enriched.filter((p) => p.base === selectedBase && p.variant === selectedVariant),
    [enriched, selectedBase, selectedVariant]
  );

  const onBaseChange = React.useCallback(
    (base) => {
      const first = enriched.find((p) => p.base === base);
      if (first) selectPkg(first.id);
    },
    [enriched, selectPkg]
  );
  const onVariantChange = React.useCallback(
    (variant) => {
      const first = enriched.find((p) => p.base === selectedBase && p.variant === variant);
      if (first) selectPkg(first.id);
    },
    [enriched, selectedBase, selectPkg]
  );

  return {
    packages,
    pkg,
    selectPkg,
    bases,
    variants,
    weights,
    selectedBase,
    selectedVariant,
    onBaseChange,
    onVariantChange,
  };
};
