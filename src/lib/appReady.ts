/**
 * An app that keeps loading after its window opens (DOOM boots DOSBox) reports its first
 * frame here; the Desktop keeps the Dock icon bouncing until then.
 */
export const APP_READY_EVENT = 'portfolio:app-ready';

export function reportAppReady(appId: string) {
  window.dispatchEvent(new CustomEvent(APP_READY_EVENT, { detail: appId }));
}
