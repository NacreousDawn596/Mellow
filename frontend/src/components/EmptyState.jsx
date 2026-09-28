export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-14 text-center anim-fade-in">
      <div className="mb-5 text-accent/60">{icon}</div>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-[260px] font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-muted">
        {subtitle}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
