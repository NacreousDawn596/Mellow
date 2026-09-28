export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-8" />
    </div>
  );
}

export function SkeletonCard({ square = false }) {
  return (
    <div className="w-[132px] shrink-0">
      <Skeleton className={`w-full ${square ? 'aspect-square' : 'aspect-video'} rounded-2xl mb-2`} />
      <Skeleton className="h-3.5 w-4/5 mb-1.5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

export function SkeletonList({ count = 6 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
