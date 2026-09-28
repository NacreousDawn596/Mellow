import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';
import { useStorageVersion } from '../hooks/useStorage';
import { api } from '../services/api';
import {
  recentlyPlayed,
  searchHistory,
  songs,
  playlists,
  searchCache,
} from '../services/storage';
import Section, { Scroller, SeeAllLink } from '../components/Section';
import EditorialLabel from '../components/EditorialLabel';
import TrackCard from '../components/TrackCard';
import PlaylistCard from '../components/PlaylistCard';
import { SkeletonCard } from '../components/Skeleton';
import { SparkleIcon, PlayIcon, PauseIcon } from '../components/Icons';
import { playQueue } from '../store/playerStore';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function FeaturedCard({ track }) {
  const p = usePlayer();
  const isCurrent = p.currentTrack?.id === track.id;

  return (
    <div
      className="px-5 mt-6"
      role="button"
      tabIndex={0}
      aria-label={`Play ${track.title}`}
      onClick={() => playQueue([track])}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playQueue([track]);
        }
      }}
    >
      <div className="relative w-full overflow-hidden rounded-2xl border border-border shadow-lift group cursor-pointer">
        <div className="absolute inset-0">
          <img
            src={track.thumbnail}
            alt=""
            className="h-full w-full object-cover opacity-55 group-active:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
        <div className="relative flex min-h-[200px] flex-col justify-end p-5 pt-28">
          <div className="mb-1.5 flex items-center gap-2">
            <SparkleIcon size={11} className="text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
              featured
            </span>
          </div>
          <div className="font-display text-[24px] leading-tight text-ink truncate">{track.title}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70 truncate">
            {track.artist}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg shadow-card">
              {isCurrent && p.playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-white/80 tabular-nums">
              {track.duration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  useStorageVersion();
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(false);

  const recents = recentlyPlayed.get();
  const history = searchHistory.get();
  const favs = songs.getFavorites();
  const pls = playlists.get();

  useEffect(() => {
    let alive = true;
    const q = 'chill lofi mix';
    const cached = searchCache.get(q);
    if (cached) {
      setDiscover(cached);
      return;
    }
    setLoading(true);
    api
      .search(q)
      .then((d) => {
        const list = (d.results || []).slice(0, 12);
        if (alive) {
          setDiscover(list);
          searchCache.set(q, list);
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const featured = recents[0] || discover[0];

  return (
    <div className="pt-safe">
      <header className="px-5 pt-6 pb-1">
        <div className="mb-3 flex items-center gap-2.5">
          <SparkleIcon size={13} className="text-accent" />
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted">
            mellow
          </span>
        </div>
        <h1 className="display text-ink">{greeting()}</h1>
        <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          music for the night
        </p>
      </header>

      {featured && <FeaturedCard track={featured} />}

      {recents.length > 0 && (
        <Section title="Continue listening" count={recents.length}>
          <Scroller>
            {recents.slice(0, 10).map((t, i) => (
              <TrackCard key={t.id} track={t} queue={recents} index={i} />
            ))}
          </Scroller>
        </Section>
      )}

      {history.length > 0 && (
        <Section title="Recently searched" action={<SeeAllLink to="/search" />}>
          <Scroller className="flex-nowrap">
            {history.map((q) => (
              <Link
                key={q}
                to={`/search?q=${encodeURIComponent(q)}`}
                className="shrink-0 rounded-full border border-border bg-surface px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted tap-scale"
              >
                {q}
              </Link>
            ))}
          </Scroller>
        </Section>
      )}

      {pls.length > 0 && (
        <Section title="Your playlists" count={pls.length} action={<SeeAllLink to="/library" />}>
          <Scroller>
            {pls.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </Scroller>
        </Section>
      )}

      {favs.length > 0 && (
        <Section title="Saved songs" count={favs.length} action={<SeeAllLink to="/library" />}>
          <Scroller>
            {favs.slice(0, 10).map((t, i) => (
              <TrackCard key={t.id} track={t} queue={favs} index={i} />
            ))}
          </Scroller>
        </Section>
      )}

      <Section title="Made for you">
        {loading ? (
          <Scroller>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </Scroller>
        ) : discover.length > 0 ? (
          <Scroller>
            {discover.slice(0, 12).map((t, i) => (
              <TrackCard key={t.id} track={t} queue={discover} index={i} />
            ))}
          </Scroller>
        ) : (
          <div className="px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Connect a YouTube API key to unlock suggestions.
          </div>
        )}
      </Section>

      <div className="h-8" />
    </div>
  );
}
