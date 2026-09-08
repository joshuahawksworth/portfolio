import { createContext, use, type ReactNode } from 'react';

/** Power / session actions owned by App: lock the screen, restart the "machine", shut it down. */
export interface SessionValue {
  lock: () => void;
  logOut: () => void;
  restart: () => void;
  shutDown: () => void;
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
