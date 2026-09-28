import { ChevronRightIcon } from './Icons';

// Editorial section header: monospace uppercase label + optional count/action.
export default function Section({ title, count, action, children, className = '' }) {
  return (
    <section className={`mt-9 ${className}`}>
      <div className="flex items-center justify-between px-5 mb-3">
        <span className="label label-accent">{title}</span>
        {count != null && <span className="label-xs tabular-nums">{count}</span>}
        {action || null}
      </div>
      {children}
    </section>
  );
}

export function Scroller({ children, className = '' }) {
  return (
    <div
      className={`flex gap-3 overflow-x-auto px-5 pb-1 scroll-smooth no-select ${className}`}
      style={{ scrollSnapType: 'x proximity' }}
    >
      {children}
    </div>
  );
}

export function SeeAllLink({ to }) {
  return (
    <a
      href={to}
      className="flex items-center gap-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent"
    >
      See all <ChevronRightIcon size={14} />
    </a>
  );
}
