// Animated equalizer bars — shown when a track is actively playing.
export default function EqBars({ className = 'text-accent' }) {
  return (
    <span className={`eq ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
