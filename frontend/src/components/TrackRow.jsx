import { usePlayerSelector } from '../hooks/usePlayer';
import { useStorageVersion } from '../hooks/useStorage';
import { songs } from '../services/storage';
import { playTrack, togglePlay } from '../store/playerStore';
import { uiActions } from '../store/uiStore';
import { HeartIcon, MoreIcon } from './Icons';
import EqBars from './EqBars';

export default function TrackRow({ track, queue, index, showHeart = true }) {
  const currentId = usePlayerSelector((s) => s.currentTrack?.id);
  const playing = usePlayerSelector((s) => s.playing);
  useStorageVersion();

  const isCurrent = currentId === track.id;
  const isFav = songs.isFavorite(track.id);
  const num = typeof index === 'number' ? String(index + 1).padStart(2, '0') : null;

  const onTap = () => {
    if (isCurrent) {
      togglePlay();
      return;
    }
    playTrack(track, queue, typeof index === 'number' ? index : 0);
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-2.5 py-2 transition-colors duration-200 ${
        isCurrent ? 'border-accent/30 bg-accent/5' : 'border-transparent active:bg-surface-press'
      }`}
    >
      {num && (
        <span className="w-5 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-2">
          {num}
        </span>
      )}

      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-soft">
        <img src={track.thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        {isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            {playing ? <EqBars className="text-accent" /> : <span className="text-xs text-ink">▶</span>}
          </div>
        )}
      </div>

      <button onClick={onTap} className="min-w-0 flex-1 text-left" aria-label={`Play ${track.title}`}>
        <p className={`truncate text-[14px] ${isCurrent ? 'text-accent' : 'text-ink'}`}>
          {track.title}
        </p>
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {track.artist}
        </p>
      </button>

      {isCurrent && playing ? (
        <EqBars className="text-accent shrink-0" />
      ) : (
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-2">
          {track.duration}
        </span>
      )}

      {showHeart && (
        <button
          onClick={() => songs.toggleFavorite(track)}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          className="-mr-0.5 p-1.5 tap-scale"
        >
          <HeartIcon
            size={17}
            className={isFav ? 'text-accent-pink' : 'text-muted-2'}
            filled={isFav}
          />
        </button>
      )}

      <button
        onClick={() => uiActions.openMenu(track)}
        aria-label="More options"
        className="-mr-0.5 p-1.5 tap-scale"
      >
        <MoreIcon size={19} className="text-muted" />
      </button>
    </div>
  );
}
