'use strict';

/**
 * Admin-only routes. `type: 'admin'` + isAuthenticatedAdmin ensures only
 * logged-in admin users reach these. The API token is never exposed.
 */
const admin = (method, path, handler) => ({
  method,
  path,
  handler,
  config: { policies: ['admin::isAuthenticatedAdmin'] },
});

module.exports = {
  admin: {
    type: 'admin',
    routes: [
      // settings page
      admin('GET', '/kits', 'icons.kits'),
      admin('GET', '/family-styles', 'icons.familyStyles'),
      admin('GET', '/settings', 'icons.getSettings'),
      admin('PUT', '/settings', 'icons.saveSettings'),
      admin('POST', '/clear-cache', 'icons.clearCache'),
      // picker
      admin('GET', '/packages', 'icons.packages'),
      admin('GET', '/categories', 'icons.browse'),
      admin('GET', '/icons', 'icons.find'),
      admin('GET', '/resolve', 'icons.resolve'),
      admin('GET', '/catalog-version', 'icons.catalogVersion'),
      admin('GET', '/status', 'icons.status'),
    ],
  },
  // Public server-to-server resolve, for a BFF/backend to back-fill an icon's
  // SVG (width/height/path) for values stored without it. Returns only public
  // icon geometry — never the API token or account data — so it is unauthenticated.
  'content-api': {
    type: 'content-api',
    routes: [{ method: 'GET', path: '/resolve', handler: 'icons.resolve', config: { auth: false } }],
  },
};
