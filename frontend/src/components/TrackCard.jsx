import { usePlayerSelector } from '../hooks/usePlayer';
import { playTrack } from '../store/playerStore';
import { PlayIcon } from './Icons';
import EqBars from './EqBars';

export default function TrackCard({ track, queue, index }) {
  const currentId = usePlayerSelector((s) => s.currentTrack?.id);
  const playing = usePlayerSelector((s) => s.playing);
  const isCurrent = currentId === track.id;

  return (
    <button
      onClick={() => playTrack(track, queue, typeof index === 'number' ? index : 0)}
      className="w-[136px] shrink-0 text-left group no-select"
      aria-label={`Play ${track.title}`}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border shadow-card bg-surface-soft">
        <img
          src={track.thumbnail}
          alt=""
          loading="lazy" decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-active:scale-105"
        />
        {isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            {playing ? <EqBars className="text-accent" /> : <PlayIcon size={20} className="text-ink" />}
          </div>
        )}
      </div>
      <div className="mt-2 text-[13px] font-medium text-ink truncate leading-tight">
        {track.title}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted truncate">
        {track.artist}
      </div>
    </button>
  );
}
