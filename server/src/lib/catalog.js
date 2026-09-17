'use strict';

const { PLUGIN_ID } = require('../pluginId');
const naming = require('./naming');

const { classPrefix, familyToEnum, styleToEnum, packageId, packageLabel, STYLE_PREFIX } = naming;

/**
 * Data layer over the Font Awesome API + DB cache: kit/family listing, paginated
 * per-style icon fetch (cached in the core store), single-icon resolve, and
 * cache clearing. Deps: { gql, getConfig, store, strapi }.
 */
const createCatalog = ({ gql, getConfig, store, strapi }) => {
  const listKits = async () => {
    const data = await gql('{ me { kits { token name version } } }');
    return ((data.me && data.me.kits) || []).map((k) => ({
      token: k.token,
      name: k.name,
      version: k.version,
    }));
  };

  const listFamilyStyles = async (version) => {
    const data = await gql('query($v:String!){ release(version:$v){ familyStyles { family style } } }', {
      v: version,
    });
    const list = (data.release && data.release.familyStyles) || [];
    return list.map(({ family, style }) => ({
      id: packageId(family, style),
      label: packageLabel(family, style),
      family,
      style,
    }));
  };

  const cacheKeyFor = (version, family, style) => `cache:${version}:${family}:${style}`;

  // Enumerate all icons for one family/style (paginated, limited concurrency).
  const fetchStyleFromApi = async (version, family, style) => {
    const { pageSize, concurrency } = getConfig();
    const prefix = classPrefix(family, style);
    const query = `query($v:String!,$page:Int!,$size:Int!){
      release(version:$v){
        iconsPaginated(license: ANY, page:$page, pageSize:$size){
          totalPageCount
          icons{ id label svgs(filter:{ familyStyles:[{ family:${familyToEnum(family)}, style:${styleToEnum(style)} }] }){ width height pathData } }
        }
      }
    }`;

    const byName = {};
    const collect = (icons) => {
      (icons || []).forEach((ic) => {
        const svg = ic.svgs && ic.svgs[0];
        if (!svg || !svg.pathData) return;
        byName[ic.id] = {
          id: `${prefix} fa-${ic.id}`,
          name: ic.id,
          label: ic.label || ic.id,
          family,
          style,
          prefix,
          width: svg.width || 512,
          height: svg.height || 512,
          path: svg.pathData,
        };
      });
    };

    const first = await gql(query, { v: version, page: 1, size: pageSize });
    const paged = first.release.iconsPaginated;
    collect(paged.icons);
    const totalPages = paged.totalPageCount || 1;

    let page = 2;
    const worker = async () => {
      for (;;) {
        const p = page;
        page += 1;
        if (p > totalPages) return;
        const d = await gql(query, { v: version, page: p, size: pageSize });
        collect(d.release.iconsPaginated.icons);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, totalPages - 1) }, worker));

    return byName;
  };

  // Cached wrapper around fetchStyleFromApi.
  const getStyleIcons = async (version, family, style) => {
    const key = cacheKeyFor(version, family, style);
    const cached = await store.get({ key });
    if (cached && Object.keys(cached).length) return cached;
    const byName = await fetchStyleFromApi(version, family, style);
    if (Object.keys(byName).length) await store.set({ key, value: byName });
    return byName;
  };

  // Resolve a single stored value (class id / bare name / JSON) to icon data.
  const resolve = async (version, value) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    let name;
    let family = 'classic';
    let style = 'solid';

    if (trimmed.startsWith('{')) {
      try {
        const o = JSON.parse(trimmed);
        name = o.name;
        family = o.family || 'classic';
        style = o.style || 'solid';
      } catch {
        return null;
      }
    } else if (trimmed.includes(' ')) {
      const tokens = trimmed.split(/\s+/);
      name = tokens[tokens.length - 1].replace(/^fa-/, '');
      tokens.slice(0, -1).forEach((tk) => {
        const t = tk.replace(/^fa-/, '');
        if (STYLE_PREFIX[t]) style = t;
        else if (t) family = t;
      });
    } else {
      name = trimmed.replace(/^fa-/, '');
    }
    if (!name) return null;

    try {
      const data = await gql(
        `query($v:String!,$n:String!){ release(version:$v){ icon(name:$n){ id label svgs(filter:{ familyStyles:[{ family:${familyToEnum(family)}, style:${styleToEnum(style)} }] }){ width height pathData } } } }`,
        { v: version, n: name }
      );
      const icon = data.release && data.release.icon;
      const svg = icon && icon.svgs && icon.svgs[0];
      if (!svg || !svg.pathData) return null;
      const prefix = classPrefix(family, style);
      return {
        id: `${prefix} fa-${name}`,
        name,
        label: icon.label || name,
        family,
        style,
        prefix,
        width: svg.width || 512,
        height: svg.height || 512,
        path: svg.pathData,
      };
    } catch {
      return null;
    }
  };

  // Remove all cached style payloads from the core store.
  const clearCache = async () => {
    const deleted = await strapi.db.query('strapi::core-store').deleteMany({
      where: { key: { $startsWith: `plugin_${PLUGIN_ID}_cache:` } },
    });
    return { cleared: (deleted && deleted.count) || 0 };
  };

  return { listKits, listFamilyStyles, getStyleIcons, resolve, clearCache };
};

module.exports = { createCatalog };
