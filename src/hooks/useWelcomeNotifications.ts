import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  CV_NOTIFICATION_DELAY_MS,
  CV_NOTIFICATION_KEY,
  cvNotification,
} from '../lib/welcomeNotifications';

/**
 * Schedules the notifications a visitor gets just for being here. Mounted by the desktop
 * and phone shells, so the timer counts from the site loading but only delivers once the
 * visitor is past the lock screen.
 */
export function useWelcomeNotifications() {
  const { notifyOnce, siteLoadedAt } = useNotifications();
  useEffect(() => {
    const remaining = Math.max(0, CV_NOTIFICATION_DELAY_MS - (Date.now() - siteLoadedAt));
    const t = window.setTimeout(() => notifyOnce(CV_NOTIFICATION_KEY, cvNotification()), remaining);
    return () => window.clearTimeout(t);
  }, [notifyOnce, siteLoadedAt]);
}
