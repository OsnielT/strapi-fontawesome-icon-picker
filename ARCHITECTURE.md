# Architecture

This plugin follows a clear separation of concerns on both the admin (React) and
server (Node) sides: **pure helpers**, **stateful/data modules**, and **thin
presentational or orchestration layers**.

```
strapi-plugin-fontawesome-icon/
├── admin/src/            # Admin panel (React)
│   ├── index.js          # registers the custom field + settings section
│   ├── pluginId.js
│   ├── components/
│   │   ├── IconPickerInput.jsx     # container: wires hooks → components
│   │   └── icon-picker/            # presentational components (UI only)
│   │       ├── FaSvg.jsx           # inline-SVG renderer (handles duotone)
│   │       ├── IconGrid.jsx        # grid of selectable icons (+ IconCell)
│   │       ├── PackageSelectors.jsx# Family → Variant → Weight dropdowns (1–3)
│   │       ├── PickerTrigger.jsx   # the field button (preview + caret)
│   │       └── PickerContent.jsx   # popover body (search, grid, nav, remove)
│   ├── hooks/                      # state, effects, data fetching
│   │   ├── usePackageSelection.js  # package list + base/variant/weight state
│   │   ├── useIconCatalog.js       # load selected package + debounced search
│   │   ├── useResolvedIcon.js      # resolve stored value → preview icon
│   │   ├── useScrollToSelected.js  # scroll-to-category on open
│   │   └── useTranslate.js         # namespaced i18n helper
│   ├── pages/
│   │   └── Settings.jsx            # kit + enabled-packages + clear cache
│   └── utils/                      # pure helpers (no React)
│       ├── iconFamily.js           # titleCase, splitFamily (base/variant)
│       ├── iconValue.js            # formatValue / parseStored (encode/decode)
│       └── iconCache.js            # IndexedDB persistence (per version+package)
│
└── server/src/           # Server (Strapi plugin API)
    ├── index.js          # exports register/config/controllers/routes/services
    ├── register.js       # registers the custom field (inputSize, type)
    ├── config/index.js   # reads FONTAWESOME_API_TOKEN + tunables from env
    ├── controllers/icons.js  # thin HTTP layer → service
    ├── routes/index.js   # admin-only routes (isAuthenticatedAdmin)
    ├── services/
    │   └── fontawesome.js # facade: composes lib/* and exposes the public API
    └── lib/              # single-responsibility modules
        ├── naming.js      # pure: labels, class prefixes, enum names, ids
        ├── categories.js  # bundled category metadata → buildCategories()
        ├── apiClient.js   # token exchange (cached) + gql()
        ├── settings.js    # persisted settings (get/save) over the core store
        └── catalog.js     # API + DB cache: kits, family-styles, fetch, resolve
```

## Admin: layers

- **utils/** — pure functions, no React, trivially unit-testable
  (family/variant parsing, value encode/decode, IndexedDB access).
- **hooks/** — own all state, effects, and network calls. Each hook has one
  concern (package selection, catalog loading + search, preview resolution,
  scroll). They consume Strapi's `useFetchClient` internally.
- **components/icon-picker/** — presentational, props in / events out. They hold
  no data-fetching logic.
- **components/IconPickerInput.jsx** — a thin container that calls the hooks and
  composes `PickerTrigger` + `PickerContent`.

Data flow: `IconPickerInput` → hooks (data) → presentational components (render).

## Server: layers

Each `lib/*` module is a **factory** that receives its dependencies, which keeps
them isolated and testable with fakes:

- **naming.js** — pure naming/id/enum helpers (no I/O).
- **categories.js** — loads the bundled `categories.yml` once; groups icons.
- **apiClient.js** — `createApiClient({ getConfig })`: exchanges the API token
  for a short‑lived access token (reused ~1h) and runs GraphQL queries. The only
  place the secret token is used.
- **settings.js** — `createSettings({ store })`: persisted, non‑secret settings.
- **catalog.js** — `createCatalog({ gql, getConfig, store, strapi })`: the data
  layer — kit/family listing, paginated per‑style fetch with a **DB cache**,
  single‑icon `resolve`, and `clearCache`.
- **services/fontawesome.js** — the **facade**: composes the modules and exposes
  `browse`, `search`, `listPackages`, `resolve`, `listKits`, `getSettings`,
  `saveSettings`, `clearCache`, `catalogVersion`, `getStatus`. Orchestration only.

## Caching model

| Layer | Where | Keyed by | Purpose |
| --- | --- | --- | --- |
| Access token | server memory | — | reuse the ~1h token, avoid re‑exchange |
| Per‑style icons | Strapi core store (DB) | `version:family:style` | fetch each style from the API once |
| Per‑package catalog | browser IndexedDB | `schema:version:package` | zero network on repeat opens / sessions |
| Last selection | browser localStorage | plugin key | remember the editor's Family/Weight |

## Request surface (admin‑only)

`GET /fontawesome-icon/…`: `kits`, `family-styles`, `settings` (`GET`/`PUT`),
`clear-cache` (`POST`), `packages`, `categories?package=`, `icons?q=&package=`,
`resolve?id=`, `catalog-version`, `status`. All are gated by
`admin::isAuthenticatedAdmin`.
