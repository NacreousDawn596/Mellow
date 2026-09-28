import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStorageVersion } from '../hooks/useStorage';
import { playlists, songs, recentlyPlayed } from '../services/storage';
import { uiActions } from '../store/uiStore';
import Section from '../components/Section';
import EditorialLabel from '../components/EditorialLabel';
import PlaylistCard from '../components/PlaylistCard';
import TrackRow from '../components/TrackRow';
import EmptyState from '../components/EmptyState';
import {
  PlusIcon,
  HeartIcon,
  ClockIcon,
  MusicIcon,
  PencilIcon,
  TrashIcon,
  SettingsIcon,
} from '../components/Icons';

export default function Library() {
  useStorageVersion();
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');

  const pls = playlists.get();
  const favs = songs.getFavorites();
  const recents = recentlyPlayed.get();

  const create = () => {
    const pl = playlists.create('New playlist');
    setEditingId(pl.id);
    setName(pl.name);
  };

  const commitRename = () => {
    if (editingId && name.trim()) playlists.rename(editingId, name.trim());
    setEditingId(null);
  };

  return (
    <div className="pt-safe px-5 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <EditorialLabel number="03" label="library" accent />
          <h1 className="display mt-3 text-ink">Library</h1>
          <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Your music, saved locally
          </p>
        </div>
        <button
          onClick={() => uiActions.openSettings()}
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center text-muted tap-scale"
        >
          <SettingsIcon size={22} strokeWidth={1.6} />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between mb-3">
        <h2 className="label label-accent">Playlists</h2>
        <button
          onClick={create}
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent tap-scale"
        >
          <PlusIcon size={15} /> New
        </button>
      </div>

      {pls.length === 0 ? (
        <EmptyState
          icon={<MusicIcon size={28} />}
          title="No playlists yet"
          subtitle="Create a playlist and fill it with songs you love."
          action={
            <button onClick={create} className="btn-primary">
              Create playlist
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {pls.map((pl) => (
            <div key={pl.id}>
              <PlaylistCard playlist={pl} className="w-full" />
              <div className="flex justify-end gap-1 mt-0.5">
                <button
                  onClick={() => {
                    setEditingId(pl.id);
                    setName(pl.name);
                  }}
                  aria-label={`Rename ${pl.name}`}
                  className="p-1.5 text-muted tap-scale"
                >
                  <PencilIcon size={15} />
                </button>
                <button
                  onClick={() => playlists.remove(pl.id)}
                  aria-label={`Delete ${pl.name}`}
                  className="p-1.5 text-muted tap-scale"
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          role="dialog"
          aria-modal="true"
          aria-label="Rename playlist"
        >
          <div className="absolute inset-0 bg-black/70 anim-fade-in" onClick={commitRename} />
          <div className="relative glass-strong rounded-2xl p-5 w-full max-w-sm anim-scale-in">
            <h3 className="font-display text-xl text-ink">Rename playlist</h3>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-[13px] text-ink outline-none placeholder:text-muted-2 focus:border-accent/40"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setEditingId(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={commitRename} className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {favs.length > 0 && (
        <Section
          title="Favorites"
          action={<HeartIcon size={18} className="text-accent-pink" />}
        >
          <div className="space-y-0.5">
            {favs.map((t, i) => (
              <TrackRow key={t.id} track={t} queue={favs} index={i} />
            ))}
          </div>
        </Section>
      )}

      {recents.length > 0 && (
        <Section
          title="Recently played"
          action={<ClockIcon size={18} className="text-muted" />}
        >
          <div className="space-y-0.5">
            {recents.slice(0, 12).map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} track={t} queue={recents} index={i} />
            ))}
          </div>
        </Section>
      )}

      <div className="h-8" />
    </div>
  );
}
