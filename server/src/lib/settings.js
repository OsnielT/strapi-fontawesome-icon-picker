'use strict';

// Persisted, non-secret plugin settings (selected kit, version, enabled styles).
const DEFAULT_SETTINGS = { kitToken: null, version: '7.x', enabledStyles: ['classic-solid'] };

const createSettings = ({ store }) => {
  const get = async () => {
    const saved = (await store.get({ key: 'settings' })) || {};
    return { ...DEFAULT_SETTINGS, ...saved };
  };
  const save = async (patch) => {
    const next = { ...(await get()), ...patch };
    await store.set({ key: 'settings', value: next });
    return next;
  };
  return { get, save };
};

module.exports = { createSettings, DEFAULT_SETTINGS };
