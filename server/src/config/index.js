'use strict';

/**
 * Plugin configuration.
 *
 * Icons are fetched from the Font Awesome GraphQL API (installing the 1GB+ Pro
 * packages is avoided to protect Package Bandwidth). The API token is a secret,
 * read only from the environment — never stored in the DB or sent to the browser.
 */
module.exports = {
  default: () => ({
    // Font Awesome API token (scopes: kits_read, svg_icons_pro). Secret.
    apiToken: process.env.FONTAWESOME_API_TOKEN || null,
    apiUrl: 'https://api.fontawesome.com',
    // Requests per page when enumerating a style, and how many pages to fetch
    // concurrently. Tuned to stay within API query-complexity limits.
    pageSize: 250,
    concurrency: 5,
  }),
};
