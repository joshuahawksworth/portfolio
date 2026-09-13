/**
 * Desktop icon grid geometry, kept free of React and of the DOM's `data-os` attribute.
 *
 * Every helper takes the OS explicitly rather than reading it from `<html data-os>`: the
 * attribute is mirrored from settings in an effect, so it can lag one render behind. The
 * Desktop mounts in the very render in which a mobile → desktop resize flips the OS, and
 * reading the attribute there laid every platform out on the macOS grid.
 */
import type { OsName } from '../../lib/settingsStore';
import { shellInsets } from '../../theme/platform';

export interface IconPos {
  x: number;
  y: number;
}

export const ICON_W = 76;
export const ICON_H = 84;
export const ICON_GAP = 8;
export const GRID_START_Y = 54;
export const GRID_RIGHT_PAD = 20;
export const GRID_COL_W = ICON_W + ICON_GAP + 4;
export const GRID_ROW_H = ICON_H + ICON_GAP;

// The macOS desktop widgets (DesktopWidgets.module.css: two 150px tiles from 27,57) own the
// top-left corner; no icon is placed over them. Windows has no widgets on the desktop.
const WIDGETS_RIGHT = 27 + 150 + 16 + 150 + 16;
const WIDGETS_BOTTOM = 57 + 155 + 12;

/** Does the grid cell at (x, y) sit under the macOS desktop widgets? */
export function cellCovered(os: OsName, x: number, y: number): boolean {
  return os !== 'windows' && x < WIDGETS_RIGHT && y < WIDGETS_BOTTOM && y + ICON_H > GRID_START_Y;
}

/**
 * Left edge of grid column `col`. macOS stacks icons down the right edge with columns
 * growing leftwards; Windows stacks them down the left edge with columns growing rightwards.
 */
export function gridColX(os: OsName, col: number): number {
  if (os === 'windows') return GRID_RIGHT_PAD + col * GRID_COL_W;
  return window.innerWidth - GRID_RIGHT_PAD - ICON_W - col * GRID_COL_W;
}

export function gridMaxRows(): number {
  return Math.max(1, Math.floor((window.innerHeight - GRID_START_Y - 80) / GRID_ROW_H));
}

export function gridMaxCols(): number {
  return Math.max(1, Math.floor((window.innerWidth - GRID_RIGHT_PAD) / GRID_COL_W));
}

/**
 * The first grid cell not already occupied by any icon in `taken`. `taken` is a snapshot of
 * current positions: mutate a local copy to reserve cells for several items placed together.
 */
export function findEmptyGridCell(os: OsName, taken: Record<string, IconPos>): IconPos {
  const maxRows = gridMaxRows();
  const maxCols = gridMaxCols();
  const occupied = Object.values(taken);

  for (let col = 0; col < maxCols; col++) {
    for (let row = 0; row < maxRows; row++) {
      const gx = gridColX(os, col);
      const gy = GRID_START_Y + row * GRID_ROW_H;
      if (cellCovered(os, gx, gy)) continue;
      const hit = occupied.some(
        (p) => Math.abs(p.x - gx) < ICON_W * 0.7 && Math.abs(p.y - gy) < ICON_H * 0.7
      );
      if (!hit) return { x: gx, y: gy };
    }
  }
  // Every cell is taken: pile the rest on the grid's last cell, each a little offset,
  // so nothing is ever placed past the edge of the screen.
  const n = Object.keys(taken).length;
  const step = (n % 6) * 10;
  return {
    x: Math.max(0, gridColX(os, Math.max(0, maxCols - 1)) - step),
    y: Math.max(GRID_START_Y, GRID_START_Y + (maxRows - 1) * GRID_ROW_H - step),
  };
}

/** The lowest an icon's top edge can sit and stay clear of the Dock / taskbar. */
export function iconMaxY(os: OsName): number {
  return window.innerHeight - shellInsets(os).bottom - ICON_H;
}

/** Does an icon placed at (x, y) overlap the macOS desktop widgets? */
export function overlapsWidgets(os: OsName, x: number, y: number): boolean {
  return (
    os !== 'windows' &&
    x < WIDGETS_RIGHT &&
    x + ICON_W > 27 &&
    y < WIDGETS_BOTTOM &&
    y + ICON_H > 57
  );
}

/**
 * Lay every item out on the grid in order, filling each column top to bottom before starting
 * the next and skipping any cell the desktop widgets cover.
 */
export function initPositions(os: OsName, items: { id: string }[]): Record<string, IconPos> {
  const maxRows = gridMaxRows();
  const result: Record<string, IconPos> = {};
  let col = 0;
  let row = 0;
  for (const item of items) {
    while (cellCovered(os, gridColX(os, col), GRID_START_Y + row * GRID_ROW_H)) {
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }
    result[item.id] = { x: gridColX(os, col), y: GRID_START_Y + row * GRID_ROW_H };
    row++;
    if (row >= maxRows) {
      row = 0;
      col++;
    }
  }
  return result;
}

/**
 * Re-anchor every icon after the viewport changes size. Positions are stored as `left`/`top`
 * pixels, but macOS icons belong to the right edge of the screen (the grid grows leftwards
 * from it), so when the window gets wider or narrower they move with that edge and keep
 * their offset from it, the way macOS keeps the desktop relative to its top-right corner.
 * Windows icons belong to the left edge and stay put. Any icon the new size has no room
 * for (off-screen, under the Dock or taskbar, or pushed over the macOS widgets) moves to a
 * free cell of the new grid rather than piling up on the edge.
 *
 * `prevWidth` is the viewport width the positions were laid out for; the Desktop mounts at
 * the mobile/desktop breakpoint, so without this shift the icons would stay glued to
 * wherever that breakpoint's right edge was.
 */
export function reflowPositions(
  os: OsName,
  prev: Record<string, IconPos>,
  prevWidth: number
): Record<string, IconPos> {
  const dx = os === 'windows' ? 0 : window.innerWidth - prevWidth;
  const next: Record<string, IconPos> = {};
  for (const id in prev) next[id] = dx === 0 ? prev[id] : { x: prev[id].x + dx, y: prev[id].y };

  const maxX = window.innerWidth - ICON_W - 4;
  const maxY = iconMaxY(os);
  const displaced = Object.keys(next).filter((id) => {
    const p = next[id];
    return p.x > maxX || p.y > maxY || p.x < 0 || overlapsWidgets(os, p.x, p.y);
  });
  for (const id of displaced) delete next[id];
  for (const id of displaced) next[id] = findEmptyGridCell(os, next);
  return next;
}

export function computeCleanPositions(
  os: OsName,
  items: { id: string; label: string }[],
  sortByName: boolean
): Record<string, IconPos> {
  const sorted = sortByName
    ? [...items].sort((a, b) => a.label.localeCompare(b.label))
    : [...items];
  return initPositions(os, sorted);
}
