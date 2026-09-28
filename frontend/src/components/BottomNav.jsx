import { NavLink } from 'react-router-dom';
import { HomeIcon, SearchIcon, LibraryIcon, DownloadIcon } from './Icons';

const items = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/library', label: 'Library', icon: LibraryIcon },
  { to: '/downloads', label: 'Downloads', icon: DownloadIcon },
];

export default function BottomNav() {
  return (
    <nav
      className="border-t border-border"
      style={{
        height: 'var(--nav-h)',
        background: 'var(--surface)',
      }}
      aria-label="Primary navigation"
    >
      <div className="h-full flex items-stretch justify-around px-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group flex-1 flex flex-col items-center justify-center gap-1.5 no-select"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={21}
                  strokeWidth={1.5}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-accent' : 'text-muted group-active:text-ink'
                  }`}
                />
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                    isActive ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
