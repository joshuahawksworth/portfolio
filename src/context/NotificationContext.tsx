/**
 * Platform notifications. One store feeds the banner that slides in for a moment
 * (macOS top-right, Windows bottom-right, iOS / Android heads-up) and the notification
 * centre / shade where notifications wait until they are acted on or cleared.
 *
 * The provider lives above the desktop and phone shells so a notification queued while
 * the visitor is still on the lock screen is waiting for them when they get in.
 */
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSettings } from './SettingsContext';

export interface AppNotification {
  id: string;
  /** App the notification belongs to: drives the icon and the app name. */
  appId: string;
  title: string;
  body: string;
  at: number;
  /** Runs when the banner or the centre entry is clicked (download, open an app…). */
  onActivate?: () => void;
}

export type NotificationInput = Omit<AppNotification, 'id' | 'at'>;

interface NotificationsValue {
  /** Everything waiting in the notification centre, newest first. */
  notifications: AppNotification[];
  /** Banners currently on screen, oldest first. */
  banners: AppNotification[];
  notify: (input: NotificationInput) => string;
  /** Like notify, but a given key only ever fires once per visit. */
  notifyOnce: (key: string, input: NotificationInput) => void;
  /** Take the banner off screen; the notification stays in the centre. */
  dismissBanner: (id: string) => void;
  /** Run the notification's action and clear it everywhere. */
  activate: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
  /** When the site was first loaded, so "after N seconds on the site" is measurable. */
  siteLoadedAt: number;
}

const NotificationContext = createContext<NotificationsValue | null>(null);

/** How long a banner stays up before sliding away on its own. */
export const BANNER_MS = 7000;

let counter = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [banners, setBanners] = useState<AppNotification[]>([]);
  const timers = useRef(new Map<string, number>());
  const fired = useRef(new Set<string>());
  const siteLoadedAt = useRef(Date.now()).current;
  // Read through a ref so notify() stays stable while Do Not Disturb changes.
  const dndRef = useRef(settings.doNotDisturb);
  dndRef.current = settings.doNotDisturb;

  const dismissBanner = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const notify = useCallback(
    (input: NotificationInput) => {
      counter += 1;
      const n: AppNotification = {
        ...input,
        id: `n-${Date.now().toString(36)}-${counter}`,
        at: Date.now(),
      };
      setNotifications((prev) => [n, ...prev]);
      if (!dndRef.current) {
        setBanners((prev) => [...prev, n]);
        timers.current.set(
          n.id,
          window.setTimeout(() => dismissBanner(n.id), BANNER_MS)
        );
      }
      return n.id;
    },
    [dismissBanner]
  );

  const notifyOnce = useCallback(
    (key: string, input: NotificationInput) => {
      if (fired.current.has(key)) return;
      fired.current.add(key);
      notify(input);
    },
    [notify]
  );

  const remove = useCallback(
    (id: string) => {
      dismissBanner(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [dismissBanner]
  );

  const activate = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        target?.onActivate?.();
        return prev.filter((n) => n.id !== id);
      });
      dismissBanner(id);
    },
    [dismissBanner]
  );

  const clearAll = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current.clear();
    setBanners([]);
    setNotifications([]);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const value = useMemo<NotificationsValue>(
    () => ({
      notifications,
      banners,
      notify,
      notifyOnce,
      dismissBanner,
      activate,
      remove,
      clearAll,
      siteLoadedAt,
    }),
    [
      notifications,
      banners,
      notify,
      notifyOnce,
      dismissBanner,
      activate,
      remove,
      clearAll,
      siteLoadedAt,
    ]
  );

  return <NotificationContext value={value}>{children}</NotificationContext>;
}

const FALLBACK: NotificationsValue = {
  notifications: [],
  banners: [],
  notify: () => '',
  notifyOnce: () => {},
  dismissBanner: () => {},
  activate: () => {},
  remove: () => {},
  clearAll: () => {},
  siteLoadedAt: 0,
};

/** Falls back to a no-op store so components render in tests without the provider. */
export function useNotifications(): NotificationsValue {
  return use(NotificationContext) ?? FALLBACK;
}

/** "now", "3m ago", "2h ago" — how notification centres label age. */
export function notificationAge(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return 'now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
