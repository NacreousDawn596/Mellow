import { useSyncExternalStore } from 'react';
import { subscribeStorage, getStorageVersion, playlists } from '../services/storage';

export function usePlaylists() {
  useSyncExternalStore(subscribeStorage, getStorageVersion, getStorageVersion);
  return playlists.get();
}

export default usePlaylists;
