import type { NotificationInput } from '../context/NotificationContext';
import { downloadCv } from './cv';

/** Seconds a visitor has been on the site before the CV reminder shows. */
export const CV_NOTIFICATION_DELAY_MS = 30_000;
export const CV_NOTIFICATION_KEY = 'cv-download';

/** The first notification every visitor gets: a one-tap download of the CV. */
export function cvNotification(): NotificationInput {
  return {
    appId: 'cv',
    title: "Josh's CV is ready to download",
    body: 'Tap to save JoshuaHawksworthCV.pdf to your device.',
    onActivate: downloadCv,
  };
}
