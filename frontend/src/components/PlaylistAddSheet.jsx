import { useState } from 'react';
import { useSyncExternalStore } from 'react';
import { useStorageVersion } from '../hooks/useStorage';
import { subscribeUI, getUI, uiActions } from '../store/uiStore';
import { playlists } from '../services/storage';
import { CloseIcon, PlusIcon, MusicIcon, CheckIcon } from './Icons';

function useUI() {
  return useSyncExternalStore(subscribeUI, getUI, getUI);
}

export default function PlaylistAddSheet() {
  const ui = useUI();
  useStorageVersion();
  const track = ui.playlistAddTrack;
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  if (!track) return null;

  const list = playlists.get();

  const close = () => {
    setCreating(false);
    setName('');
    uiActions.closePlaylistAdd();
  };

  const addTo = (pl) => {
    playlists.addTrack(pl.id, track);
    close();
  };

  const create = () => {
    const pl = playlists.create(name.trim() || 'New playlist');
    playlists.addTrack(pl.id, track);
    close();
  };

  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label="Add to playlist">
      <div className="absolute inset-0 bg-black/60 anim-fade-in" onClick={close} />
        <div
          className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-3xl anim-slide-up overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full" style={{ background: 'var(--border-strong)' }} />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-display text-xl text-ink">Add to playlist</h2>
          <button
            onClick={close}
            className="w-10 h-10 flex items-center justify-center text-text tap-scale"
            aria-label="Close"
          >
            <CloseIcon size={22} />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto pb-3">
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-4 px-5 py-3.5 text-left active:bg-surface-press"
          >
            <span className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent">
              <PlusIcon size={20} />
            </span>
            <span className="text-[15px] text-text">New playlist</span>
          </button>

          {list.length === 0 && (
            <div className="text-center text-muted py-6 text-sm">
              No playlists yet — create one above.
            </div>
          )}

          {list.map((pl) => (
            <button
              key={pl.id}
              onClick={() => addTo(pl)}
              className="w-full flex items-center gap-4 px-5 py-3 text-left active:bg-surface-press"
            >
              <span className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent">
                <MusicIcon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] text-text truncate">{pl.name}</div>
                <div className="text-[12px] text-muted">{pl.tracks.length} songs</div>
              </div>
              {pl.tracks.some((t) => t.id === track.id) && (
                <CheckIcon size={18} className="text-accent" />
              )}
            </button>
          ))}
        </div>

        {creating && (
          <div className="p-4 border-t border-border flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder="Playlist name"
              className="flex-1 bg-surface rounded-xl px-4 py-3 text-text outline-none placeholder:text-muted-2 focus:ring-1 focus:ring-purple/40"
            />
            <button onClick={create} className="btn-primary">
              Create
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
