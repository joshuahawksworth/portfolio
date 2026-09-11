/**
 * The notification that slides in for a moment, styled for the OS being rendered:
 * a macOS banner, a Windows 11 toast, an iOS banner or an Android heads-up card.
 * Clicking (or the action button) runs the notification's action; hovering shows a
 * close control on desktop, and phones swipe the banner up to dismiss it.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  notificationAge,
  useNotifications,
  type AppNotification,
} from '../../context/NotificationContext';
import { useOs } from '../../context/SettingsContext';
import { appIconFor } from '../../theme/platformIcons';
import { appLabelFor } from '../../theme/platform';
import { DOCK_LABELS } from '../Dock/dockConfig';
import type { OsName } from '../../lib/settingsStore';
import { DocumentIcon } from '../icons/FileSystemIcons';
import styles from './Notifications.module.css';

export function notificationAppName(appId: string, os: OsName): string {
  return appLabelFor(appId, DOCK_LABELS[appId] ?? appId, os);
}

/**
 * The artwork a notification carries. Windows files the CV reminder under the PDF
 * document (the same icon as the "My CV" desktop shortcut) rather than Word, which is
 * only the app that opens it; every other platform keeps its app icon.
 */
export function notificationIcon(appId: string, os: OsName): ReactNode {
  if (os === 'windows' && appId === 'cv') return <DocumentIcon name="CV.pdf" />;
  return appIconFor(appId, os);
}

const OS_CLASS: Record<OsName, string> = {
  macos: '',
  windows: styles.bannerWindows,
  ios: styles.bannerIos,
  android: styles.bannerAndroid,
};

/** How far a banner has to be dragged before letting go dismisses it. */
const DISMISS_PX = 56;

function Banner({ n, os }: { n: AppNotification; os: OsName }) {
  const { activate, dismissBanner } = useNotifications();
  const [leaving, setLeaving] = useState<null | 'swipe' | 'auto'>(null);
  const [drag, setDrag] = useState<{ offset: number; live: boolean }>({ offset: 0, live: false });
  const leaveTimer = useRef<number | undefined>(undefined);
  const gesture = useRef<{ id: number; start: number; moved: boolean } | null>(null);
  const appName = notificationAppName(n.appId, os);
  const icon = notificationIcon(n.appId, os);
  const phone = os === 'ios' || os === 'android';
  // Phones swipe the banner up off the top edge; desktops slide it out to the right,
  // the way macOS banners and Windows toasts leave.
  const axis: 'x' | 'y' = phone ? 'y' : 'x';

  function leave(kind: 'swipe' | 'auto', then: () => void) {
    if (leaving) return;
    setLeaving(kind);
    leaveTimer.current = window.setTimeout(then, 220);
  }

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || leaving) return;
    gesture.current = {
      id: e.pointerId,
      start: axis === 'y' ? e.clientY : e.clientX,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const raw = (axis === 'y' ? e.clientY : e.clientX) - g.start;
    // Only the dismissing direction moves the banner; the other way gives a little resistance.
    const offset =
      axis === 'y'
        ? Math.min(raw, 0) + Math.max(raw, 0) * 0.15
        : Math.max(raw, 0) + Math.min(raw, 0) * 0.15;
    if (!g.moved && Math.abs(raw) > 6) g.moved = true;
    if (g.moved) setDrag({ offset, live: true });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.moved) return;
    const raw = (axis === 'y' ? e.clientY : e.clientX) - g.start;
    const past = axis === 'y' ? raw < -DISMISS_PX : raw > DISMISS_PX;
    if (past) {
      leave('swipe', () => dismissBanner(n.id));
    } else {
      setDrag({ offset: 0, live: false });
    }
  }

  function onClick() {
    // A drag that ended short of the threshold is not a tap.
    if (drag.live || drag.offset !== 0) return;
    leave('auto', () => activate(n.id));
  }

  const style: CSSProperties | undefined = drag.live
    ? {
        transform: axis === 'y' ? `translateY(${drag.offset}px)` : `translateX(${drag.offset}px)`,
        opacity: Math.max(0.35, 1 - Math.abs(drag.offset) / 220),
        transition: 'none',
      }
    : undefined;

  return (
    <div
      className={[
        styles.banner,
        OS_CLASS[os],
        leaving ? styles.bannerLeaving : '',
        leaving === 'swipe' ? styles.bannerSwiped : '',
      ].join(' ')}
      style={style}
      role="status"
      aria-live="polite"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        gesture.current = null;
        setDrag({ offset: 0, live: false });
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.text}>
        <div className={styles.app}>
          <span>
            {os === 'windows' && (
              <span className={styles.winAppIcon} aria-hidden="true">
                {icon}
              </span>
            )}
            {os === 'android' && (
              <span className={styles.droidIcon} aria-hidden="true">
                {icon}
              </span>
            )}
            {appName}
          </span>
          <span className={styles.age}>{notificationAge(n.at)}</span>
        </div>
        <div className={styles.title}>{n.title}</div>
        <div className={styles.body}>{n.body}</div>
      </div>
      {n.onActivate && (
        <button
          type="button"
          className={styles.action}
          onClick={(e) => {
            e.stopPropagation();
            leave('auto', () => activate(n.id));
          }}
        >
          Open
        </button>
      )}
      <button
        type="button"
        className={styles.close}
        aria-label="Close notification"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          leave('auto', () => dismissBanner(n.id));
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function NotificationBanners() {
  const { banners } = useNotifications();
  const os = useOs();
  if (banners.length === 0) return null;
  const phone = os === 'ios' || os === 'android';
  return (
    <div
      className={`${styles.layer} ${os === 'windows' ? styles.layerWindows : ''} ${phone ? styles.layerPhone : ''}`}
      aria-label="Notifications"
    >
      {banners.map((n) => (
        <Banner key={n.id} n={n} os={os} />
      ))}
    </div>
  );
}

/** The list shown in a notification centre or phone shade. */
export function NotificationList({
  variant,
}: {
  variant: 'macos' | 'windows' | 'ios' | 'android';
}) {
  const { notifications, activate, remove, clearAll } = useNotifications();
  const os = useOs();
  const listClass = [
    styles.list,
    variant === 'windows' ? styles.listWindows : '',
    variant === 'ios' || variant === 'android' ? styles.listPhone : '',
    variant === 'android' ? styles.listAndroid : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={listClass}>
      {notifications.length > 0 && (
        <div className={styles.listHead} style={variant === 'ios' ? { color: '#fff' } : undefined}>
          <span>{variant === 'windows' ? 'Notifications' : 'Notification Center'}</span>
          <button type="button" className={styles.clearAll} onClick={clearAll}>
            {variant === 'macos' ? 'Clear All' : 'Clear all'}
          </button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className={styles.empty}>
          {variant === 'windows' ? 'No new notifications' : 'No New Notifications'}
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={styles.item}
            role="button"
            tabIndex={0}
            onClick={() => activate(n.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate(n.id);
              }
            }}
          >
            <span className={styles.icon} aria-hidden="true">
              {notificationIcon(n.appId, os)}
            </span>
            <div className={styles.text}>
              <div className={styles.app}>
                <span>{notificationAppName(n.appId, os)}</span>
                <span className={styles.age}>{notificationAge(n.at)}</span>
              </div>
              <div className={styles.title}>{n.title}</div>
              <div className={styles.body}>{n.body}</div>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Clear notification"
              onClick={(e) => {
                e.stopPropagation();
                remove(n.id);
              }}
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}
