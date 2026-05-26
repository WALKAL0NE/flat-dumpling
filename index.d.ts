import type { AstroIntegration } from 'astro';

export interface FlatDumplingOptions {
  /** Default language — served without URL prefix. @default 'ja' */
  defaultLang?: string;
  /** All supported locales including the default. @default ['ja'] */
  locales?: string[];
}

export default function flatDumpling(options?: FlatDumplingOptions): AstroIntegration;

declare module 'virtual:flat-dumpling/dumpling' {
  export default class Dumpling {
    // [7] ランタイムは astro?.currentLocale でオプショナルなので型も合わせる
    constructor(astro?: import('astro').AstroGlobal);
    /** All configured locales. */
    readonly locales: string[];
    /** Default language code. */
    readonly defaultLang: string;
    /** Return a locale-aware path. Leading slash is added automatically. */
    locatePath(pathname: string): string;
  }
}

declare module 'virtual:flat-dumpling/default-page' {
  const component: import('astro').AstroComponentFactory;
  export default component;
}

declare module 'virtual:flat-dumpling/static-paths' {
  export function getStaticPaths(): { params: { lang: string } }[];
  // [6] ジェネリクスで props の型を保持する
  export function withLangPaths<T extends { params: Record<string, string>; props?: unknown }>(
    paths: T[]
  ): ({ params: T['params'] & { lang: string }; props: T['props'] })[];
}

declare module 'virtual:flat-dumpling/helpers' {
  // [7] astro はオプショナル（省略時は defaultLang を使用）
  export function locatePath(pathname: string, astro?: import('astro').AstroGlobal): string;
}

declare module 'virtual:flat-dumpling/config' {
  const config: { defaultLang: string; locales: string[] };
  export default config;
}
