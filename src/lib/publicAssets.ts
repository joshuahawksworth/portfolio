/**
 * Which optional files ship under public/. The list is computed at build time
 * (scripts/publicAssets.ts, injected as `__PUBLIC_ASSETS__`), so the app knows on first
 * render whether a git-ignored wallpaper or the full Trash icon exists, with no probe
 * requests and no 404s in the console.
 */
declare const __PUBLIC_ASSETS__: string[] | undefined;

const PUBLIC_ASSETS: ReadonlySet<string> = new Set(
  typeof __PUBLIC_ASSETS__ === 'undefined' ? [] : __PUBLIC_ASSETS__
);

/** True when `path` (e.g. "/wallpapers/the-beach.jpg") was in public/ when the app was built. */
export function hasPublicAsset(path: string): boolean {
  return PUBLIC_ASSETS.has(path);
}
