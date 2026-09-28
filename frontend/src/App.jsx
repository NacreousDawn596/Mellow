import { Routes, Route, useLocation } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import FullPlayer from './components/FullPlayer';
import Queue from './components/Queue';
import ContextMenu from './components/ContextMenu';
import PlaylistAddSheet from './components/PlaylistAddSheet';
import SettingsSheet from './components/SettingsSheet';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Downloads from './pages/Downloads';
import Playlist from './pages/Playlist';
import { usePlayer } from './hooks/usePlayer';
import { subscribeUI, getUI } from './store/uiStore';

function useUI() {
  return useSyncExternalStore(subscribeUI, getUI, getUI);
}

function AppShell() {
  const player = usePlayer();
  const ui = useUI();
  const location = useLocation();

  const hasTrack = Boolean(player.currentTrack);
  const dockPad = hasTrack ? 'calc(var(--nav-h) + var(--mini-h))' : 'var(--nav-h)';

  return (
    <div className="relative min-h-[100dvh] bg-bg text-text">
      <main
        className="relative z-0"
        style={{
          paddingBottom: `calc(${dockPad} + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/playlist/:id" element={<Playlist />} />
        </Routes>
      </main>

      {/* persistent dock */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {hasTrack && <MiniPlayer />}
        <BottomNav />
      </div>

      {/* overlays */}
      <Queue />
      <ContextMenu />
      <PlaylistAddSheet />
      <SettingsSheet />
      <FullPlayer />

      {/* film grain */}
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
