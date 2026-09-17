import { PLUGIN_ID } from '../pluginId';

// The persisted catalog is keyed by: a payload-schema tag we control + the
// bundled Font Awesome version reported by the server. On the first open of a
// session the client asks the server for that version; a CI/CD deploy that
// upgrades Font Awesome changes it, so every user's stale IndexedDB copy is
// invalidated and refetched once — no manual step. Bump SCHEMA only when the
// payload *shape* changes.
const SCHEMA = 's6';

const DB_NAME = 'strapi-plugin-fontawesome-icon';
const STORE = 'catalog';

const hasIDB = () => typeof indexedDB !== 'undefined';

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const withStore = async (mode, fn) => {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const result = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(result?.__value);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

const idbGet = (key) =>
  withStore('readonly', (store) => {
    const req = store.get(key);
    const box = {};
    req.onsuccess = () => {
      box.__value = req.result;
    };
    return box;
  });

const idbSet = (key, value) =>
  withStore('readwrite', (store) => {
    store.put(value, key);
    return {};
  });

// Remove catalog entries that don't belong to the current schema+version
// (keepPrefix), keeping every package cached under the current version.
const purgeStaleVersions = (keepPrefix) =>
  withStore('readwrite', (store) => {
    const req = store.getAllKeys();
    req.onsuccess = () => {
      (req.result || []).forEach((k) => {
        if (typeof k === 'string' && k.startsWith('catalog:') && !k.startsWith(keepPrefix)) {
          store.delete(k);
        }
      });
    };
    return {};
  });

// A package payload is only usable if it has a non-empty icon dictionary and
// categories — an empty payload is a miss, never served/persisted.
const isValidPackage = (p) =>
  p &&
  p.icons &&
  Object.keys(p.icons).length > 0 &&
  Array.isArray(p.categories) &&
  p.categories.length > 0;

// Resolve the current catalog version once per session (tiny, always-fresh).
let versionPromise = null;
const getVersion = (get) => {
  if (versionPromise) return versionPromise;
  versionPromise = (async () => {
    try {
      const { data } = await get(`/${PLUGIN_ID}/catalog-version`);
      if (data && data.version) return String(data.version);
    } catch {
      // ignore
    }
    return 'unknown';
  })().catch(() => 'unknown');
  return versionPromise;
};

// The package list + default (small). Memoised per session.
let packagesPromise = null;
export const loadPackages = (get) => {
  if (packagesPromise) return packagesPromise;
  packagesPromise = (async () => {
    const { data } = await get(`/${PLUGIN_ID}/packages`);
    return {
      packages: Array.isArray(data && data.packages) ? data.packages : [],
      defaultPackage: (data && data.defaultPackage) || 'classic-solid',
    };
  })().catch((err) => {
    packagesPromise = null;
    throw err;
  });
  return packagesPromise;
};

// Per-package in-session cache so repeated opens don't re-read IndexedDB.
const packageMemory = new Map(); // packageId -> Promise<payload>

/**
 * Load one package's icon data: from IndexedDB if present (persists across
 * sessions / logout), otherwise fetch once and persist. Each package is cached
 * separately and keyed by catalog version. Returns { icons, categories }.
 */
export const loadPackage = (get, packageId) => {
  const id = packageId || 'classic-solid';
  if (packageMemory.has(id)) return packageMemory.get(id);

  const promise = (async () => {
    const version = await getVersion(get);
    const cacheKey = `catalog:${SCHEMA}-${version}-${id}`;

    if (hasIDB()) {
      try {
        const cached = await idbGet(cacheKey);
        if (isValidPackage(cached)) return cached;
      } catch {
        // fall through to network
      }
    }

    // Version + package in the query string bust any stale HTTP cache.
    const { data } = await get(
      `/${PLUGIN_ID}/categories?package=${encodeURIComponent(id)}&v=${encodeURIComponent(version)}`
    );
    const payload = isValidPackage(data) ? data : { icons: {}, categories: [] };

    if (hasIDB() && isValidPackage(payload)) {
      try {
        await purgeStaleVersions(`catalog:${SCHEMA}-${version}-`);
        await idbSet(cacheKey, payload);
      } catch {
        // best-effort; ignore quota/private-mode errors
      }
    }

    return payload;
  })().catch((err) => {
    packageMemory.delete(id); // allow retry
    throw err;
  });

  packageMemory.set(id, promise);
  return promise;
};
