import { useSyncExternalStore } from 'react';
import { subscribeStorage, getStorageVersion } from '../services/storage';

// Re-render a component whenever any localStorage-backed state changes.
export function useStorageVersion() {
  return useSyncExternalStore(subscribeStorage, getStorageVersion, getStorageVersion);
}

export default useStorageVersion;
