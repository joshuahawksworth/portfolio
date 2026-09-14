import { readdirSync } from 'node:fs';
import path from 'node:path';

/** Folders under public/ that hold optional artwork the app checks for at build time. */
const OPTIONAL_ASSET_DIRS = ['wallpapers', 'icons'];

/**
 * Public URL paths ("/wallpapers/the-beach.jpg") of every file in the optional-asset folders,
 * baked into the bundle as `__PUBLIC_ASSETS__` by vite.config.ts and vitest.config.ts. The app
 * uses the list to know which optional images exist (git-ignored wallpapers, the full Trash)
 * without probing the server and logging 404s. Restart the dev server after adding a file.
 */
export function listPublicAssets(publicDir = path.resolve('public')): string[] {
  const out: string[] = [];
  for (const dir of OPTIONAL_ASSET_DIRS) {
    for (const name of readDirOrEmpty(path.join(publicDir, dir))) {
      if (!name.startsWith('.')) out.push(`/${dir}/${name}`);
    }
  }
  return out.sort();
}

function readDirOrEmpty(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}
