import { usePlayer } from '../hooks/usePlayer';
import { uiActions } from '../store/uiStore';
import { togglePlay } from '../store/playerStore';
import { PlayIcon, PauseIcon } from './Icons';
import EqBars from './EqBars';

function Spinner() {
  return (
    <span
      className="inline-block w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"
      aria-hidden="true"
    />
  );
}

export default function MiniPlayer() {
  const p = usePlayer();
  const track = p.currentTrack;
  if (!track) return null;

  const handleToggle = (e) => {
    e.stopPropagation();
    togglePlay();
  };

  return (
    <div
      className="w-full flex items-center gap-3 px-3 cursor-pointer text-left border-t border-border"
      style={{ height: 'var(--mini-h)', background: 'var(--surface-soft)' }}
      role="button"
      tabIndex={0}
      aria-label={`Open player — ${track.title}`}
      onClick={() => uiActions.openPlayer()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          uiActions.openPlayer();
        }
      }}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border shadow-card">
        <img src={track.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-display text-[15px] leading-tight text-ink truncate">{track.title}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted truncate">
          {track.artist}
        </div>
      </div>

      <span className="flex w-6 items-center justify-center text-accent">
        {p.playing && !p.loading ? <EqBars /> : null}
      </span>

      <button
        onClick={handleToggle}
        className="flex h-11 w-11 items-center justify-center text-ink tap-scale"
        aria-label={p.playing ? 'Pause' : 'Play'}
      >
        {p.loading ? <Spinner /> : p.playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
      </button>
    </div>
  );
}
