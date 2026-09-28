import { useSyncExternalStore } from 'react';
import { api } from '../services/api';
import { audioCache } from '../services/idb';
import { downloads } from '../services/storage';

// Module-level reactive download state, shared across all components.
let active = {};
const listeners = new Set();

function set(id, patch) {
  active = { ...active, [id]: { ...active[id], ...patch } };
  for (const l of [...listeners]) l();
}
function unset(id) {
  active = { ...active };
  delete active[id];
  for (const l of [...listeners]) l();
}
function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const getSnapshot = () => active;

function extFromType(type) {
  if (!type) return 'm4a';
  if (type.includes('webm')) return 'webm';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('mpeg')) return 'mp3';
  return 'm4a';
}

// Download a track into IndexedDB so future plays use the local copy.
export async function downloadTrack(track) {
  if (!track?.id) return;
  if (await audioCache.has(track.id)) {
    downloads.mark(track);
    set(track.id, { status: 'done', progress: 1, track });
    return;
  }

  set(track.id, { status: 'downloading', progress: 0, track });
  try {
    const res = await fetch(api.downloadUrl(track.id));
    if (!res.ok) throw new Error('Download failed');

    const total = Number(res.headers.get('Content-Length')) || 0;
    const type = res.headers.get('Content-Type') || 'audio/mp4';

    if (!res.body || !total) {
      const blob = await res.blob();
      await audioCache.put(track.id, { blob, mimeType: type, ext: extFromType(type) });
      downloads.mark(track);
      set(track.id, { status: 'done', progress: 1, track });
      return;
    }

    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      set(track.id, { status: 'downloading', progress: Math.min(1, received / total), track });
    }

    const blob = new Blob(chunks, { type });
    await audioCache.put(track.id, { blob, mimeType: type, ext: extFromType(type) });
    downloads.mark(track);
    set(track.id, { status: 'done', progress: 1, track });
  } catch (e) {
    set(track.id, { status: 'error', progress: 0, track });
  }
}

export async function removeDownload(track) {
  if (!track?.id) return;
  await audioCache.delete(track.id).catch(() => {});
  downloads.remove(track.id);
  unset(track.id);
}

export function useDownloads() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    active: state,
    downloadTrack,
    removeDownload,
    isDownloaded: (id) => downloads.has(id),
  };
}

export default useDownloads;
