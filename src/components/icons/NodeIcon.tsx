/**
 * Renders the right artwork for any file-system node, at any size, so the desktop,
 * Finder (icon + list views), Get Info and the Trash all show the same icons.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { FsNode } from '../../context/DesktopContext';
import { DocumentIcon, FolderIcon, PictureIcon } from './FileSystemIcons';
import { NokiaIcon } from './NokiaIcon';
import { PlatformBinIcon, PlatformDriveIcon, PlatformFolderIcon } from './PlatformFileIcons';
import { appIconFor } from '../../theme/platformIcons';
import { useOs } from '../../context/SettingsContext';
import { MALWARE_NODE_ID } from '../../lib/infection';
import { MalwareAlertIcon } from './SecurityIcons';

/** The little white box with a blue arrow Windows puts on the corner of a shortcut. */
function WinShortcut({ size, children }: { size: number; children: ReactNode }) {
  const badge = Math.max(12, Math.round(size * 0.3));
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      {children}
      <svg
        viewBox="0 0 16 16"
        width={badge}
        height={badge}
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, bottom: 0 }}
      >
        <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" fill="#fff" stroke="#7a7a7a" />
        <path d="M5 11.5V7.3h4.2V4.8L12.5 8l-3.3 3.2V8.8H6.6v2.7z" fill="#1a73e8" />
      </svg>
    </span>
  );
}

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
  if (node.id === 'shortcut-mycomputer') {
    // On the Mac the startup volume sits on the desktop as a plain blue folder
    if (os === 'macos') return <FolderIcon size={size} />;
    return <PlatformDriveIcon os={os} size={size} />;
  }
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

  if (node.type === 'app') {
    // Desktop shortcuts on Windows carry the shortcut arrow; apps in their folders do not.
    if (os === 'windows' && node.id.startsWith('shortcut-')) {
      const plain = { ...node, id: node.id.replace(/^shortcut-/, '') };
      return (
        <WinShortcut size={size}>
          <NodeIcon node={plain} size={size} trashFull={trashFull} trashGlow={trashGlow} />
        </WinShortcut>
      );
    }
    // The CV shortcut opens the PDF, so it wears the PDF document icon on every platform.
    if (node.appId === 'cv') return <DocumentIcon name="CV.pdf" size={size} />;
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

  // The bait wears a red hazard sign rather than a document, so nobody can say they weren't told.
  if (node.id === MALWARE_NODE_ID) return <MalwareAlertIcon size={size} />;
  return <DocumentIcon name={node.name} size={size} />;
}
