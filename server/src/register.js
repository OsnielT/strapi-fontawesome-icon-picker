'use strict';

const { PLUGIN_ID } = require('./pluginId');

/**
 * Register the custom field on the server. The stored value is a string such as
 * "fa-solid fa-user" (a text-based custom field).
 */
module.exports = ({ strapi }) => {
  strapi.customFields.register({
    name: 'icon',
    plugin: PLUGIN_ID,
    type: 'string',
    inputSize: {
      // Full row (12/12 columns) so the picker button spans the form width.
      // Still resizable, so editors can shrink it in the Content-Type Builder.
      default: 12,
      isResizable: true,
    },
  });
};
