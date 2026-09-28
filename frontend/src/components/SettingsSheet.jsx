import { useSyncExternalStore } from 'react';
import { subscribeUI, getUI, uiActions } from '../store/uiStore';
import { settings } from '../services/storage';
import { useStorageVersion } from '../hooks/useStorage';
import { CloseIcon, CheckIcon } from './Icons';

function useUI() {
  return useSyncExternalStore(subscribeUI, getUI, getUI);
}

const QUALITIES = [
  { id: 'best', label: 'Best', hint: 'Highest quality audio' },
  { id: 'balanced', label: 'Balanced', hint: 'Good quality, less data' },
  { id: 'data_saver', label: 'Data saver', hint: 'Lowest data usage' },
];

export default function SettingsSheet() {
  const ui = useUI();
  useStorageVersion();
  if (!ui.settingsOpen) return null;

  const current = settings.get().quality || 'best';

  const choose = (id) => {
    settings.set({ quality: id });
  };

  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="absolute inset-0 bg-black/60 anim-fade-in" onClick={() => uiActions.closeSettings()} />
      <div
        className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-3xl anim-slide-up overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full" style={{ background: 'var(--border-strong)' }} />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-display text-xl text-ink">Settings</h2>
          <button
            onClick={() => uiActions.closeSettings()}
            className="flex h-10 w-10 items-center justify-center text-ink tap-scale"
            aria-label="Close settings"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="px-5 pb-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            Streaming quality
          </p>
          {QUALITIES.map((q) => {
            const selected = current === q.id;
            return (
              <button
                key={q.id}
                onClick={() => choose(q.id)}
                className="mb-1 flex w-full items-center gap-4 rounded-xl border border-border px-4 py-3 text-left active:bg-surface-press"
              >
                <div className="min-w-0 flex-1">
                  <div className={`text-[15px] ${selected ? 'text-accent' : 'text-ink'}`}>
                    {q.label}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {q.hint}
                  </div>
                </div>
                {selected && <CheckIcon size={18} className="text-accent" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
