import { useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { useStorageVersion } from '../hooks/useStorage';
import { subscribeUI, getUI, uiActions } from '../store/uiStore';
import { useDownloads } from '../hooks/useDownloads';
import { songs } from '../services/storage';
import * as store from '../store/playerStore';
import DynamicBackground from './DynamicBackground';
import SeekBar from './SeekBar';
import Spinner from './Spinner';
import {
  ChevronDownIcon,
  MoreIcon,
  HeartIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  PlayIcon,
  PauseIcon,
  RepeatIcon,
  RepeatOneIcon,
  ListIcon,
  DownloadIcon,
  CheckIcon,
} from './Icons';
import { formatTime, parseDurationToSeconds } from '../utils/format';

function useUI() {
  return useSyncExternalStore(subscribeUI, getUI, getUI);
}

export default function FullPlayer() {
  const ui = useUI();
  const p = usePlayer();
  const { active, downloadTrack } = useDownloads();
  useStorageVersion();

  const open = ui.fullPlayerOpen;
  const track = p.currentTrack;

  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(null);

  const duration = track ? parseDurationToSeconds(track.duration) : 0;
  const isFav = track ? songs.isFavorite(track.id) : false;

  if (!open || !track) return null;

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (touchStartY.current == null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > 110) uiActions.closePlayer();
    setDragY(0);
    touchStartY.current = null;
  };

  const repeatLabel =
    p.repeat === 'one' ? 'Repeat one' : p.repeat === 'all' ? 'Repeat all' : 'Repeat off';
  const dlState = active[track.id]?.status;
  const dlProgress = active[track.id]?.progress || 0;

  return (
    <div
      className="fixed inset-0 z-[60] anim-fade-in overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      <DynamicBackground track={track} />

      <div
        className="relative z-10 flex h-full flex-col px-6 pt-safe"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragY ? 'none' : 'transform 0.32s cubic-bezier(0.22,1,0.36,1)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* header */}
        <div className="flex items-center justify-between pt-3 anim-slide-up">
          <button
            onClick={() => uiActions.closePlayer()}
            aria-label="Minimize player"
            className="flex h-11 w-11 items-center justify-center text-ink tap-scale"
          >
            <ChevronDownIcon size={26} strokeWidth={1.6} />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            now playing
          </span>
          <button
            onClick={() => uiActions.openMenu(track)}
            aria-label="More options"
            className="flex h-11 w-11 items-center justify-center text-ink tap-scale"
          >
            <MoreIcon size={22} />
          </button>
        </div>

        {/* artwork with soft glow */}
        <div className="flex flex-1 min-h-0 items-center justify-center py-6">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-[3rem] opacity-60 blur-3xl"
              style={{ background: 'radial-gradient(circle, var(--glow-lavender), transparent 70%)' }}
            />
            <div
              className={`relative aspect-square w-[min(74vw,300px)] overflow-hidden rounded-2xl border border-border shadow-lift anim-scale-in ${
                p.playing ? 'artwork-playing' : ''
              }`}
            >
              <img
                key={track.id}
                src={track.thumbnail}
                alt={track.title}
                className="h-full w-full object-cover artwork-fade"
              />
            </div>
          </div>
        </div>

        {/* title */}
        <div className="anim-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-[26px] leading-tight text-ink truncate">
                {track.title}
              </h1>
              <p className="mt-1.5 truncate font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {track.artist}
              </p>
            </div>
            <button
              onClick={() => songs.toggleFavorite(track)}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className="shrink-0 tap-scale"
            >
              <HeartIcon
                key={String(isFav)}
                size={24}
                className={`${isFav ? 'text-accent-pink' : 'text-muted'} heart-pop`}
                filled={isFav}
              />
            </button>
          </div>
        </div>

        {/* progress */}
        <div className="mt-5 anim-slide-up">
          <SeekBar value={p.position} max={duration} onSeek={store.seek} />
          <div className="mt-0.5 flex justify-between font-mono text-[10px] tracking-[0.15em] text-muted tabular-nums">
            <span>{formatTime(p.position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* error */}
        {p.error && !p.loading && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 anim-fade-in">
            <div className="min-w-0">
              <p className="font-display text-[15px] leading-tight text-ink">
                {p.errorCode === 'throttled' ? "Couldn't reach YouTube" : 'Something went wrong'}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {p.errorCode === 'throttled'
                  ? 'Rate limited — wait a moment'
                  : p.errorCode === 'unavailable'
                    ? 'Song unavailable'
                    : 'The song couldn\'t be loaded'}
              </p>
            </div>
            <button
              onClick={() => store.togglePlay()}
              className="btn-primary shrink-0"
              style={{ padding: '10px 14px' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* transport */}
        <div className="mt-5 flex items-center justify-center gap-6 anim-slide-up">
          <button
            onClick={() => store.toggleShuffle()}
            aria-label={p.shuffle ? 'Shuffle on' : 'Shuffle off'}
            className={`tap-scale ${p.shuffle ? 'text-accent' : 'text-muted'}`}
          >
            <ShuffleIcon size={20} strokeWidth={1.6} />
          </button>
          <button onClick={() => store.prev()} aria-label="Previous" className="text-ink tap-scale">
            <SkipBackIcon size={30} />
          </button>
          <button
            onClick={() => store.togglePlay()}
            aria-label={p.playing ? 'Pause' : 'Play'}
            className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-accent text-bg tap-scale transition-shadow hover:shadow-[0_0_40px_var(--glow-pink)]"
          >
            {p.loading ? (
              <Spinner size={28} />
            ) : p.playing ? (
              <PauseIcon size={30} />
            ) : (
              <PlayIcon size={30} />
            )}
          </button>
          <button onClick={() => store.next()} aria-label="Next" className="text-ink tap-scale">
            <SkipForwardIcon size={30} />
          </button>
          <button
            onClick={() => store.cycleRepeat()}
            aria-label={repeatLabel}
            className={`relative tap-scale ${p.repeat !== 'none' ? 'text-accent' : 'text-muted'}`}
          >
            {p.repeat === 'one' ? <RepeatOneIcon size={20} strokeWidth={1.6} /> : <RepeatIcon size={20} strokeWidth={1.6} />}
            {p.repeat === 'one' && (
              <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {/* secondary */}
        <div className="mt-6 flex items-center justify-center gap-8 pb-6 safe-bottom anim-slide-up">
          <button
            onClick={() => uiActions.openQueue()}
            aria-label="Open queue"
            className="flex flex-col items-center gap-1.5 text-muted tap-scale"
          >
            <ListIcon size={20} strokeWidth={1.6} />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em]">queue</span>
          </button>
          <button
            onClick={() => downloadTrack(track)}
            aria-label="Download"
            className="flex flex-col items-center gap-1.5 text-muted tap-scale"
          >
            {dlState === 'downloading' ? (
              <Spinner size={20} />
            ) : dlState === 'done' ? (
              <CheckIcon size={20} className="text-accent" />
            ) : (
              <DownloadIcon size={20} strokeWidth={1.6} />
            )}
            <span className="font-mono text-[9px] uppercase tracking-[0.18em]">
              {dlState === 'downloading'
                ? `${Math.round(dlProgress * 100)}%`
                : dlState === 'done'
                  ? 'offline'
                  : 'download'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
