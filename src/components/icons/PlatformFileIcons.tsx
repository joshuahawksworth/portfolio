/**
 * Folder, drive and bin artwork chosen by OS, so Finder / File Explorer / Files and
 * the desktop all show the right file-system icons for the platform being rendered.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { OsName } from '../../lib/settingsStore';
import { FolderIcon, MacintoshHDIcon } from './FileSystemIcons';
import { MacTrashIcon } from './MacTrashIcon';
import { RecycleBinIcon, ThisPcIcon, WinArtSized, WinFolderIcon } from './WindowsIcons';
import { AndroidBinIcon, AndroidFolderIcon, AndroidStorageIcon } from './AndroidIcons';

export function PlatformFolderIcon({
  os,
  size = 48,
  tone,
  style,
  children,
}: {
  os: OsName;
  size?: number;
  tone?: 'blue' | 'amber';
  style?: CSSProperties;
  children?: ReactNode;
}) {
  if (os === 'windows') {
    return (
      <span style={{ display: 'inline-flex', ...style }}>
        {children ? (
          <WinFolderIcon size={size}>{children}</WinFolderIcon>
        ) : (
          <WinArtSized name="folder" size={size} fallback={<WinFolderIcon size={size} />} />
        )}
      </span>
    );
  }
  if (os === 'android') {
    return (
      <span style={{ display: 'inline-flex', ...style }}>
        <AndroidFolderIcon size={size}>{children}</AndroidFolderIcon>
      </span>
    );
  }
  return (
    <FolderIcon size={size} tone={tone} style={style}>
      {children}
    </FolderIcon>
  );
}

export function PlatformDriveIcon({ os, size = 50 }: { os: OsName; size?: number }) {
  if (os === 'windows') {
    return <WinArtSized name="this-pc" size={size} fallback={<ThisPcIcon size={size} />} />;
  }
  if (os === 'android') return <AndroidStorageIcon size={size} />;
  return <MacintoshHDIcon size={size} />;
}

export function PlatformBinIcon({
  os,
  size = 50,
  full = false,
  glow = false,
  style,
}: {
  os: OsName;
  size?: number;
  full?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}) {
  const glowStyle: CSSProperties | undefined = glow
    ? { filter: 'drop-shadow(0 0 8px var(--accent)) drop-shadow(0 0 16px var(--accent-soft))' }
    : undefined;
  if (os === 'windows') {
    return (
      <span style={{ display: 'inline-flex', ...glowStyle, ...style }}>
        <WinArtSized
          name={full ? 'recycle-bin-full' : 'recycle-bin-empty'}
          size={size}
          fallback={<RecycleBinIcon full={full} size={size} />}
        />
      </span>
    );
  }
  if (os === 'android') {
    return (
      <span style={{ display: 'inline-flex', width: size, height: size, ...glowStyle, ...style }}>
        <AndroidBinIcon full={full} />
      </span>
    );
  }
  return <MacTrashIcon size={size} full={full} glow={glow} style={style} />;
}
