// Custom pointer-draggable, keyboard-accessible seek bar (editorial style).
import { useCallback, useRef } from 'react';

export default function SeekBar({ value, max, onSeek, disabled = false }) {
  const ref = useRef(null);
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const seekFromClientX = useCallback(
    (clientX) => {
      const el = ref.current;
      if (!el || max <= 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onSeek(ratio * max);
    },
    [max, onSeek]
  );

  const onPointerDown = (e) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };
  const onPointerMove = (e) => {
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    seekFromClientX(e.clientX);
  };
  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const delta = (e.key === 'ArrowRight' ? 1 : -1) * 5;
      onSeek(Math.min(max, Math.max(0, value + delta)));
    }
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, Math.round(max))}
      aria-valuenow={Math.round(value)}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
      className="group relative h-6 cursor-pointer touch-none"
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink opacity-0 shadow-[0_0_12px_var(--glow-pink)] transition-opacity duration-200 group-hover:opacity-100"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
