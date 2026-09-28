import { useStorageVersion } from '../hooks/useStorage';
import { useDownloads } from '../hooks/useDownloads';
import { downloads } from '../services/storage';
import TrackRow from '../components/TrackRow';
import EmptyState from '../components/EmptyState';
import EditorialLabel from '../components/EditorialLabel';
import { DownloadIcon } from '../components/Icons';

export default function Downloads() {
  useStorageVersion();
  const { active } = useDownloads();
  const list = downloads.get();

  const inProgress = Object.values(active).filter((s) => s.status === 'downloading');

  return (
    <div className="pt-safe px-5 pt-6">
      <EditorialLabel number="04" label="downloads" accent />
      <h1 className="display mt-3 text-ink">Downloads</h1>
      <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        Songs saved to this device
      </p>

      {list.length === 0 && inProgress.length === 0 ? (
        <EmptyState
          icon={<DownloadIcon size={28} />}
          title="Nothing downloaded yet"
          subtitle="Download a song from its menu to make it available offline."
        />
      ) : (
        <div className="mt-6">
          {inProgress.map((s) => (
            <div
              key={s.track.id}
              className="mb-2 rounded-xl border border-border bg-surface px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={s.track.thumbnail}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-11 w-11 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-ink">{s.track.title}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {Math.round(s.progress * 100)}%
                  </div>
                </div>
              </div>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${s.progress * 100}%` }}
                />
              </div>
            </div>
          ))}

          {list.length > 0 && (
            <div className="mt-2">
              <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
                Available offline
              </div>
              <div className="space-y-0.5 anim-fade-in">
                {list.map((t, i) => (
                  <TrackRow key={t.id} track={t} queue={list} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
