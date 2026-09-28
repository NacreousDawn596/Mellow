// Lightweight localStorage abstraction with namespaced keys and a tiny
// reactivity bus so React components can re-render when data changes.
// NOTE: never store large audio blobs here — metadata/state only.

const PREFIX = 'mellow:';

let version = 0;
const listeners = new Set();

function bump() {
  version += 1;
  for (const l of [...listeners]) l();
}

const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      bump();
    } catch {
      /* quota / private mode — ignore */
    }
  },
  // Write without notifying subscribers (e.g. high-frequency player state).
  setQuiet(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      bump();
    } catch {
      /* ignore */
    }
  },
};

// React hooks integration
export function subscribeStorage(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function getStorageVersion() {
  return version;
}

// ------------------------------------------------------------------ songs

export const songs = {
  getFavorites() {
    return storage.get('favorites', []);
  },
  isFavorite(id) {
    return songs.getFavorites().some((t) => t.id === id);
  },
  toggleFavorite(track) {
    const favs = songs.getFavorites();
    const exists = favs.some((t) => t.id === track.id);
    const next = exists
      ? favs.filter((t) => t.id !== track.id)
      : [track, ...favs];
    storage.set('favorites', next);
    return next;
  },
  setFavorites(list) {
    storage.set('favorites', list);
  },
};

// -------------------------------------------------------- recently played

export const recentlyPlayed = {
  get() {
    return storage.get('recentlyPlayed', []);
  },
  add(track) {
    const list = recentlyPlayed.get();
    const existing = list.find((t) => t.id === track.id);
    const entry = {
      ...track,
      plays: (existing?.plays || 0) + 1,
      lastPlayedAt: Date.now(),
    };
    const next = [entry, ...list.filter((t) => t.id !== track.id)].slice(0, 60);
    storage.set('recentlyPlayed', next);
    return next;
  },
  markCompleted(id, percent) {
    const list = recentlyPlayed.get().map((t) =>
      t.id === id ? { ...t, completion: Math.max(t.completion || 0, Math.round(percent)) } : t
    );
    storage.set('recentlyPlayed', list);
  },
  clear() {
    storage.set('recentlyPlayed', []);
  },
};

// --------------------------------------------------------- search history

export const searchHistory = {
  get() {
    return storage.get('searchHistory', []);
  },
  add(q) {
    const clean = q.trim();
    if (!clean) return;
    const next = [
      clean,
      ...searchHistory.get().filter(
        (x) => x.toLowerCase() !== clean.toLowerCase()
      ),
    ].slice(0, 12);
    storage.set('searchHistory', next);
    return next;
  },
  remove(q) {
    storage.set('searchHistory', searchHistory.get().filter((x) => x !== q));
  },
  clear() {
    storage.set('searchHistory', []);
  },
};

// ------------------------------------------------------------ playlists

export const playlists = {
  get() {
    return storage.get('playlists', []);
  },
  save(list) {
    storage.set('playlists', list);
  },
  getById(id) {
    return playlists.get().find((p) => p.id === id) || null;
  },
  create(name) {
    const pl = {
      id: `pl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: name || 'New playlist',
      tracks: [],
      createdAt: Date.now(),
    };
    playlists.save([...playlists.get(), pl]);
    return pl;
  },
  rename(id, name) {
    playlists.save(
      playlists.get().map((p) => (p.id === id ? { ...p, name } : p))
    );
  },
  remove(id) {
    playlists.save(playlists.get().filter((p) => p.id !== id));
  },
  addTrack(id, track) {
    playlists.save(
      playlists.get().map((p) => {
        if (p.id !== id) return p;
        if (p.tracks.some((t) => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      })
    );
  },
  removeTrack(id, trackId) {
    playlists.save(
      playlists.get().map((p) =>
        p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p
      )
    );
  },
  reorderTracks(id, from, to) {
    playlists.save(
      playlists.get().map((p) => {
        if (p.id !== id) return p;
        const tracks = p.tracks.slice();
        const [moved] = tracks.splice(from, 1);
        tracks.splice(to, 0, moved);
        return { ...p, tracks };
      })
    );
  },
};

// ------------------------------------------------------------ downloads

export const downloads = {
  get() {
    return storage.get('downloads', []);
  },
  has(id) {
    return downloads.get().some((d) => d.id === id);
  },
  mark(track) {
    if (downloads.has(track.id)) return;
    storage.set('downloads', [
      { ...track, downloadedAt: Date.now() },
      ...downloads.get(),
    ]);
  },
  remove(id) {
    storage.set('downloads', downloads.get().filter((d) => d.id !== id));
  },
};

// ------------------------------------------------------------ settings

export const settings = {
  get() {
    return { quality: 'best', ...storage.get('settings', {}) };
  },
  set(patch) {
    storage.set('settings', { ...settings.get(), ...patch });
  },
};

// --------------------------------------------------------- search cache

export const searchCache = {
  get(q) {
    return storage.get(`searchCache:${q.toLowerCase()}`, null);
  },
  set(q, results) {
    storage.set(`searchCache:${q.toLowerCase()}`, results);
  },
};

export { storage };
export default storage;
