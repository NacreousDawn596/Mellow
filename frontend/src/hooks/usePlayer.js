import { useSyncExternalStore } from 'react';
import { subscribe, getState } from '../store/playerStore';

export function usePlayer() {
  return useSyncExternalStore(subscribe, getState, getState);
}

// Subscribe to a scalar slice of the player state. Only re-renders when the
// selected value changes — avoids re-rendering every row on position ticks.
export function usePlayerSelector(selector) {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(getState())
  );
}

export default usePlayer;
