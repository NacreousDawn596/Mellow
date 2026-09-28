import { useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { subscribeUI, getUI, uiActions } from '../store/uiStore';
import * as store from '../store/playerStore';
import { CloseIcon, GripIcon } from './Icons';
import EqBars from './EqBars';

function useUI() {
  return useSyncExternalStore(subscribeUI, getUI, getUI);
}

const ROW_H = 56;

export default function Queue() {
  const ui = useUI();
  const p = usePlayer();
  const open = ui.queueOpen;
  const { queue, currentIndex } = p;

  const dragIndex = useRef(null);
  const [overIndex, setOverIndex] = useState(null);
  const listRef = useRef(null);

  if (!open) return null;

  const onPointerDown = (e, index) => {
    dragIndex.current = index;
    setOverIndex(index);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (dragIndex.current == null || !listRef.current) return;
    const rect = listRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + listRef.current.scrollTop;
    let target = Math.floor(y / ROW_H);
    target = Math.max(0, Math.min(queue.length - 1, target));
    if (target !== overIndex) setOverIndex(target);
  };
  const onPointerUp = () => {
    if (dragIndex.current != null && overIndex != null && dragIndex.current !== overIndex) {
      store.reorderQueue(dragIndex.current, overIndex);
    }
    dragIndex.current = null;
    setOverIndex(null);
  };

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Queue">
      <div
        className="absolute inset-0 bg-black/60 anim-fade-in"
        onClick={() => uiActions.closeQueue()}
      />
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col glass-strong rounded-t-3xl anim-slide-up overflow-hidden max-h-[78vh]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
        <div className="flex justify-center pt-2.5 shrink-0">
          <span className="h-1 w-9 rounded-full" style={{ background: 'var(--border-strong)' }} />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
          <div>
            <h2 className="font-display text-xl text-ink">Queue</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {queue.length > 0 && (
              <button
                onClick={() => store.clearQueue()}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-pink px-2 py-1.5"
                aria-label="Clear queue"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => uiActions.closeQueue()}
              className="w-10 h-10 flex items-center justify-center text-text tap-scale"
              aria-label="Close queue"
            >
              <CloseIcon size={22} />
            </button>
          </div>
        </div>

        <div ref={listRef} className="overflow-y-auto pb-4">
          {queue.length === 0 ? (
            <div className="text-center text-muted py-12 text-sm">Your queue is empty.</div>
          ) : (
            queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className={`flex items-center gap-2 px-4 transition-colors ${
                  overIndex === i && dragIndex.current != null ? 'bg-surface-press' : ''
                }`}
                style={{ height: ROW_H }}
              >
                <div
                  onPointerDown={(e) => onPointerDown(e, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  className="cursor-grab touch-none p-1 text-muted-2"
                  aria-label="Drag to reorder"
                >
                  <GripIcon size={18} />
                </div>
                <button onClick={() => store.jumpToIndex(i)} className="flex-1 min-w-0 text-left">
                  <div
                    className={`text-[14px] truncate leading-tight ${
                      i === currentIndex ? 'text-accent' : 'text-ink'
                    }`}
                  >
                    {track.title}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted truncate">
                    {track.artist}
                  </div>
                </button>
                {i === currentIndex && p.playing && <EqBars className="text-accent" />}
                <button
                  onClick={() => store.removeFromQueue(i)}
                  className="p-2 text-muted tap-scale"
                  aria-label="Remove from queue"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
