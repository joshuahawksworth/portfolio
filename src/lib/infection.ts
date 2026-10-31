/**
 * Whether the machine has "caught" malware.exe. One module-level store shared by the
 * desktop (pop-ups, adverts, glitches), the Malwarebytes app (scan result, repair) and
 * anything else that wants to look unwell. It lives for the visit: a restart of the
 * pretend machine does not clean it, only Malwarebytes does.
 */
import { useSyncExternalStore } from 'react';

export type InfectionStatus = 'clean' | 'infected';

export interface InfectionState {
  status: InfectionStatus;
  /** When malware.exe finished "installing"; null while clean. */
  infectedAt: number | null;
  /** When Malwarebytes last finished a scan; null until the first one. */
  lastScanAt: number | null;
  /** Threats Malwarebytes has quarantined so far (its Detection History count). */
  detections: number;
}

const INITIAL: InfectionState = {
  status: 'clean',
  infectedAt: null,
  lastScanAt: null,
  detections: 0,
};

let state: InfectionState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<InfectionState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getInfection(): InfectionState {
  return state;
}

/** malware.exe has run: the desktop starts misbehaving. */
export function infect() {
  if (state.status === 'infected') return;
  set({ status: 'infected', infectedAt: Date.now() });
}

/** Malwarebytes has quarantined the threat: back to normal, one more detection on record. */
export function cure() {
  set({
    status: 'clean',
    infectedAt: null,
    detections: state.detections + (state.status === 'infected' ? 1 : 0),
  });
}

export function recordScan() {
  set({ lastScanAt: Date.now() });
}

/** Tests only: back to a never-infected machine. */
export function resetInfection() {
  set(INITIAL);
}

export function useInfection(): InfectionState {
  return useSyncExternalStore(subscribe, getInfection, getInfection);
}
