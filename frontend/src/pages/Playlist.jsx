import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStorageVersion } from '../hooks/useStorage';
import { usePlayer } from '../hooks/usePlayer';
import { playlists } from '../services/storage';
import { playQueue, toggleShuffle } from '../store/playerStore';
import TrackRow from '../components/TrackRow';
import EmptyState from '../components/EmptyState';
import {
  ArrowLeftIcon,
  PlayIcon,
  ShuffleIcon,
  PencilIcon,
  TrashIcon,
  MusicIcon,
  GripIcon,
} from '../components/Icons';

const ROW_H = 56;

export default function Playlist() {
  useStorageVersion();
  const { id } = useParams();
  const navigate = useNavigate();
  const p = usePlayer();
  const pl = playlists.getById(id);

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  const dragIndex = useRef(null);
  const [overIndex, setOverIndex] = useState(null);
  const listRef = useRef(null);

  if (!pl) {
    return (
      <div className="pt-safe px-5 pt-5">
        <button onClick={() => navigate('/library')} className="mb-4 text-text tap-scale">
          <ArrowLeftIcon size={24} />
        </button>
        <EmptyState
          icon={<MusicIcon size={28} />}
          title="Playlist not found"
          subtitle="This playlist may have been deleted."
        />
      </div>
    );
  }

  const tracks = pl.tracks;
  const cover = tracks[0]?.thumbnail;

  const play = () => tracks.length && playQueue(tracks, 0);
  const shufflePlay = () => {
    if (!tracks.length) return;
    if (!p.shuffle) toggleShuffle();
    playQueue(tracks, 0);
  };

  const commitRename = () => {
    if (name.trim()) playlists.rename(pl.id, name.trim());
    setRenaming(false);
  };

  const onPointerDown = (e, index) => {
    dragIndex.current = index;
    setOverIndex(index);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (dragIndex.current == null || !listRef.current) return;
    const rect = listRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + listRef.current.scrollTop;
    let target = Math.floor(y / ROW_H);
    target = Math.max(0, Math.min(tracks.length - 1, target));
    if (target !== overIndex) setOverIndex(target);
  };
  const onPointerUp = () => {
    if (dragIndex.current != null && overIndex != null && dragIndex.current !== overIndex) {
      playlists.reorderTracks(pl.id, dragIndex.current, overIndex);
    }
    dragIndex.current = null;
    setOverIndex(null);
  };

  return (
    <div className="pt-safe">
      {/* header */}
      <div className="px-3 pt-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center text-text tap-scale"
          aria-label="Back"
        >
          <ArrowLeftIcon size={24} />
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setName(pl.name);
              setRenaming(true);
            }}
            className="p-2 text-muted tap-scale"
            aria-label="Rename playlist"
          >
            <PencilIcon size={18} />
          </button>
          <button
            onClick={() => {
              playlists.remove(pl.id);
              navigate('/library');
            }}
            className="p-2 text-muted tap-scale"
            aria-label="Delete playlist"
          >
            <TrashIcon size={18} />
          </button>
        </div>
      </div>

      {/* hero */}
      <div className="px-6 pt-2 flex items-center gap-5">
        <div className="w-28 h-28 overflow-hidden rounded-2xl border border-border shadow-card shrink-0">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent bg-surface-soft">
              <MusicIcon size={38} strokeWidth={1.4} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted mb-1.5">Playlist</div>
          <h1 className="font-display text-[26px] leading-tight text-ink break-words">{pl.name}</h1>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-3 px-6 mt-6">
        <button onClick={play} disabled={!tracks.length} className="btn-primary flex-1">
          <PlayIcon size={15} /> Play
        </button>
        <button onClick={shufflePlay} disabled={!tracks.length} className="btn-ghost flex-1">
          <ShuffleIcon size={15} /> Shuffle
        </button>
      </div>

      {/* tracks */}
      <div className="mt-4">
        {tracks.length === 0 ? (
          <EmptyState
            icon={<MusicIcon size={28} />}
            title="This playlist is empty"
            subtitle="Add songs from search or the player menu."
          />
        ) : (
          <div ref={listRef} className="px-2">
            {tracks.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className={`flex items-center rounded-2xl transition-colors ${
                  overIndex === i && dragIndex.current != null ? 'bg-surface-press' : ''
                }`}
              >
                <div
                  onPointerDown={(e) => onPointerDown(e, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  className="cursor-grab touch-none px-1 py-2 text-muted-2"
                  aria-label="Drag to reorder"
                >
                  <GripIcon size={16} />
                </div>
                <div className="flex-1">
                  <TrackRow track={track} queue={tracks} index={i} />
                </div>
                <button
                  onClick={() => playlists.removeTrack(pl.id, track.id)}
                  className="p-2 text-muted tap-scale"
                  aria-label="Remove from playlist"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-8" />

      {renaming && (
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
              <button onClick={() => setRenaming(false)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={commitRename} className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
