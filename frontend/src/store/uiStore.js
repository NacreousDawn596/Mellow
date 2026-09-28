// Small UI store for overlays: full player, queue sheet, context menu.

let ui = {
  fullPlayerOpen: false,
  queueOpen: false,
  menuTrack: null, // track currently targeted by the context menu
  playlistAddTrack: null, // track waiting for a playlist choice
  settingsOpen: false,
};

const listeners = new Set();

function set(patch) {
  ui = { ...ui, ...patch };
  for (const l of [...listeners]) l();
}

export const uiActions = {
  openPlayer() {
    set({ fullPlayerOpen: true });
  },
  closePlayer() {
    set({ fullPlayerOpen: false });
  },
  togglePlayer() {
    set({ fullPlayerOpen: !ui.fullPlayerOpen });
  },
  openQueue() {
    set({ queueOpen: true });
  },
  closeQueue() {
    set({ queueOpen: false });
  },
  toggleQueue() {
    set({ queueOpen: !ui.queueOpen });
  },
  openMenu(track) {
    set({ menuTrack: track });
  },
  closeMenu() {
    set({ menuTrack: null });
  },
  openPlaylistAdd(track) {
    set({ playlistAddTrack: track });
  },
  closePlaylistAdd() {
    set({ playlistAddTrack: null });
  },
  openSettings() {
    set({ settingsOpen: true });
  },
  closeSettings() {
    set({ settingsOpen: false });
  },
};

export function subscribeUI(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function getUI() {
  return ui;
}
