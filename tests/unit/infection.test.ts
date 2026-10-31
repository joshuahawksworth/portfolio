import { afterEach, describe, expect, it } from 'vitest';
import { cure, getInfection, infect, recordScan, resetInfection } from '../../src/lib/infection';
import { openTargetFor } from '../../src/lib/openNode';
import type { FsNode } from '../../src/data/fileSystemSeed';

afterEach(resetInfection);

describe('infection store', () => {
  it('starts clean, catches malware once, and counts a cure as a detection', () => {
    expect(getInfection().status).toBe('clean');
    infect();
    infect();
    expect(getInfection().status).toBe('infected');
    expect(getInfection().infectedAt).not.toBeNull();
    cure();
    expect(getInfection()).toMatchObject({ status: 'clean', infectedAt: null, detections: 1 });
  });

  it('does not count a scan of a clean machine as a detection', () => {
    recordScan();
    cure();
    expect(getInfection().detections).toBe(0);
    expect(getInfection().lastScanAt).not.toBeNull();
  });
});

describe('opening an .exe', () => {
  const node = (name: string): FsNode => ({
    id: 'n',
    parentId: 'desktop',
    name,
    type: 'file',
    content: '',
    createdAt: 0,
    modifiedAt: 0,
  });

  it('runs malware.exe as the installer instead of opening it in the editor', () => {
    expect(openTargetFor(node('malware.exe'))).toEqual({
      kind: 'app',
      appId: 'malware',
      props: { variant: 'installer', source: 'n', title: 'malware.exe' },
    });
    expect(openTargetFor(node('Setup.EXE')).kind).toBe('app');
    expect(openTargetFor(node('notes.txt'))).toMatchObject({ appId: 'texteditor' });
  });
});
