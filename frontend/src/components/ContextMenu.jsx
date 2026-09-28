import { useSyncExternalStore } from 'react';
import { useStorageVersion } from '../hooks/useStorage';
import { subscribeUI, getUI, uiActions } from '../store/uiStore';
import { useDownloads } from '../hooks/useDownloads';
import { songs } from '../services/storage';
import { playTrack, addToQueue, playNext } from '../store/playerStore';
import {
  PlayIcon,
  ListIcon,
  PlusIcon,
  DownloadIcon,
  HeartIcon,
  MusicIcon,
} from './Icons';

function useUI() {
  return useSyncExternalStore(subscribeUI, getUI, getUI);
}

export default function ContextMenu() {
  const ui = useUI();
  const { active, downloadTrack, removeDownload, isDownloaded } = useDownloads();
  useStorageVersion();

  const track = ui.menuTrack;
  if (!track) return null;

  const isFav = songs.isFavorite(track.id);
  const dlDone = isDownloaded(track.id);
  const dlState = active[track.id]?.status;
  const close = () => uiActions.closeMenu();

  const actions = [
    { label: 'Play', icon: PlayIcon, run: () => playTrack(track) },
    { label: 'Play next', icon: ListIcon, run: () => playNext(track) },
    { label: 'Add to queue', icon: PlusIcon, run: () => addToQueue(track) },
    {
      label: 'Add to playlist',
      icon: MusicIcon,
      run: () => {
        uiActions.closeMenu();
        uiActions.openPlaylistAdd(track);
      },
    },
    {
      label:
        dlDone ? 'Remove download' : dlState === 'downloading' ? 'Downloading…' : 'Download',
      icon: DownloadIcon,
      run: () => {
        if (dlDone) removeDownload(track);
        else downloadTrack(track);
      },
    },
    {
      label: isFav ? 'Remove from favorites' : 'Add to favorites',
      icon: HeartIcon,
      run: () => songs.toggleFavorite(track),
    },
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Track options">
      <div className="absolute inset-0 bg-black/60 anim-fade-in" onClick={close} />
        <div
          className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-3xl anim-slide-up overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full" style={{ background: 'var(--border-strong)' }} />
        </div>
        <div className="flex items-center gap-3 px-5 pt-3 pb-3 border-b border-border">
          <img src={track.thumbnail} alt="" className="w-12 h-12 rounded-lg border border-border object-cover" />
          <div className="min-w-0">
            <div className="font-display text-[17px] leading-tight text-ink truncate">{track.title}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted truncate">
              {track.artist}
            </div>
          </div>
        </div>
        <div className="py-2">
          {actions.map(({ label, icon: Icon, run }) => (
            <button
              key={label}
              onClick={() => {
                close();
                run();
              }}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left active:bg-surface-press"
            >
              <Icon size={20} className="text-muted" />
              <span className="text-[15px] text-text">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
