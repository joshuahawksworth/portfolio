import type { FsNode } from '../context/DesktopContext';

/** Human-readable "Kind" column, like Finder. */
export function nodeKind(node: FsNode): string {
  switch (node.type) {
    case 'folder':
      return 'Folder';
    case 'app':
      return 'Application';
    case 'image':
      return 'Image';
    default: {
      const ext = node.name.split('.').pop()?.toLowerCase() ?? '';
      if (node.url || ext === 'pdf') return 'PDF Document';
      if (ext === 'md') return 'Markdown Document';
      if (['exe', 'pkg', 'ipa', 'apk'].includes(ext)) return 'Installer';
      if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'py', 'sh'].includes(ext))
        return 'Source Code';
      return 'Plain Text Document';
    }
  }
}
