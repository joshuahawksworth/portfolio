import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GRID_START_Y,
  GRID_RIGHT_PAD,
  GRID_COL_W,
  ICON_W,
  cellCovered,
  findEmptyGridCell,
  gridColX,
  iconMaxY,
  initPositions,
  computeCleanPositions,
} from '../../src/components/Desktop/iconGrid';

const items = [
  { id: 'a', label: 'Zeta' },
  { id: 'b', label: 'Alpha' },
  { id: 'c', label: 'Mid' },
];

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
}

describe('desktop icon grid', () => {
  beforeEach(() => setViewport(1280, 800));
  afterEach(() => {
    delete document.documentElement.dataset.os;
  });

  it('hugs the right edge on macOS and the left edge on Windows', () => {
    expect(gridColX('macos', 0)).toBe(1280 - GRID_RIGHT_PAD - ICON_W);
    expect(gridColX('macos', 1)).toBe(1280 - GRID_RIGHT_PAD - ICON_W - GRID_COL_W);
    expect(gridColX('windows', 0)).toBe(GRID_RIGHT_PAD);
    expect(gridColX('windows', 1)).toBe(GRID_RIGHT_PAD + GRID_COL_W);
  });

  it('lays out from the OS it is given, not from <html data-os>', () => {
    // A mobile → desktop resize mounts the Desktop before the attribute is updated; the
    // attribute still says the phone OS. The layout must follow the OS the Desktop renders.
    document.documentElement.dataset.os = 'android';
    const win = initPositions('windows', items);
    expect(win.a).toEqual({ x: GRID_RIGHT_PAD, y: GRID_START_Y });
    expect(Object.values(win).every((p) => p.x === GRID_RIGHT_PAD)).toBe(true);

    document.documentElement.dataset.os = 'ios';
    const mac = initPositions('macos', items);
    expect(mac.a).toEqual({ x: 1280 - GRID_RIGHT_PAD - ICON_W, y: GRID_START_Y });
  });

  it('keeps macOS icons off the desktop widgets and lets Windows use that corner', () => {
    expect(cellCovered('macos', GRID_RIGHT_PAD, GRID_START_Y)).toBe(true);
    expect(cellCovered('windows', GRID_RIGHT_PAD, GRID_START_Y)).toBe(false);
    // On a narrow desktop the right-hand macOS column reaches the widgets; rows they cover
    // are skipped rather than overdrawn.
    setViewport(400, 800);
    const mac = initPositions('macos', items);
    for (const p of Object.values(mac)) expect(cellCovered('macos', p.x, p.y)).toBe(false);
  });

  it('fills columns top to bottom and starts a new column when a column is full', () => {
    setViewport(1280, 492); // (492 - 54 - 80) / 92 → exactly three rows
    const many = ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id }));
    const win = initPositions('windows', many);
    expect(win.a.y).toBe(GRID_START_Y);
    expect(win.b.y).toBeGreaterThan(win.a.y);
    expect(win.d.x).toBe(GRID_RIGHT_PAD + GRID_COL_W);
    expect(win.d.y).toBe(GRID_START_Y);
  });

  it('finds the next free cell on the platform grid', () => {
    const taken = initPositions('windows', items);
    const next = findEmptyGridCell('windows', taken);
    expect(next.x).toBe(GRID_RIGHT_PAD);
    expect(next.y).toBe(taken.c.y + (taken.c.y - taken.b.y));
    const nextMac = findEmptyGridCell('macos', initPositions('macos', items));
    expect(nextMac.x).toBe(1280 - GRID_RIGHT_PAD - ICON_W);
  });

  it('sorts by name when cleaning up by name', () => {
    const pos = computeCleanPositions('windows', items, true);
    expect(pos.b.y).toBeLessThan(pos.c.y);
    expect(pos.c.y).toBeLessThan(pos.a.y);
  });

  it('reserves the taskbar on Windows and the Dock on macOS', () => {
    expect(iconMaxY('windows')).toBeGreaterThan(iconMaxY('macos'));
  });
});
