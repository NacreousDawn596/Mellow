import { Link } from 'react-router-dom';
import { MusicIcon } from './Icons';

export default function PlaylistCard({ playlist, className = 'w-[136px]' }) {
  const cover = playlist.tracks?.[0]?.thumbnail;

  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className={`${className} shrink-0 text-left group block no-select`}
      aria-label={`Open playlist ${playlist.name}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border shadow-card bg-surface-soft">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-accent">
            <MusicIcon size={34} strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute bottom-2 left-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/90">
          {playlist.tracks?.length ?? 0} {playlist.tracks?.length === 1 ? 'track' : 'tracks'}
        </div>
      </div>
      <div className="mt-2 text-[13px] font-medium text-ink truncate leading-tight">
        {playlist.name}
      </div>
    </Link>
  );
}
