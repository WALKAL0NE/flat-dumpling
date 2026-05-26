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
    constructor(astro: import('astro').AstroGlobal);
    /** All configured locales. */
    readonly locales: string[];
    /** Default language code. */
    readonly defaultLang: string;
    /** Return a locale-aware path. */
    locatePath(pathname: string): string;
  }
}

declare module 'virtual:flat-dumpling/default-page' {
  const component: import('astro').AstroComponentFactory;
  export default component;
}

declare module 'virtual:flat-dumpling/static-paths' {
  export function getStaticPaths(): { params: { lang: string } }[];
  export function withLangPaths<T extends { params: Record<string, string>; props?: unknown }>(
    paths: T[]
  ): ({ params: { lang: string } & T['params']; props?: unknown })[];
}

declare module 'virtual:flat-dumpling/helpers' {
  export function locatePath(pathname: string, astro: import('astro').AstroGlobal): string;
}

declare module 'virtual:flat-dumpling/config' {
  const config: { defaultLang: string; locales: string[] };
  export default config;
}
