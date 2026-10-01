# strapi-plugin-fontawesome-icon

A **Strapi v5** custom field for picking [Font Awesome](https://fontawesome.com) icons — with an Apple‑style picker (search, categories, and Family → Variant → Weight selectors), every Font Awesome family your account is licensed for, and aggressive caching to keep API/bandwidth usage low.

> Icons are fetched from the **Font Awesome GraphQL API** and rendered as inline SVG. Nothing gigabyte‑sized is installed, and the API token stays on the server.

---

## Features

- **Custom field** `Font Awesome icon` — appears under **Custom** in the Content‑Type Builder.
- **Every licensed family** via the API: Classic, Sharp, Duotone, Sharp Duotone, and (on Pro+) Chisel, Etch, Graphite, Jelly, Notdog, Pixel, Slab, Thumbprint, Whiteboard, and more.
- **Emoji‑style picker:** search, categorized browse with sticky headers, and a bottom category jump‑bar.
- **Family → Variant → Weight** dropdowns that render **1–3 controls** depending on what the selected pack offers (e.g. Classic → Standard/Duotone → Solid/Regular/Light/Thin; Jelly → Standard/Duo/Fill).
- **Configurable output** per field: store a **name** (`user`), **name + type** (`fa-solid fa-user`), or a **full JSON object**.
- **Settings page:** pick which **kit** and which **packages** are available, and **clear the cache**.
- **Caching everywhere:** per‑style results are cached in the database (server) and in IndexedDB (browser, persists across sessions), so each style is fetched at most once per version.
- **Remembers** the last Family/Variant/Weight the editor used.

---

## Requirements

- **Strapi v5** (tested on 5.50+).
- **Node 18+** (uses the global `fetch`).
- A **Font Awesome API token** — see below. A Free account token shows the free families; **Pro / Pro+** tokens unlock the Pro and Pro+ families.

---

## Install

```bash
npm install strapi-plugin-fontawesome-icon
# or
yarn add strapi-plugin-fontawesome-icon
```

No private registry or npm auth token is required to install — the only Font Awesome dependency is the public `@fortawesome/fontawesome-free` package (used for category names only).

---

## Configure

**1. Create a Font Awesome API token**

In your Font Awesome account → **Account → API tokens**, create a token with the `svg_icons` (or `svg_icons_pro`) and `kits_read` scopes.

**2. Add it to your environment** (server only — never commit it):

```bash
# .env
FONTAWESOME_API_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**3. Enable the plugin** in `config/plugins.ts` (or `.js`):

```ts
export default ({ env }) => ({
  'fontawesome-icon': {
    enabled: true,
    config: {
      // Secret — read from the environment, never hard‑coded.
      apiToken: env('FONTAWESOME_API_TOKEN'),
    },
  },
});
```

Optional advanced config (sensible defaults shown):

```ts
config: {
  apiToken: env('FONTAWESOME_API_TOKEN'),
  apiUrl: 'https://api.fontawesome.com', // API base
  pageSize: 250,                          // icons fetched per API request
  concurrency: 5,                         // parallel pages when loading a style
}
```

Restart Strapi after configuring.

---

## Usage

1. **Content‑Type Builder** → add a field → **Custom** tab → **Font Awesome icon**.
2. In the field's **Base settings**, choose the **Stored value format**:
   | Format | Example stored value |
   | --- | --- |
   | Name only | `user` |
   | Name + type *(default)* | `fa-solid fa-user` |
   | Full detail object | `{"name":"user","family":"classic","style":"solid","prefix":"fa-solid","id":"fa-solid fa-user","label":"User","width":448,"height":512,"path":"M224 256A128 128…"}` |

   The **object** format includes the SVG geometry (`width`/`height`/`path`; `path` is a string, or `[secondary, primary]` for duotone), so consumers can render an inline `<svg>` with **no Font Awesome runtime** — no packages, no Kit, no CDN.
3. **Settings → Font Awesome:** pick your **kit** (sets the Font Awesome version and available packages) and the **packages** you want editors to use. Fewer packages = cleaner UI and less bandwidth.
4. In an entry, click the field to open the picker, choose an icon, and save.

Render it in your frontend however you already use Font Awesome, e.g.:

```html
<i class="fa-solid fa-user"></i>
```

(or reconstruct the class from the stored `name`/object).

---

## How icons are sourced (and why it's light on bandwidth)

Font Awesome's Pro/Pro+ npm packages are **1 GB+**, which burns your **Package Bandwidth** on every CI build. This plugin avoids that entirely:

- Icon **paths are fetched from the GraphQL API**, one **style at a time, on demand**, and only for the **packages you enable**.
- Results are cached in the **database** (server) and **IndexedDB** (browser), keyed by version — so a style is fetched **once** and reused thereafter.
- Use **Clear cache** on the settings page to force a refresh (e.g. after changing kit contents).

---

## Server‑to‑server resolve endpoint

A **public** content‑API route lets a backend (e.g. a BFF) look up a single icon's SVG — useful to **back‑fill** the geometry for values that were stored without it (older entries, or fields using the `name`/`name + type` output):

```
GET {STRAPI_URL}/api/fontawesome-icon/resolve?id=<class or name>

# examples
GET /api/fontawesome-icon/resolve?id=user
GET /api/fontawesome-icon/resolve?id=fa-jelly-duo%20fa-regular%20fa-user

→ 200 { "id", "name", "label", "family", "style", "prefix", "width", "height", "path" }
#   path is a string, or [secondary, primary] for duotone
```

Notes:
- It returns **only public icon geometry** — never the API token or account data — so it is **unauthenticated** (`auth: false`). The secret `FONTAWESOME_API_TOKEN` stays server‑side.
- It checks the server‑side style cache first (populated when editors browse a package); only icons not yet cached are fetched from the Font Awesome API.
- Input is validated before any query is built, so the public route can't inject GraphQL.
- All other routes are admin‑only (`admin::isAuthenticatedAdmin`); this is the single intentionally public one.

---

## Security

- The API token is read **only** from `FONTAWESOME_API_TOKEN` on the server. It is **never** stored in the database, returned to the admin panel, or exposed to the content API.
- **All** Font Awesome API calls happen server‑side. Admin routes are gated by `admin::isAuthenticatedAdmin`; the only public route is `/api/fontawesome-icon/resolve` (see above), which returns non‑secret icon geometry only.
- Persisted settings (selected kit, enabled packages) are **non‑secret** and stored in Strapi's core store.

---

## Development

```bash
npm install
npm run build       # build to dist/
npm run watch       # rebuild on change
npm run verify      # validate the plugin package
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the code layout.

---

## Issues & support

Found a bug or have a feature request? [Open an issue](https://github.com/OsnielT/strapi-fontawesome-icon-picker/issues) with your Strapi version, plugin version, and steps to reproduce. Please report security issues privately via GitHub's **Report a vulnerability** on the Security tab rather than a public issue.

---

## License

[MIT](./LICENSE)
