// Mellow player store — a small external store wrapping a single <audio>
// element, with localStorage persistence and a proper queue/shuffle/repeat
// model. No heavy state library required.

import { storage, recentlyPlayed, settings } from '../services/storage';
import { api } from '../services/api';
import { audioCache } from '../services/idb';

const KEY = 'playerState';

const DEFAULT_STATE = {
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  shuffleOrder: null, // array of indices when shuffle is on
  volume: 0.8,
  shuffle: false,
  repeat: 'none', // 'none' | 'all' | 'one'
  position: 0,
  playing: false,
  loading: false,
  error: null,
  errorCode: null, // 'throttled' | 'unavailable' | 'network_error'
  source: 'youtube', // 'youtube' | 'local'
  streamState: 'idle', // 'idle' | 'resolving' | 'ready' | 'playing' | 'error'
};

function loadState() {
  const saved = storage.get(KEY, {});
  const s = { ...DEFAULT_STATE, ...saved };
  s.queue = Array.isArray(saved.queue) ? saved.queue : [];
  s.volume = Number.isFinite(saved.volume) ? saved.volume : 0.8;
  s.position = Number(saved.position) || 0;
  s.repeat = ['none', 'all', 'one'].includes(saved.repeat) ? saved.repeat : 'none';
  s.shuffleOrder = null;
  s.streamState = 'idle';
  s.loading = false;
  s.error = null;
  s.errorCode = null;
  return s;
}

let state = loadState();
let pendingSeek = state.position || 0;
let retries = 0;

const listeners = new Set();
const audio = typeof window !== 'undefined' ? new Audio() : null;

function emit() {
  for (const l of [...listeners]) l(state);
}

function setState(partial) {
  state = { ...state, ...partial };
  emit();
}

function persist() {
  storage.setQuiet(KEY, {
    currentTrack: state.currentTrack,
    queue: state.queue,
    currentIndex: state.currentIndex,
    volume: state.volume,
    shuffle: state.shuffle,
    repeat: state.repeat,
    position: audio ? Math.floor(audio.currentTime || 0) : state.position,
  });
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persist();
  }, 600);
}

// ------------------------------------------------------------------ audio

if (audio) {
  audio.preload = 'auto';
  audio.volume = state.volume;
  // NOTE: no `crossOrigin` here — plain <audio> playback of cross-origin
  // googlevideo.com streams must run in no-cors mode; setting crossOrigin
  // would require CORS headers that YouTube doesn't send.

  audio.addEventListener('timeupdate', () => {
    state = { ...state, position: audio.currentTime };
    emit();
    schedulePersist();
  });

  audio.addEventListener('play', () =>
    setState({ playing: true, error: null, streamState: 'playing' })
  );
  audio.addEventListener('pause', () => {
    setState({ playing: false });
    persist();
  });

  audio.addEventListener('waiting', () => setState({ loading: true }));
  audio.addEventListener('playing', () =>
    setState({ loading: false, playing: true, streamState: 'playing' })
  );
  audio.addEventListener('canplay', () => setState({ loading: false, streamState: 'ready' }));

  audio.addEventListener('ended', () => {
    // mark completion for smart history
    if (state.currentTrack) {
      const d = audio.duration || 0;
      const pct = d > 0 ? Math.round((audio.currentTime / d) * 100) : 100;
      recentlyPlayed.markCompleted(state.currentTrack.id, pct);
    }
    if (state.repeat === 'one') {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    next();
  });

  audio.addEventListener('error', async () => {
    if (!state.currentTrack || state.loading) return;
    if (retries >= 2) {
      setState({
        loading: false,
        playing: false,
        error: 'Playback failed. Try again.',
        errorCode: 'network_error',
        streamState: 'error',
      });
      return;
    }
    retries += 1;
    pendingSeek = audio.currentTime || 0;
    await resolveAndPlay(state.currentTrack, true);
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', persist);
  }
}

// ---------------------------------------------------------------- helpers

function buildShuffleOrder(queue, currentIndex) {
  const n = queue.length;
  const order = [];
  const rest = [];
  for (let i = 0; i < n; i += 1) {
    if (i === currentIndex) order.push(i);
    else rest.push(i);
  }
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return order.concat(rest);
}

// Return the next queued track (respecting shuffle/repeat) without playing it.
// Used to warm the backend's stream cache one track ahead.
function peekNext() {
  const { queue, currentIndex, shuffle, shuffleOrder, repeat } = state;
  const n = queue.length;
  if (n === 0) return null;
  if (shuffle && shuffleOrder && shuffleOrder.length === n) {
    const pos = shuffleOrder.indexOf(currentIndex);
    const ni = pos < n - 1 ? shuffleOrder[pos + 1] : repeat === 'all' ? shuffleOrder[0] : null;
    return ni == null ? null : queue[ni];
  }
  if (currentIndex < n - 1) return queue[currentIndex + 1];
  return repeat === 'all' ? queue[0] : null;
}

let currentObjectUrl = null;

async function resolveAndPlay(track, resume = false) {
  setState({
    currentTrack: track,
    loading: true,
    error: null,
    errorCode: null,
    streamState: 'resolving',
  });
  try {
    // Local-first: play the downloaded copy if we have one.
    const local = await audioCache.get(track.id).catch(() => null);
    if (local?.blob) {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = URL.createObjectURL(local.blob);
      audio.src = currentObjectUrl;
      setState({ source: 'local' });
    } else {
      const quality = settings.get().quality || 'best';
      const info = await api.resolveStream(track.id, quality);
      audio.src = info.url;
      setState({ source: 'youtube' });
    }

    if (resume && pendingSeek > 1) {
      audio.currentTime = pendingSeek;
    } else {
      audio.currentTime = 0;
      pendingSeek = 0;
    }
    await audio.play();
    setState({ loading: false, playing: true, error: null, streamState: 'playing' });
    prefetchNext();
  } catch (err) {
    setState({
      loading: false,
      playing: false,
      error: err?.message || "The song couldn't be loaded.",
      errorCode: err?.code || 'unavailable',
      streamState: 'error',
    });
  }
}

// Warm the backend cache for the next track so "next" is instant.
function prefetchNext() {
  const next = peekNext();
  if (!next || next.id === state.currentTrack?.id) return;
  const quality = settings.get().quality || 'best';
  api.resolveStream(next.id, quality).catch(() => {});
}

function playIndex(index) {
  const track = state.queue[index];
  if (!track) return;
  pendingSeek = 0;
  recentlyPlayed.add(track);
  setState({ currentIndex: index, currentTrack: track });
  resolveAndPlay(track);
}

// ----------------------------------------------------------------- actions

export function playTrack(track, queue, index = 0) {
  retries = 0;
  const q = queue && queue.length ? queue : [track];
  const i = Math.max(0, Math.min(index, q.length - 1));
  pendingSeek = 0;
  recentlyPlayed.add(track);
  setState({
    queue: q,
    currentIndex: i,
    currentTrack: track,
    shuffleOrder: state.shuffle ? buildShuffleOrder(q, i) : null,
  });
  resolveAndPlay(track);
}

export function playQueue(queue, startIndex = 0) {
  retries = 0;
  if (!queue.length) return;
  const i = Math.max(0, Math.min(startIndex, queue.length - 1));
  const track = queue[i];
  pendingSeek = 0;
  recentlyPlayed.add(track);
  setState({
    queue,
    currentIndex: i,
    currentTrack: track,
    shuffleOrder: state.shuffle ? buildShuffleOrder(queue, i) : null,
  });
  resolveAndPlay(track);
}

export function togglePlay() {
  if (!audio) return;
  if (!state.currentTrack) return;
  if (!audio.src) {
    resolveAndPlay(state.currentTrack, true);
    return;
  }
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

export function next() {
  const { queue, currentIndex, repeat, shuffle, shuffleOrder } = state;
  const n = queue.length;
  if (n === 0) return;
  let ni;
  if (shuffle && shuffleOrder && shuffleOrder.length === n) {
    const pos = shuffleOrder.indexOf(currentIndex);
    if (pos < 0 || pos >= n - 1) {
      if (repeat === 'all') {
        ni = shuffleOrder[0];
      } else {
        setState({ playing: false });
        return;
      }
    } else {
      ni = shuffleOrder[pos + 1];
    }
  } else if (currentIndex >= n - 1) {
    if (repeat === 'all') ni = 0;
    else {
      setState({ playing: false });
      return;
    }
  } else {
    ni = currentIndex + 1;
  }
  retries = 0;
  playIndex(ni);
}

export function prev() {
  const { queue, currentIndex, shuffle, shuffleOrder } = state;
  const n = queue.length;
  if (n === 0) return;
  if (audio && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  let ni;
  if (shuffle && shuffleOrder && shuffleOrder.length === n) {
    const pos = shuffleOrder.indexOf(currentIndex);
    ni = pos <= 0 ? shuffleOrder[n - 1] : shuffleOrder[pos - 1];
  } else {
    ni = currentIndex <= 0 ? n - 1 : currentIndex - 1;
  }
  retries = 0;
  playIndex(ni);
}

export function seek(seconds) {
  if (!audio || !state.currentTrack) return;
  audio.currentTime = seconds;
  setState({ position: seconds });
}

export function setVolume(v) {
  const vol = Math.max(0, Math.min(1, v));
  if (audio) audio.volume = vol;
  setState({ volume: vol });
  persist();
}

export function toggleShuffle() {
  const shuffle = !state.shuffle;
  const shuffleOrder = shuffle
    ? buildShuffleOrder(state.queue, state.currentIndex)
    : null;
  setState({ shuffle, shuffleOrder });
  persist();
}

export function cycleRepeat() {
  const order = ['none', 'all', 'one'];
  const idx = order.indexOf(state.repeat);
  setState({ repeat: order[(idx + 1) % order.length] });
  persist();
}

// -------------------------------------------------------------- queue ops

export function addToQueue(track) {
  setState({ queue: [...state.queue, track] });
}

export function playNext(track) {
  const queue = [...state.queue];
  const idx = Math.max(0, state.currentIndex + 1);
  queue.splice(idx, 0, track);
  setState({
    queue,
    shuffleOrder: state.shuffle
      ? buildShuffleOrder(queue, state.currentIndex)
      : null,
  });
}

export function removeFromQueue(index) {
  const queue = state.queue.slice();
  queue.splice(index, 1);
  let currentIndex = state.currentIndex;
  if (index < currentIndex) currentIndex -= 1;
  setState({
    queue,
    currentIndex,
    shuffleOrder: state.shuffle ? buildShuffleOrder(queue, currentIndex) : null,
  });
}

export function reorderQueue(from, to) {
  const queue = state.queue.slice();
  const [moved] = queue.splice(from, 1);
  queue.splice(to, 0, moved);
  let currentIndex = state.currentIndex;
  if (from === currentIndex) currentIndex = to;
  else if (from < currentIndex && to >= currentIndex) currentIndex -= 1;
  else if (from > currentIndex && to <= currentIndex) currentIndex += 1;
  setState({
    queue,
    currentIndex,
    shuffleOrder: state.shuffle ? buildShuffleOrder(queue, currentIndex) : null,
  });
}

export function clearQueue() {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  pendingSeek = 0;
  setState({
    queue: [],
    currentIndex: -1,
    currentTrack: null,
    shuffleOrder: null,
    playing: false,
    position: 0,
    error: null,
  });
  persist();
}

export function jumpToIndex(index) {
  retries = 0;
  playIndex(index);
}

export function dismissError() {
  setState({ error: null });
}

// --------------------------------------------------------------- exports

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function getState() {
  return state;
}
export function getAudio() {
  return audio;
}
