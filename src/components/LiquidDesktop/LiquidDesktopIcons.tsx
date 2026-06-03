import { useMemo } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { jobsData } from '../../data/experienceData';
import desktopStyles from '../Desktop/Desktop.module.css';

const ICON_W = 76;
const ICON_H = 84;
const ICON_GAP = 8;

const SHORTCUTS = [
  { id: 'shortcut-mycomputer', label: 'My Computer', appId: 'finder' },
  { id: 'shortcut-trash', label: 'Trash', appId: 'trash' },
  { id: 'shortcut-doom', label: 'DOOM', appId: 'doom' },
  { id: 'shortcut-snake', label: 'Snake', appId: 'snake' },
] as const;

function initPositions(count: number) {
  const startX = 20;
  const startY = 54;
  const colW = ICON_W + ICON_GAP + 4;
  const rowH = ICON_H + ICON_GAP;
  const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / rowH));

  return Array.from({ length: count }, (_, i) => ({
    x: startX + Math.floor(i / maxRows) * colW,
    y: startY + (i % maxRows) * rowH,
  }));
}

function MyComputerIcon() {
  return (
    <svg viewBox="0 0 52 48" fill="none" width="48" height="48">
      <rect x="3" y="3" width="46" height="31" rx="4" fill="#4a7ab5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <rect x="3" y="3" width="46" height="10" rx="4" fill="rgba(255,255,255,0.12)" />
      <rect x="7" y="7" width="38" height="23" rx="2" fill="#0d2340" />
      <rect x="8" y="8" width="36" height="10" rx="1" fill="rgba(80,160,255,0.15)" />
      <rect x="10" y="11" width="7" height="6" rx="1" fill="#2060c0" opacity="0.9" />
      <rect x="20" y="11" width="7" height="6" rx="1" fill="#1e8040" opacity="0.9" />
      <rect x="30" y="11" width="7" height="6" rx="1" fill="#802020" opacity="0.9" />
      <rect x="22" y="34" width="8" height="5" rx="1" fill="#3a6090" />
      <rect x="15" y="39" width="22" height="4" rx="2" fill="#3a6090" />
    </svg>
  );
}

function DesktopTrashIcon() {
  return (
    <svg viewBox="0 0 48 54" fill="none" width="44" height="44">
      <path d="M8 14H40M24 8H28M10 14L13 46H35L38 14Z" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DoomIcon() {
  return (
    <img src="/doom-icon.png" alt="DOOM" width="52" height="52" style={{ borderRadius: 8 }} />
  );
}

function NokiaIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
      <rect x="9" y="1" width="30" height="46" rx="7" fill="#1c2233" />
      <rect x="10" y="2" width="28" height="44" rx="6" fill="#243044" />
      <rect x="13" y="10" width="22" height="28" rx="2" fill="#0a1520" />
      <rect x="18" y="42" width="12" height="2" rx="1" fill="#161f2e" />
    </svg>
  );
}

function ShortcutIcon({ id, appId, logo }: { id: string; appId?: string; logo?: string }) {
  if (id === 'shortcut-mycomputer') return <MyComputerIcon />;
  if (id === 'shortcut-trash') return <DesktopTrashIcon />;
  if (appId === 'doom') return <DoomIcon />;
  if (appId === 'snake') return <NokiaIcon />;
  if (logo) return <img src={logo} alt="" className={desktopStyles.iconImg} />;
  return null;
}

export default function LiquidDesktopIcons() {
  const { openApp } = useDesktop();

  const items = useMemo(
    () => [
      ...SHORTCUTS.map(s => ({ ...s, type: 'app' as const, jobId: undefined, logo: undefined })),
      ...jobsData.map(j => ({
        id: j.id,
        label: j.company,
        type: 'job' as const,
        appId: undefined,
        jobId: j.id,
        logo: j.logo,
      })),
    ],
    []
  );

  const positions = useMemo(() => initPositions(items.length), [items.length]);

  function openItem(item: (typeof items)[number]) {
    if (item.type === 'app' && item.appId) openApp(item.appId);
    else if (item.type === 'job' && item.jobId) {
      openApp('experience', { jobId: item.jobId, title: item.label });
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
      {items.map((item, i) => {
        const pos = positions[i];
        const icon = (
          <ShortcutIcon id={item.id} appId={item.appId} logo={'logo' in item ? item.logo : undefined} />
        );
        return (
          <button
            key={item.id}
            type="button"
            className={desktopStyles.icon}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              pointerEvents: 'auto',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'default',
            }}
            onClick={() => openItem(item)}
            onDoubleClick={() => openItem(item)}
            aria-label={item.label}
          >
            {icon ?? <div className={desktopStyles.iconFallback}>{item.label[0]}</div>}
            <span className={desktopStyles.iconLabel}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
