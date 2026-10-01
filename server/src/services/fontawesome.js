'use strict';

const { PLUGIN_ID } = require('../pluginId');
const naming = require('../lib/naming');
const { buildCategories } = require('../lib/categories');
const { createApiClient } = require('../lib/apiClient');
const { createSettings } = require('../lib/settings');
const { createCatalog } = require('../lib/catalog');
const { FREE_VERSION } = require('../lib/freeIcons');

/**
 * Service facade. Composes the API client, settings store, and catalog, and
 * exposes the public methods the controller calls. Orchestration only — the
 * heavy lifting lives in ../lib/*.
 */
module.exports = ({ strapi }) => {
  const getConfig = () => strapi.config.get(`plugin::${PLUGIN_ID}`);
  const store = strapi.store({ type: 'plugin', name: PLUGIN_ID });

  const api = createApiClient({ getConfig });
  const settings = createSettings({ store });
  const catalog = createCatalog({ gql: api.gql, getConfig, store, strapi });

  // Pick the requested package, falling back to the first enabled one.
  const resolvePackageId = (enabledStyles, requested) =>
    enabledStyles.includes(requested) ? requested : enabledStyles[0] || 'classic-solid';

  return {
    // ---- settings page ----
    listKits: () => catalog.listKits(),
    async listFamilyStyles(version) {
      return catalog.listFamilyStyles(version || (await settings.get()).version);
    },
    getSettings: () => settings.get(),
    saveSettings: (patch) => settings.save(patch || {}),
    clearCache: () => catalog.clearCache(),

    // ---- picker ----
    async listPackages() {
      const { enabledStyles } = await settings.get();
      const packages = (enabledStyles || []).map((id) => {
        const { family, style } = naming.splitPackage(id);
        return {
          id,
          label: naming.packageLabel(family, style),
          family,
          style,
          familyLabel: naming.toLabel(family) || 'Classic',
          styleLabel: naming.toLabel(style),
        };
      });
      return { packages, defaultPackage: (packages[0] && packages[0].id) || 'classic-solid' };
    },

    async browse(requested) {
      const { version, enabledStyles } = await settings.get();
      const id = resolvePackageId(enabledStyles, requested);
      const { family, style } = naming.splitPackage(id);
      const byName = await catalog.getStyleIcons(version, family, style);
      return { package: id, icons: byName, categories: buildCategories(byName) };
    },

    async search({ q = '', package: requested } = {}) {
      const { version, enabledStyles } = await settings.get();
      const id = resolvePackageId(enabledStyles, requested);
      const { family, style } = naming.splitPackage(id);
      const byName = await catalog.getStyleIcons(version, family, style);
      const needle = q.trim().toLowerCase();
      const out = [];
      for (const icon of Object.values(byName)) {
        if (
          !needle ||
          icon.name.toLowerCase().includes(needle) ||
          icon.label.toLowerCase().includes(needle)
        ) {
          out.push(icon);
          if (out.length >= 100) break;
        }
      }
      return out;
    },

    async resolve(value) {
      const { version } = await settings.get();
      return catalog.resolve(version, value);
    },

    async catalogVersion() {
      // Distinct version so browsers drop the free set once a token is added.
      if (catalog.isFree()) return `free-${FREE_VERSION}`;
      return (await settings.get()).version || '7.x';
    },

    async getStatus() {
      const { apiToken } = getConfig();
      const s = await settings.get();
      return {
        hasToken: Boolean(apiToken),
        kitToken: s.kitToken,
        version: s.version,
        enabledStyles: s.enabledStyles,
      };
    },
  };
};
