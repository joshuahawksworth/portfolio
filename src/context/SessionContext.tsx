import { createContext, use, type ReactNode } from 'react';
import type { Platform } from '../lib/settingsStore';

/** Power / session actions owned by App: lock the screen, restart the "machine", shut it down. */
export interface SessionValue {
  lock: () => void;
  logOut: () => void;
  /** Shows the current OS's restart screen, then boots again. */
  restart: () => void;
  /** Shows the current OS's shutdown screen, then powers off. */
  shutDown: () => void;
  /**
   * Shut the current OS down, switch platform and boot the new one. Absent outside App
   * (unit tests), where callers should update the setting directly instead.
   */
  switchPlatform?: (platform: Platform) => void;
}

const noop = () => {};
const FALLBACK: SessionValue = { lock: noop, logOut: noop, restart: noop, shutDown: noop };

const SessionContext = createContext<SessionValue>(FALLBACK);

export function SessionProvider({ value, children }: { value: SessionValue; children: ReactNode }) {
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  return use(SessionContext);
}
