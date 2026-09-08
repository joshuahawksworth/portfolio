import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

/** System-level overlays that live above windows: Spotlight, Control Center, etc. */
export type SystemPanel =
  | 'spotlight'
  | 'controlCenter'
  | 'notificationCenter'
  | 'launchpad'
  | 'startMenu'
  | 'appleMenu';

interface SystemUIValue {
  panel: SystemPanel | null;
  open: (panel: SystemPanel) => void;
  toggle: (panel: SystemPanel) => void;
  close: () => void;
}

const SystemUIContext = createContext<SystemUIValue | null>(null);

export function SystemUIProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<SystemPanel | null>(null);
  const open = useCallback((p: SystemPanel) => setPanel(p), []);
  const toggle = useCallback((p: SystemPanel) => setPanel((cur) => (cur === p ? null : p)), []);
  const close = useCallback(() => setPanel(null), []);
  const value = useMemo(() => ({ panel, open, toggle, close }), [panel, open, toggle, close]);
  return <SystemUIContext value={value}>{children}</SystemUIContext>;
}

export function useSystemUI(): SystemUIValue {
  const ctx = use(SystemUIContext);
  if (!ctx) {
    // Allow components (e.g. MenuBar in tests) to render outside the provider.
    return { panel: null, open: () => {}, toggle: () => {}, close: () => {} };
  }
  return ctx;
}
