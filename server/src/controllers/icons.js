'use strict';

const { PLUGIN_ID } = require('../pluginId');

module.exports = ({ strapi }) => {
  const service = () => strapi.plugin(PLUGIN_ID).service('fontawesome');
  const clampStr = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const noStore = (ctx) => ctx.set('Cache-Control', 'no-store');

  return {
    // ---- settings page ----
    async kits(ctx) {
      noStore(ctx);
      ctx.body = await service().listKits();
    },
    async familyStyles(ctx) {
      noStore(ctx);
      ctx.body = await service().listFamilyStyles(clampStr(ctx.query.version, 10) || undefined);
    },
    async getSettings(ctx) {
      noStore(ctx);
      ctx.body = await service().getSettings();
    },
    async saveSettings(ctx) {
      noStore(ctx);
      const body = (ctx.request && ctx.request.body) || {};
      const patch = {};
      if (typeof body.kitToken === 'string') patch.kitToken = body.kitToken.slice(0, 64);
      if (typeof body.version === 'string') patch.version = body.version.slice(0, 10);
      if (Array.isArray(body.enabledStyles)) {
        patch.enabledStyles = body.enabledStyles.filter((s) => typeof s === 'string').slice(0, 60);
      }
      ctx.body = await service().saveSettings(patch);
    },
    async clearCache(ctx) {
      noStore(ctx);
      ctx.body = await service().clearCache();
    },

    // ---- picker ----
    async packages(ctx) {
      noStore(ctx);
      ctx.body = await service().listPackages();
    },
    async browse(ctx) {
      noStore(ctx);
      ctx.body = await service().browse(clampStr(ctx.query.package, 40));
    },
    async find(ctx) {
      noStore(ctx);
      ctx.body = await service().search({
        q: clampStr(ctx.query.q, 100),
        package: clampStr(ctx.query.package, 40),
      });
    },
    async resolve(ctx) {
      noStore(ctx);
      ctx.body = await service().resolve(clampStr(ctx.query.id, 200));
    },
    async catalogVersion(ctx) {
      noStore(ctx);
      ctx.body = { version: await service().catalogVersion() };
    },
    async status(ctx) {
      noStore(ctx);
      ctx.body = await service().getStatus();
    },
  };
};
