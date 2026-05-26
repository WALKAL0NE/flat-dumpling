# @walkal0ne/flat-dumpling

Astro integration for explicit file-based i18n routing.

Instead of auto-generating localized routes, you place `pages/[lang]/*.astro` files manually and use virtual modules to proxy the default-language page content and generate static paths.

## Install

```bash
npm install @walkal0ne/flat-dumpling
```

## Setup

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import flatDumpling from '@walkal0ne/flat-dumpling';

export default defineConfig({
  integrations: [
    flatDumpling({
      defaultLang: 'ja',        // served without URL prefix
      locales: ['ja', 'en', 'fr'],
    }),
  ],
});
```

No need to add `i18n` to your Astro config manually — the integration injects it automatically.

## File structure

```
src/pages/
├── index.astro           → /
├── about.astro           → /about
├── works/
│   ├── index.astro       → /works
│   └── [id].astro        → /works/[id]
└── [lang]/
    ├── index.astro       → /en,  /fr
    ├── about.astro       → /en/about,  /fr/about
    └── works/
        ├── index.astro   → /en/works,  /fr/works
        └── [id].astro    → /en/works/[id],  /fr/works/[id]
```

Default-language pages (`ja`) are served as-is. Non-default locales are handled by `[lang]/*.astro` files you create explicitly.

## Usage

### Basic page

```astro
---
// src/pages/[lang]/about.astro
import DefaultLangPage from 'virtual:flat-dumpling/default-page';
export { getStaticPaths } from 'virtual:flat-dumpling/static-paths';
---
<DefaultLangPage />
```

`virtual:flat-dumpling/default-page` resolves to the corresponding default-language page by stripping `/[lang]/` from the importer path. `DefaultLangPage` renders the full page including its Layout.

### Page with additional dynamic params

Use `withLangPaths` when the page has more dynamic segments besides `[lang]`:

```astro
---
// src/pages/[lang]/works/[id].astro
import DefaultLangPage from 'virtual:flat-dumpling/default-page';
import { withLangPaths } from 'virtual:flat-dumpling/static-paths';

export async function getStaticPaths() {
  const ids = ['foo', 'bar', 'baz']; // fetch from CMS etc.
  return withLangPaths(ids.map((id) => ({ params: { id } })));
}
---
<DefaultLangPage />
```

### Locale-aware links / config

```astro
---
import Dumpling from 'virtual:flat-dumpling/dumpling';
const dumpling = new Dumpling(Astro);
---
<a href={dumpling.locatePath('/about')}>About</a>
<!-- ja → /about -->
<!-- en → /en/about -->

<!-- dumpling.locales     → ['ja', 'en', 'fr'] -->
<!-- dumpling.defaultLang → 'ja' -->
```

### Pass props to Layout

If the default-language page spreads `Astro.props` onto its Layout, you can override Layout props from the `[lang]` page:

```astro
<!-- src/pages/about.astro -->
---
import Layout from '@/layouts/Layout.astro';
---
<Layout {...Astro.props}>
  ...
</Layout>
```

```astro
<!-- src/pages/[lang]/about.astro -->
---
import DefaultLangPage from 'virtual:flat-dumpling/default-page';
export { getStaticPaths } from 'virtual:flat-dumpling/static-paths';
---
<DefaultLangPage title="About (EN)" />
```

## Virtual modules

| Module | Exports |
|---|---|
| `virtual:flat-dumpling/default-page` | `default` — the corresponding default-language page component |
| `virtual:flat-dumpling/static-paths` | `getStaticPaths`, `withLangPaths` |
| `virtual:flat-dumpling/dumpling` | `default` — `Dumpling` class (`locatePath`, `locales`, `defaultLang`) |

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultLang` | `string` | `'ja'` | Default language, served without URL prefix |
| `locales` | `string[]` | `['ja']` | All supported locales including the default |

## TypeScript

Types for virtual modules are bundled in `index.d.ts`. Add a reference in your `env.d.ts`:

```ts
/// <reference types="@walkal0ne/flat-dumpling" />
```

## License

MIT
