// Editorial monospace section label: `01 / HOME` style.
export default function EditorialLabel({ number, label, accent = false, className = '' }) {
  return (
    <div className={`flex items-baseline gap-3 ${className}`}>
      {number && (
        <span className="font-mono text-[11px] tracking-[0.3em] text-muted tabular-nums">
          {number}
        </span>
      )}
      <span
        className={`text-[11px] uppercase tracking-[0.32em] ${
          accent ? 'text-accent' : 'text-muted'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
