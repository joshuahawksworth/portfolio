/**
 * Seed contents for the portfolio's virtual file system.
 *
 * Every folder that Finder, the desktop and the Trash can show lives in one tree so
 * folders nest arbitrarily, items can be moved between any two folders, and the Trash
 * remembers where each item came from.
 */
import { jobsData } from './experienceData';
import { FINDER_FILE_CONTENTS } from '../components/apps/TextEditorApp';

export type FsNodeType = 'folder' | 'file' | 'image' | 'app' | 'job';

export interface FsNode {
  id: string;
  /** `null` only for the root folders (Desktop, Documents, …). */
  parentId: string | null;
  name: string;
  type: FsNodeType;
  /** Text content for files (images keep a data URL instead). */
  content?: string;
  dataUrl?: string;
  /** Opens in a new tab instead of an app (CV.pdf). */
  url?: string;
  appId?: string;
  jobId?: string;
  /** System items: can't be renamed, trashed or moved (Macintosh HD, Trash, the roots). */
  locked?: boolean;
  /** Joke files that were "always" in the Trash. */
  isJoke?: boolean;
  createdAt: number;
  modifiedAt: number;
  /** Where the item lived before it was trashed, so Put Back knows where to go. */
  trashedFrom?: string;
  trashedAt?: number;
}

export const ROOT_IDS = {
  desktop: 'desktop',
  documents: 'documents',
  downloads: 'downloads',
  applications: 'applications',
  trash: 'trash',
} as const;

export type RootId = (typeof ROOT_IDS)[keyof typeof ROOT_IDS];

export const ROOT_PATHS: Record<RootId, string> = {
  desktop: '~/Desktop',
  documents: '~/Documents',
  downloads: '~/Downloads',
  applications: '/Applications',
  trash: '~/.Trash',
};

/** Roots the user can browse in Finder's sidebar (Trash lives in the dock). */
export const FINDER_ROOTS: RootId[] = ['desktop', 'documents', 'downloads', 'applications'];

type Seed = Omit<FsNode, 'createdAt' | 'modifiedAt'> & { at?: number };

// A stable "install date" so seeded items sort predictably and show a sensible date.
const INSTALLED = Date.UTC(2026, 0, 12, 9, 30);
const JOKE_DATES: Record<string, number> = {
  'joke-jquery': Date.UTC(2019, 5, 4),
  'joke-confusion': Date.UTC(2020, 2, 18),
  'joke-index': Date.UTC(2021, 8, 9),
  'joke-console': Date.UTC(2022, 10, 2),
  'joke-spaghetti': Date.UTC(2023, 1, 27),
  'joke-todo': Date.UTC(2024, 0, 3),
  'secret-game-codes': Date.UTC(2026, 0, 12),
};

function known(id: string): { name: string; content: string } {
  const k = FINDER_FILE_CONTENTS[id];
  return k ? { name: k.filename, content: k.content } : { name: id, content: `// ${id}\n` };
}

function file(id: string, parentId: string, overrides: Partial<Seed> = {}): Seed {
  const k = known(id);
  return { id, parentId, name: k.name, type: 'file', content: k.content, ...overrides };
}

function folder(
  id: string,
  parentId: string | null,
  name: string,
  extra: Partial<Seed> = {}
): Seed {
  return { id, parentId, name, type: 'folder', ...extra };
}

function app(id: string, appId: string, name: string): Seed {
  return { id, parentId: 'applications', name, type: 'app', appId, locked: true };
}

const SECRET_CODES = {
  name: 'secret-codes.txt',
  content: `Things I definitely meant to delete:

- Terminal: run "spaceinvaders"
- Nokia phone: enter "3310" on the keypad

Space Impact controls:
- D-pad / WASD / arrows to move
- Center key / Enter to start or fire
- # also fires
- * returns to Snake`,
};

const SEEDS: Seed[] = [
  // ── Roots ──────────────────────────────────────────────────────────────
  folder('desktop', null, 'Desktop', { locked: true }),
  folder('documents', null, 'Documents', { locked: true }),
  folder('downloads', null, 'Downloads', { locked: true }),
  folder('applications', null, 'Applications', { locked: true }),
  folder('trash', null, 'Trash', { locked: true }),

  // ── Desktop (order matters: it is the default icon layout) ─────────────
  {
    id: 'shortcut-mycomputer',
    parentId: 'desktop',
    name: 'Macintosh HD',
    type: 'app',
    appId: 'finder',
    locked: true,
  },
  {
    id: 'shortcut-trash',
    parentId: 'desktop',
    name: 'Trash',
    type: 'app',
    appId: 'trash',
    locked: true,
  },
  { id: 'shortcut-doom', parentId: 'desktop', name: 'DOOM', type: 'app', appId: 'doom' },
  { id: 'shortcut-snake', parentId: 'desktop', name: 'Snake', type: 'app', appId: 'snake' },
  folder('trickster', 'desktop', 'My Flaws', { locked: true }),
  ...jobsData.map(
    (j): Seed => ({ id: j.id, parentId: 'desktop', name: j.company, type: 'job', jobId: j.id })
  ),

  // ── Documents ──────────────────────────────────────────────────────────
  file('doc-readme', 'documents'),
  {
    id: 'doc-cv',
    parentId: 'documents',
    name: 'CV.pdf',
    type: 'file',
    url: '/JoshuaHawksworthCV.pdf',
  },
  folder('doc-proj', 'documents', 'Projects'),
  file('doc-notes', 'documents'),

  folder('proj-arcus', 'doc-proj', 'arcus-work-orders'),
  folder('proj-cmap', 'doc-proj', 'cmap-mail'),
  folder('proj-kwando', 'doc-proj', 'kwando'),
  folder('proj-orderbee', 'doc-proj', 'orderbee'),
  folder('proj-tofs', 'doc-proj', 'tofs-app'),
  folder('proj-ciclo', 'doc-proj', 'ciclozone'),
  folder('proj-web', 'doc-proj', 'webmaster'),

  file('arcus-readme', 'proj-arcus'),

  file('cmap-readme', 'proj-cmap'),
  file('cmap-pkg', 'proj-cmap'),
  folder('cmap-src', 'proj-cmap', 'src'),
  file('cmap-src-index', 'cmap-src', { name: 'index.ts', content: known('cmap-src').content }),

  file('kwa-readme', 'proj-kwando'),
  file('kwa-app', 'proj-kwando'),

  file('ord-readme', 'proj-orderbee'),
  file('ord-index', 'proj-orderbee'),

  file('tofs-readme', 'proj-tofs'),
  folder('tofs-src', 'proj-tofs', 'src'),
  file('tofs-src-index', 'tofs-src', { name: 'index.tsx', content: known('tofs-src').content }),

  file('ciclo-readme', 'proj-ciclo'),

  file('web-readme', 'proj-web'),
  file('web-index', 'proj-web'),

  // ── Downloads ──────────────────────────────────────────────────────────
  file('dl-blazor', 'downloads'),
  file('dl-react', 'downloads'),

  // ── Applications ───────────────────────────────────────────────────────
  app('app-finder', 'finder', 'Finder.app'),
  app('app-about', 'about', 'About.app'),
  app('app-exp', 'experience', 'Experience.app'),
  app('app-skills', 'skills', 'Skills.app'),
  app('app-contact', 'contact', 'Contact.app'),
  app('app-loc', 'location', 'Location.app'),
  app('app-term', 'terminal', 'Terminal.app'),
  app('app-calc', 'calculator', 'Calculator.app'),
  app('app-editor', 'texteditor', 'TextEditor.app'),
  app('app-preview', 'imageviewer', 'Preview.app'),
  app('app-safari', 'safari', 'Google Chrome.app'),
  app('app-askjosh', 'askjosh', 'Ask Claude.app'),
  app('app-snake', 'snake', 'Snake.app'),
  app('app-doom', 'doom', 'DOOM.app'),
  app('app-trash', 'trash', 'Trash.app'),

  // ── Trash (the jokes were "always" here) ───────────────────────────────
  ...Object.keys(JOKE_DATES).map(
    (id): Seed => ({
      ...file(id, 'trash', id === 'secret-game-codes' ? SECRET_CODES : undefined),
      isJoke: true,
      trashedFrom: 'desktop',
      trashedAt: JOKE_DATES[id],
      at: JOKE_DATES[id],
    })
  ),
];

export function buildSeedFileSystem(): Record<string, FsNode> {
  const nodes: Record<string, FsNode> = {};
  SEEDS.forEach((s, i) => {
    const { at, ...rest } = s;
    // Spread creation times by a few ms so insertion order survives sorting by date.
    const stamp = (at ?? INSTALLED) + i;
    nodes[s.id] = { ...rest, createdAt: stamp, modifiedAt: stamp };
  });
  return nodes;
}
