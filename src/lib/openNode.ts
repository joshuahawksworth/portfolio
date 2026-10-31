import type { FsNode } from '../context/DesktopContext';
import { popupSize } from './malwarePopups';

export type OpenTarget =
  | { kind: 'folder'; id: string }
  | { kind: 'url'; url: string }
  | { kind: 'app'; appId: string; props?: Record<string, unknown> };

/** What double-clicking a node should do — shared by the desktop and Finder. */
export function openTargetFor(node: FsNode): OpenTarget {
  if (node.type === 'folder') return { kind: 'folder', id: node.id };
  if (node.url) return { kind: 'url', url: node.url };
  if (node.type === 'app') {
    return { kind: 'app', appId: node.appId ?? 'finder' };
  }
  // Any .exe is malware.exe in disguise: it "installs" and the machine catches it.
  if (/\.exe$/i.test(node.name)) {
    return {
      kind: 'app',
      appId: 'malware',
      props: {
        variant: 'installer',
        source: node.id,
        title: node.name,
        ...popupSize(document.documentElement.dataset.os),
      },
    };
  }
  if (node.type === 'image') {
    return {
      kind: 'app',
      appId: 'imageviewer',
      props: { filename: node.name, dataUrl: node.dataUrl ?? '' },
    };
  }
  return {
    kind: 'app',
    appId: 'texteditor',
    props: { fileId: node.id, filename: node.name, content: node.content ?? `// ${node.name}\n` },
  };
}
