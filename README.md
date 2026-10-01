# Font Awesome Icon Picker for Strapi

[![npm version](https://img.shields.io/npm/v/strapi-plugin-fontawesome-icon.svg)](https://www.npmjs.com/package/strapi-plugin-fontawesome-icon)
[![npm downloads](https://img.shields.io/npm/dm/strapi-plugin-fontawesome-icon.svg)](https://www.npmjs.com/package/strapi-plugin-fontawesome-icon)
[![license](https://img.shields.io/npm/l/strapi-plugin-fontawesome-icon.svg)](./LICENSE)
[![Strapi v5](https://img.shields.io/badge/Strapi-v5-4945ff.svg)](https://strapi.io)

A Strapi v5 custom field for picking [Font Awesome](https://fontawesome.com) icons. Editors get a searchable, categorized picker; your frontend gets a class name or ready-to-render SVG data.

Works out of the box with the free icon set. Add a Font Awesome API token to unlock your kits and every Pro / Pro+ family your account is licensed for.

## Table of contents

- [Features](#features)
- [Compatibility](#compatibility)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Stored value formats](#stored-value-formats)
- [Rendering icons in your frontend](#rendering-icons-in-your-frontend)
- [Resolve endpoint](#resolve-endpoint)
- [Caching](#caching)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Features

- **Custom field** — adds a *Font Awesome icon* field under the **Custom** tab of the Content-Type Builder.
- **No setup required** — ships with the free icons (Classic Solid, Classic Regular, Brands). No account or token needed.
- **Pro and Pro+ support** — with an API token, browse every family your plan includes: Classic, Sharp, Duotone, Sharp Duotone, and Pro+ families such as Chisel, Jelly, Slab, Whiteboard and more.
- **Fast picker** — search, categories with sticky headers, a category jump bar, and Family → Variant → Weight selectors that adapt to each package.
- **Flexible output** — store a name (`user`), a class string (`fa-solid fa-user`), or a JSON object with the SVG geometry.
- **Admin settings** — choose the kit and which packages editors can use, and clear the cache.
- **Light on bandwidth** — no gigabyte-sized Pro packages; icons load one style at a time and are cached in the database and the browser.
- **Secure by default** — the API token stays on the server and is never stored or sent to the browser.

## Compatibility

| Plugin | Strapi | Node.js |
| --- | --- | --- |
| 0.x | 5.x | 18 – 22 |

## Installation

```bash
# npm
npm install strapi-plugin-fontawesome-icon

# yarn
yarn add strapi-plugin-fontawesome-icon
```

Restart Strapi (`npm run develop`). For production, rebuild the admin panel with `npm run build`.

No private registry or Font Awesome npm token is required — the only Font Awesome dependency is the public `@fortawesome/fontawesome-free` package.

## Configuration

### Free icons (default)

Nothing to configure. Without an API token, the picker serves the free icon set bundled with the plugin and makes no external requests.

### Pro icons and kits

1. In your Font Awesome account, go to **Account → API Tokens** and create a token with the `svg_icons` (or `svg_icons_pro`) and `kits_read` scopes.
2. Add it to your server environment. Never commit it.

   ```bash
   # .env
   FONTAWESOME_API_TOKEN=your-token
   ```

3. Restart Strapi, then open **Settings → Font Awesome** to choose your kit and the packages editors can use.

### Plugin options

The defaults work for most projects. To override them, add the plugin to `config/plugins.ts` (or `.js`):

```ts
export default ({ env }) => ({
  'fontawesome-icon': {
    config: {
      apiToken: env('FONTAWESOME_API_TOKEN'),
      pageSize: 250,
      concurrency: 5,
    },
  },
});
```

| Option | Default | Description |
| --- | --- | --- |
| `apiToken` | `process.env.FONTAWESOME_API_TOKEN` | Font Awesome API token. Leave unset to use the free icon set. |
| `apiUrl` | `https://api.fontawesome.com` | Font Awesome API base URL. |
| `pageSize` | `250` | Icons fetched per API request when loading a style. |
| `concurrency` | `5` | Parallel requests when loading a style. |

## Usage

1. **Add the field** — in the Content-Type Builder, add a field, open the **Custom** tab and choose **Font Awesome icon**.
2. **Choose the stored format** — in the field's **Base settings**, pick a **Stored value format** (see [below](#stored-value-formats)).
3. **Pick packages** — in **Settings → Font Awesome**, select which packages appear in the picker. Fewer packages means a cleaner picker and less data to load.
4. **Pick an icon** — in any entry, click the field, search or browse, and select an icon. The picker remembers the last family, variant and weight each editor used.

## Stored value formats

| Format | Example | Best for |
| --- | --- | --- |
| Name only | `user` | Your own icon mapping or component library |
| Name + type *(default)* | `fa-solid fa-user` | Frontends that load Font Awesome CSS or a Kit |
| Full detail object | `{"name":"user","family":"classic","style":"solid","prefix":"fa-solid","id":"fa-solid fa-user","label":"User","width":448,"height":512,"path":"M224 256A128…"}` | Rendering inline SVG with no Font Awesome runtime |

The field is stored as text, so the object format arrives in API responses as a JSON string. `path` is a string, or a `[secondary, primary]` array for duotone icons.

## Rendering icons in your frontend

**With Font Awesome CSS or a Kit** (name + type format):

```html
<i class="fa-solid fa-user" aria-hidden="true"></i>
```

**As inline SVG** (full detail object format), with no Font Awesome dependency. A React example:

```jsx
export function FaIcon({ value, title, ...props }) {
  const icon = typeof value === 'string' ? JSON.parse(value) : value;
  const paths = Array.isArray(icon.path) ? icon.path : [icon.path];

  return (
    <svg
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      width="1em"
      height="1em"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {paths.map((d, i) => (
        // Duotone: the first path is the secondary layer.
        <path key={i} d={d} opacity={paths.length > 1 && i === 0 ? 0.4 : 1} />
      ))}
    </svg>
  );
}
```

## Resolve endpoint

A public, read-only route returns the SVG data for a single icon. Use it to back-fill geometry for values stored as a name or class string.

```http
GET /api/fontawesome-icon/resolve?id=fa-solid%20fa-user
```

```json
{
  "id": "fa-solid fa-user",
  "name": "user",
  "label": "User",
  "family": "classic",
  "style": "solid",
  "prefix": "fa-solid",
  "width": 448,
  "height": 512,
  "path": "M224 256A128 128 0 1 0 224 0a128…"
}
```

`id` accepts a name (`user`, defaults to Classic Solid) or a class string (`fa-sharp fa-solid fa-user`). Unknown icons return `204 No Content`.

The route returns only public icon geometry — never the token or account data. It checks the server cache first and only calls the Font Awesome API for icons not yet cached. Without a token, it serves the bundled free icons.

## Caching

- **Server** — each style is fetched from the API once and cached in Strapi's database.
- **Browser** — loaded packages are cached in IndexedDB and persist across sessions.
- **Invalidation** — both caches are keyed by Font Awesome version. Use **Settings → Font Awesome → Clear cache** to force a refresh, for example after changing your kit.

## Security

- The API token is read only from the server environment. It is never stored in the database, returned to the admin panel, or exposed through the content API.
- All Font Awesome API calls happen on the server.
- Every admin route requires an authenticated admin user. The only public route is the read-only [resolve endpoint](#resolve-endpoint), and its input is validated before any query is built.
- Saved settings (kit and enabled packages) contain no secrets.

Found a vulnerability? Please report it privately via [GitHub security advisories](https://github.com/OsnielT/strapi-fontawesome-icon-picker/security/advisories/new) rather than opening a public issue.

## Troubleshooting

**The picker only shows Classic Solid, Regular and Brands.**
No API token is configured, so the free set is in use. Set `FONTAWESOME_API_TOKEN` and restart Strapi.

**Pro families are missing after adding a token.**
Enable them in **Settings → Font Awesome**, and check that the token has the `svg_icons_pro` and `kits_read` scopes.

**Icons are out of date after changing my kit.**
Click **Clear cache** in **Settings → Font Awesome**.

**`value too long for type character varying(255)` on PostgreSQL.**
Fields created by versions before 0.2.1 used a `varchar(255)` column. The plugin converts these columns to `text` on startup — upgrade and restart Strapi.

## Contributing

Contributions are welcome. Please open an issue to discuss larger changes first.

```bash
git clone https://github.com/OsnielT/strapi-fontawesome-icon-picker.git
cd strapi-fontawesome-icon-picker
npm install
npm run watch:link   # develop against a local Strapi app
npm run build        # build to dist/
npm run verify       # validate the plugin package
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the code layout.

## Support

- **Bugs and feature requests** — [open an issue](https://github.com/OsnielT/strapi-fontawesome-icon-picker/issues) with your Strapi version, plugin version and steps to reproduce.
- **Security issues** — see [Security](#security).

## License

[MIT](./LICENSE) © Osniel Torres

Font Awesome is a trademark of Fonticons, Inc. This plugin is not affiliated with or endorsed by Fonticons, Inc. or Strapi. Icons are subject to the [Font Awesome license](https://fontawesome.com/license).
