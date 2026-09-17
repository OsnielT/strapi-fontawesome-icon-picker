'use strict';

// Pure naming helpers: labels, CSS class prefixes, API enum names, and the
// package-id <-> {family, style} mapping. No I/O, no strapi.

const toLabel = (key) =>
  String(key)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// CSS class prefixes for the stored value (rendering uses inline SVG paths).
const FAMILY_PREFIX = { classic: '' };
const STYLE_PREFIX = {
  solid: 'fa-solid',
  regular: 'fa-regular',
  light: 'fa-light',
  thin: 'fa-thin',
  brands: 'fa-brands',
  duotone: 'fa-duotone',
  semibold: 'fa-semibold',
};

const familyToEnum = (family) => family.toUpperCase().replace(/-/g, '_');
const styleToEnum = (style) => style.toUpperCase().replace(/-/g, '_');

const classPrefix = (family, style) => {
  const fam = family in FAMILY_PREFIX ? FAMILY_PREFIX[family] : `fa-${family}`;
  const st = STYLE_PREFIX[style] || `fa-${style}`;
  return [fam, st].filter(Boolean).join(' ');
};

const packageId = (family, style) => `${family}-${style}`;
const packageLabel = (family, style) => `${toLabel(family)} ${toLabel(style)}`.trim();

// Style is always the last segment; family is the rest (may contain hyphens).
const splitPackage = (id) => {
  const i = String(id).lastIndexOf('-');
  return i === -1
    ? { family: id, style: 'solid' }
    : { family: id.slice(0, i), style: id.slice(i + 1) };
};

module.exports = {
  toLabel,
  FAMILY_PREFIX,
  STYLE_PREFIX,
  familyToEnum,
  styleToEnum,
  classPrefix,
  packageId,
  packageLabel,
  splitPackage,
};
