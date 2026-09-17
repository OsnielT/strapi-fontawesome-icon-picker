'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const { toLabel } = require('./naming');

// Only the free package is installed (small) — used solely for category names.
/* eslint-disable import/no-extraneous-dependencies */
const categoriesYmlPath = require.resolve('@fortawesome/fontawesome-free/metadata/categories.yml');
/* eslint-enable import/no-extraneous-dependencies */
const categoriesMeta = yaml.load(fs.readFileSync(categoriesYmlPath, 'utf8')) || {};

/**
 * Group a package's icons (keyed by name) into categories using the bundled
 * category metadata. Icons not in any category fall into an "Other" bucket.
 */
const buildCategories = (byName) => {
  const categories = Object.entries(categoriesMeta)
    .map(([id, meta]) => ({
      id,
      label: (meta && meta.label) || toLabel(id),
      icons: ((meta && meta.icons) || []).filter((n) => byName[n]),
    }))
    .filter((c) => c.icons.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  const categorized = new Set(categories.flatMap((c) => c.icons));
  const others = Object.keys(byName)
    .filter((n) => !categorized.has(n))
    .sort();
  if (others.length) categories.push({ id: 'other', label: 'Other', icons: others });
  return categories;
};

module.exports = { buildCategories };
