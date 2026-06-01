import { useState, useRef, useEffect } from 'react';
import { DesktopProvider, useDesktop } from '../../context/DesktopContext';
import MenuBar from '../MenuBar/MenuBar';
import Dock from '../Dock/Dock';
import Window from '../Window/Window';
import AboutApp from '../apps/AboutApp';
import ExperienceApp from '../apps/ExperienceApp';
import SkillsApp from '../apps/SkillsApp';
import ContactApp from '../apps/ContactApp';
import LocationApp from '../apps/LocationApp';
import TerminalApp from '../apps/TerminalApp';
import FinderApp from '../apps/FinderApp';
import TrashApp from '../apps/TrashApp';
import { jobsData } from '../../data/experienceData';
import styles from './Desktop.module.css';

const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about:      AboutApp,
  experience: ExperienceApp,
  skills:     SkillsApp,
  contact:    ContactApp,
  location:   LocationApp,
  terminal:   TerminalApp,
  finder:     FinderApp,
  trash:      TrashApp,
};

interface IconPos { x: number; y: number }

function initIconPositions(): Record<string, IconPos> {
  const ICON_W = 76;
  const ICON_H = 84;
  const gap = 8;
  const startX = window.innerWidth - ICON_W - 20;
  const startY = 48;

  return Object.fromEntries(
    jobsData.map((job, i) => [job.id, { x: startX, y: startY + i * (ICON_H + gap) }])
  );
}

function DesktopSurface() {
  const { windows, openApp } = useDesktop();
  const [iconPos, setIconPos] = useState<Record<string, IconPos>>(initIconPositions);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const dragData = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  // Keep icons within screen bounds when browser window is resized
  useEffect(() => {
    function onResize() {
      setIconPos(prev => {
        const next = { ...prev };
        for (const id in next) {
          next[id] = {
            x: Math.min(next[id].x, window.innerWidth  - 80),
            y: Math.min(next[id].y, window.innerHeight - 110),
          };
        }
        return next;
      });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function startIconDrag(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setSelectedIcon(id);
    dragData.current = { id, sx: e.clientX, sy: e.clientY, ox: iconPos[id].x, oy: iconPos[id].y };

    function onMove(ev: MouseEvent) {
      if (!dragData.current) return;
      const { id, sx, sy, ox, oy } = dragData.current;
      setIconPos(prev => ({ ...prev, [id]: { x: ox + ev.clientX - sx, y: oy + ev.clientY - sy } }));
    }

    function onUp() {
      dragData.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div className={styles.desktop} onClick={() => setSelectedIcon(null)}>
      <MenuBar />

      {/* Draggable company icons */}
      {jobsData.map((job, i) => {
        const pos = iconPos[job.id] ?? { x: window.innerWidth - 96, y: 48 + i * 92 };
        const isSelected = selectedIcon === job.id;

        return (
          <div
            key={job.id}
            className={`${styles.icon} ${isSelected ? styles.iconSelected : ''}`}
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={e => { e.stopPropagation(); startIconDrag(e, job.id); }}
            onDoubleClick={() => openApp('experience', { jobId: job.id, title: job.company })}
            onClick={e => { e.stopPropagation(); setSelectedIcon(job.id); }}
            role="button"
            tabIndex={0}
            aria-label={`Open ${job.company}`}
            onKeyDown={e => e.key === 'Enter' && openApp('experience', { jobId: job.id, title: job.company })}
          >
            {job.logo
              ? <img src={job.logo} alt={job.company} className={styles.iconImg} />
              : <div className={styles.iconFallback}>{job.company[0]}</div>
            }
            <span className={styles.iconLabel}>{job.company}</span>
          </div>
        );
      })}

      {/* Open windows */}
      {windows.map(win => {
        const AppComponent = APP_COMPONENTS[win.appId];
        if (!AppComponent) return null;
        return (
          <Window key={win.id} win={win}>
            <AppComponent props={win.props} />
          </Window>
        );
      })}

      <Dock />
    </div>
  );
}

export default function Desktop() {
  return (
    <DesktopProvider>
      <DesktopSurface />
    </DesktopProvider>
  );
}
