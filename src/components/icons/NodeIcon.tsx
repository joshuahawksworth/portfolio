/**
 * Renders the right artwork for any file-system node, at any size, so the desktop,
 * Finder (icon + list views), Get Info and the Trash all show the same icons.
 */
import type { CSSProperties } from 'react';
import type { FsNode } from '../../context/DesktopContext';
import { jobsData } from '../../data/experienceData';
import { DocumentIcon, PictureIcon } from './FileSystemIcons';
import { NokiaIcon } from './NokiaIcon';
import { PlatformBinIcon, PlatformDriveIcon, PlatformFolderIcon } from './PlatformFileIcons';
import { appIconFor } from '../../theme/platformIcons';
import { useOs } from '../../context/SettingsContext';

export function NodeIcon({
  node,
  size = 48,
  trashFull = false,
  trashGlow = false,
}: {
  node: FsNode;
  size?: number;
  trashFull?: boolean;
  trashGlow?: boolean;
}) {
  const os = useOs();
  if (node.id === 'shortcut-mycomputer') return <PlatformDriveIcon os={os} size={size} />;
  if (node.appId === 'trash') {
    return <PlatformBinIcon os={os} size={size} full={trashFull} glow={trashGlow} />;
  }

  if (node.type === 'folder') {
    if (node.id === 'trickster') {
      return (
        <PlatformFolderIcon os={os} size={size} tone="amber">
          <text
            x="32"
            y="42"
            textAnchor="middle"
            fontSize="20"
            fontWeight="800"
            fill="rgba(110,60,0,0.6)"
            fontFamily="-apple-system, 'Helvetica Neue', Arial, sans-serif"
          >
            ?
          </text>
        </PlatformFolderIcon>
      );
    }
    return <PlatformFolderIcon os={os} size={size} />;
  }

  if (node.type === 'job') {
    const job = jobsData.find((j) => j.id === node.jobId);
    const tile: CSSProperties = {
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.22),
      background: 'rgba(255,255,255,0.92)',
      border: '1px solid rgba(255,255,255,0.7)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 8px rgba(70,40,10,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
      boxSizing: 'border-box',
    };
    return (
      <span style={tile}>
        {job?.logo ? (
          <img
            src={job.logo}
            alt=""
            draggable={false}
            style={{ width: '80%', height: '80%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <span style={{ fontWeight: 700, color: '#262422', fontSize: size * 0.4 }}>
            {node.name[0]}
          </span>
        )}
      </span>
    );
  }

  if (node.type === 'app') {
    if (node.appId === 'doom') {
      return (
        <img
          src="/doom-icon.png"
          alt=""
          draggable={false}
          style={{
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.22),
            objectFit: 'cover',
            display: 'block',
          }}
        />
      );
    }
    if (node.appId === 'snake') return <NokiaIcon size={size} />;
    const art = appIconFor(node.appId ?? '', os);
    if (art) {
      // Dock artwork sizes itself from --app-icon-size (real PNGs) or a fixed 44px (drawn SVGs).
      return (
        <span
          className="nodeAppIcon"
          style={
            {
              '--app-icon-size': `${size}px`,
              width: size,
              height: size,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            } as CSSProperties
          }
        >
          {art}
        </span>
      );
    }
    return <DocumentIcon name={node.name} size={size} />;
  }

  if (node.type === 'image') {
    if (node.dataUrl) {
      return (
        <img
          src={node.dataUrl}
          alt=""
          draggable={false}
          style={{
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.12),
            objectFit: 'cover',
            display: 'block',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        />
      );
    }
    return <PictureIcon size={size} />;
  }

  return <DocumentIcon name={node.name} size={size} />;
}

/** Human-readable "Kind" column, like Finder. */
export function nodeKind(node: FsNode): string {
  switch (node.type) {
    case 'folder':
      return 'Folder';
    case 'app':
      return 'Application';
    case 'job':
      return 'Work Experience';
    case 'image':
      return 'Image';
    default: {
      const ext = node.name.split('.').pop()?.toLowerCase() ?? '';
      if (node.url || ext === 'pdf') return 'PDF Document';
      if (ext === 'md') return 'Markdown Document';
      if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'py', 'sh'].includes(ext))
        return 'Source Code';
      return 'Plain Text Document';
    }
  }
}
