import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { searchHistory } from '../services/storage';
import { useStorageVersion } from '../hooks/useStorage';
import SearchBar from '../components/SearchBar';
import TrackRow from '../components/TrackRow';
import EditorialLabel from '../components/EditorialLabel';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { SearchIcon, ClockIcon, CloseIcon } from '../components/Icons';

export default function Search() {
  useStorageVersion();
  const { query, results, loading, error, searched, run, onInput, select } = useSearch();
  const [params] = useSearchParams();
  const history = searchHistory.get();

  useEffect(() => {
    const q = params.get('q');
    if (q) select(q);
  }, [params, select]);

  return (
    <div className="pt-safe px-5 pt-6">
      <EditorialLabel number="02" label="search" accent />
      <h1 className="display mt-3 text-ink">Search</h1>
      <div className="mt-5">
        <SearchBar value={query} onChange={onInput} autoFocus={!params.get('q')} />
      </div>

      {!searched && history.length === 0 && (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title="Find your sound"
          subtitle="Search for songs, artists, and mixes from across YouTube."
        />
      )}

      {!searched && history.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="label">Recent searches</h2>
            <button onClick={() => searchHistory.clear()} className="label-xs label-accent">
              Clear
            </button>
          </div>
          <div className="space-y-0.5">
            {history.map((q) => (
              <div
                key={q}
                className="flex items-center gap-3 px-1 py-2.5 active:bg-surface-press rounded-xl"
              >
                <ClockIcon size={16} className="text-muted-2 shrink-0" />
                <button onClick={() => select(q)} className="min-w-0 flex-1 text-left font-mono text-[12px] tracking-[0.06em] text-ink truncate">
                  {q}
                </button>
                <button
                  onClick={() => searchHistory.remove(q)}
                  className="text-muted p-1.5"
                  aria-label={`Remove ${q}`}
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <SkeletonList count={7} />
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title="No results"
          subtitle={`Nothing found for "${query}". Try a different search.`}
        />
      )}

      {error && (
        <div className="mt-6 glass rounded-2xl p-6 text-center">
          <p className="font-display text-lg text-ink">Something went wrong</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{error}</p>
          <button onClick={() => run(query)} className="btn-primary mt-5">
            Try again
          </button>
        </div>
      )}

      {searched && !loading && !error && results.length > 0 && (
        <div className="mt-4 space-y-0.5 anim-fade-in">
          {results.map((t, i) => (
            <TrackRow key={t.id} track={t} queue={results} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
