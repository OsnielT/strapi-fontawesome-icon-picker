'use strict';

const fs = require('fs');
const { classPrefix, packageId, packageLabel } = require('./naming');

/**
 * Token-less fallback: the free icon set bundled with @fortawesome/fontawesome-free
 * (Classic Solid, Classic Regular, Brands). Used when FONTAWESOME_API_TOKEN is not
 * set, so the plugin works out of the box. Parsed lazily, once.
 */
/* eslint-disable import/no-extraneous-dependencies */
const familiesPath = require.resolve('@fortawesome/fontawesome-free/metadata/icon-families.json');
const { version: FREE_VERSION } = require('@fortawesome/fontawesome-free/package.json');
/* eslint-enable import/no-extraneous-dependencies */

let byPackage = null;
const load = () => {
  if (byPackage) return byPackage;
  byPackage = {};
  const families = JSON.parse(fs.readFileSync(familiesPath, 'utf8'));
  for (const [name, icon] of Object.entries(families)) {
    for (const { family, style } of (icon.familyStylesByLicense && icon.familyStylesByLicense.free) || []) {
      const svg = icon.svgs && icon.svgs[family] && icon.svgs[family][style];
      if (!svg || !svg.path) continue;
      const prefix = classPrefix(family, style);
      const pkg = (byPackage[packageId(family, style)] ||= {});
      pkg[name] = {
        id: `${prefix} fa-${name}`,
        name,
        label: icon.label || name,
        family,
        style,
        prefix,
        width: svg.width || 512,
        height: svg.height || 512,
        path: svg.path,
      };
    }
  }
  return byPackage;
};

const listFreeStyles = () =>
  Object.keys(load()).map((id) => {
    const { family, style } = Object.values(byPackage[id])[0];
    return { id, label: packageLabel(family, style), family, style };
  });

const getFreeStyleIcons = (family, style) => load()[packageId(family, style)] || {};

module.exports = { FREE_VERSION, listFreeStyles, getFreeStyleIcons };
