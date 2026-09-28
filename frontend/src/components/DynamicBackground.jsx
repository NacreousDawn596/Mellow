import { useEffect, useState } from 'react';
import { extractDominantColor, defaultAccent, hexToRgb } from '../utils/colors';

const FALLBACK_ACCENT = '#8b5cf6';

export default function DynamicBackground({ track }) {
  const [accent, setAccent] = useState(FALLBACK_ACCENT);

  useEffect(() => {
    if (!track?.thumbnail) {
      setAccent(FALLBACK_ACCENT);
      document.documentElement.style.setProperty('--accent', '139, 92, 246');
      return;
    }

    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.src = track.thumbnail;
    img.onload = () => {
      if (!alive) return;
      extractDominantColor(img, defaultAccent.accent).then(({ accent: a }) => {
        if (!alive) return;
        setAccent(a);
        const [r, g, b] = hexToRgb(a);
        document.documentElement.style.setProperty('--accent', `${r}, ${g}, ${b}`);
      });
    };
    img.onerror = () => {
      if (!alive) return;
      setAccent(FALLBACK_ACCENT);
    };
    return () => {
      alive = false;
    };
  }, [track?.id, track?.thumbnail]);

  const [r, g, b] = hexToRgb(accent);

  return (
    <div className="dyn-bg" aria-hidden="true">
      {track?.thumbnail && (
        <img key={track.id} className="dyn-bg-img" src={track.thumbnail} alt="" />
      )}
      <div
        className="dyn-bg-tint"
        style={{
          background: `radial-gradient(120% 90% at 15% 0%, rgba(${r},${g},${b},0.55), transparent 60%), radial-gradient(110% 85% at 90% 100%, rgba(${r},${g},${b},0.4), transparent 55%)`,
        }}
      />
      <div className="dyn-bg-veil" />
    </div>
  );
}
