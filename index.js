const VIRTUAL_DEFAULT_PAGE = 'virtual:flat-dumpling/default-page';
const VIRTUAL_STATIC_PATHS = 'virtual:flat-dumpling/static-paths';
const VIRTUAL_HELPERS = 'virtual:flat-dumpling/helpers';
const VIRTUAL_CONFIG = 'virtual:flat-dumpling/config';
const VIRTUAL_DUMPLING = 'virtual:flat-dumpling/dumpling';

/**
 * Astro integration for explicit file-based i18n routing.
 *
 * Place localized pages at src/pages/[lang]/*.astro and use the virtual
 * modules to proxy the default-language page and generate static paths.
 *
 * @example
 * // astro.config.mjs
 * import flatDumpling from '@walkal0ne/flat-dumpling';
 * export default defineConfig({
 *   integrations: [
 *     flatDumpling({ defaultLang: 'ja', locales: ['ja', 'en', 'fr'] }),
 *   ],
 * });
 *
 * @example
 * // src/pages/[lang]/about.astro
 * ---
 * import DefaultLangPage from 'virtual:flat-dumpling/default-page';
 * export { getStaticPaths } from 'virtual:flat-dumpling/static-paths';
 * ---
 * <DefaultLangPage />
 *
 * @param {{ defaultLang?: string, locales?: string[] }} options
 * @returns {import('astro').AstroIntegration}
 */
export default function flatDumpling(options = {}) {
  const {
    defaultLang = 'ja',
    locales = ['ja'],
  } = options;

  const nonDefaultLocales = locales.filter((l) => l !== defaultLang);
  const config = { defaultLang, locales };

  return {
    name: '@walkal0ne/flat-dumpling',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          i18n: {
            defaultLocale: defaultLang,
            locales,
            routing: { prefixDefaultLocale: false },
          },
        });

        // virtual:default-page の解決先をパスではなく Map で管理する。
        // null byte + パスを ID に埋め込むと Astro ビルドが fs.stat に渡して失敗するため。
        const defaultPageMap = new Map();
        let seq = 0;

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'flat-dumpling-virtual',

                resolveId(id, importer) {
                  if (id === VIRTUAL_CONFIG) return '\0' + VIRTUAL_CONFIG;
                  if (id === VIRTUAL_HELPERS) return '\0' + VIRTUAL_HELPERS;
                  if (id === VIRTUAL_STATIC_PATHS) return '\0' + VIRTUAL_STATIC_PATHS;
                  if (id === VIRTUAL_DUMPLING) return '\0' + VIRTUAL_DUMPLING;

                  if (id === VIRTUAL_DEFAULT_PAGE) {
                    if (!importer) return null;
                    const defaultPath = importer.replace(/\\/g, '/').replace(/\/\[lang\]\//, '/');
                    for (const [key, val] of defaultPageMap) {
                      if (val === defaultPath) return key;
                    }
                    const key = `\0flat-dumpling-default:${seq++}`;
                    defaultPageMap.set(key, defaultPath);
                    return key;
                  }
                },

                load(id) {
                  if (id === '\0' + VIRTUAL_CONFIG) {
                    return `export default ${JSON.stringify(config)};`;
                  }

                  if (id === '\0' + VIRTUAL_STATIC_PATHS) {
                    const paths = nonDefaultLocales.map((lang) => ({ params: { lang } }));
                    return `
export function getStaticPaths() {
  return ${JSON.stringify(paths)};
}

/**
 * Combine [lang] with other dynamic params for getStaticPaths.
 * Use in pages like src/pages/[lang]/works/[id].astro.
 *
 * @param {Array<{ params: Record<string, string>, props?: unknown }>} paths
 * @returns {Array<{ params: Record<string, string>, props?: unknown }>}
 *
 * @example
 * export async function getStaticPaths() {
 *   return withLangPaths([
 *     { params: { id: 'foo' } },
 *     { params: { id: 'bar' } },
 *   ]);
 * }
 */
export function withLangPaths(paths) {
  const langs = ${JSON.stringify(nonDefaultLocales)};
  return langs.flatMap((lang) =>
    paths.map((p) => ({ ...p, params: { lang, ...p.params } }))
  );
}
`;
                  }

                  if (id === '\0' + VIRTUAL_HELPERS) {
                    return `
const defaultLang = ${JSON.stringify(defaultLang)};

/**
 * Return a locale-aware path.
 * @param {string} pathname - Must start with "/" (e.g. "/about")
 * @param {import('astro').AstroGlobal} astro
 * @returns {string}
 */
export function locatePath(pathname, astro) {
  const lang = astro?.currentLocale ?? defaultLang;
  if (lang === defaultLang) return pathname;
  return '/' + lang + pathname;
}
`;
                  }

                  if (id === '\0' + VIRTUAL_DUMPLING) {
                    return `
const defaultLang = ${JSON.stringify(defaultLang)};
const locales = ${JSON.stringify(locales)};

export default class Dumpling {
  constructor(astro) {
    this._lang = astro?.currentLocale ?? defaultLang;
  }

  get locales() { return locales; }
  get defaultLang() { return defaultLang; }

  locatePath(pathname) {
    if (this._lang === defaultLang) return pathname;
    return '/' + this._lang + pathname;
  }
}
`;
                  }

                  if (defaultPageMap.has(id)) {
                    return `export { default } from '${defaultPageMap.get(id)}';`;
                  }
                },
              },
            ],
          },
        });
      },
    },
  };
}
