---
name: flat-dumpling
description: >
  Reference for @walkal0ne/flat-dumpling — an Astro integration for explicit
  file-based i18n routing via pages/[lang]/*.astro. Use this skill whenever
  working on a project that has flat-dumpling installed, especially when
  creating or editing [lang] pages, using virtual:flat-dumpling/* modules,
  generating static paths for localized routes, or building locale-aware links.
  Also use when the user asks how to add a new language page, set up i18n
  routing, or use Dumpling / locatePath / withLangPaths.
---

このプロジェクトは `@walkal0ne/flat-dumpling` を使った多言語ルーティングを採用しています。
`[lang]` ページを作成・編集する際は必ずこのファイルを参照してください。

## 概要

- デフォルト言語（`ja`）のページは `src/pages/*.astro` にそのまま置く
- 他言語（`en`, `fr` など）は `src/pages/[lang]/*.astro` に明示的に作成する
- `[lang]` ページはデフォルト言語ページをコンポーネントとして import して描画する

設定は `astro.config.mjs` の integration を確認すること：

```js
flatDumpling({
  defaultLang: 'ja',
  locales: ['ja', 'en', 'fr'],
})
```

## [lang] ページのテンプレート

### 基本（動的パラメータが `[lang]` のみ）

```astro
---
import DefaultLangPage from 'virtual:flat-dumpling/default-page';
export { getStaticPaths } from 'virtual:flat-dumpling/static-paths';
---
<DefaultLangPage />
```

### 複合動的パラメータ（`[lang]` + `[id]` など）

```astro
---
import DefaultLangPage from 'virtual:flat-dumpling/default-page';
import { withLangPaths } from 'virtual:flat-dumpling/static-paths';

export async function getStaticPaths() {
  const items = [/* CMS などから取得 */];
  return withLangPaths(items.map((item) => ({ params: { id: item.id } })));
}
---
<DefaultLangPage />
```

## virtual モジュール

### `virtual:flat-dumpling/default-page`

インポートしたファイルのパスから `/[lang]/` を除いたデフォルト言語ページを返す。

- `src/pages/[lang]/about.astro` → `src/pages/about.astro`
- `src/pages/[lang]/works/[id].astro` → `src/pages/works/[id].astro`

`<DefaultLangPage />` はデフォルト言語ページを Layout ごとそのまま描画する。

props を渡すとデフォルト言語ページの `Astro.props` に届く。
デフォルト言語ページが `<Layout {...Astro.props}>` としていれば Layout まで props が流れる。

```astro
<DefaultLangPage title="About (EN)" />
```

### `virtual:flat-dumpling/static-paths`

#### `getStaticPaths()`

`[lang]` のみの動的ページで使う。デフォルト言語以外のロケールを返す。

#### `withLangPaths(paths)`

`[lang]` + 他パラメータの組み合わせを生成する。

```js
withLangPaths([
  { params: { id: 'foo' } },
  { params: { id: 'bar' } },
])
// → [
//   { params: { lang: 'en', id: 'foo' } },
//   { params: { lang: 'en', id: 'bar' } },
//   { params: { lang: 'fr', id: 'foo' } },
//   { params: { lang: 'fr', id: 'bar' } },
// ]
```

### `virtual:flat-dumpling/dumpling`

ロケール対応リンク生成と設定取得をまとめたクラス。

```astro
---
import Dumpling from 'virtual:flat-dumpling/dumpling';
const dumpling = new Dumpling(Astro);
---
<a href={dumpling.locatePath('/about')}>About</a>
<!-- ja → /about, en → /en/about -->

<!-- dumpling.locales     → ['ja', 'en', 'fr'] -->
<!-- dumpling.defaultLang → 'ja' -->
```

## ファイル構成ルール

- `src/pages/[lang]/` 以下のファイルは対応するデフォルト言語ページと **同じパス構造** にする
- デフォルト言語ページ（`src/pages/*.astro`）は変更しない
- `[lang]` ページに独自の Layout は書かない（デフォルト言語ページの Layout をそのまま使う）

## よくある間違い

**NG: `[lang]` ページに Layout を重ねる**
```astro
<!-- デフォルト言語ページにも Layout があるので二重になる -->
<Layout>
  <DefaultLangPage />
</Layout>
```

**OK: `<DefaultLangPage />` だけ書く**
```astro
<DefaultLangPage />
```
