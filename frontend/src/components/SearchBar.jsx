import { SearchIcon, CloseIcon } from './Icons';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search songs, artists...',
  autoFocus = false,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors focus-within:border-accent/40">
      <SearchIcon size={18} strokeWidth={1.6} className="shrink-0 text-muted-2" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent font-mono text-[13px] tracking-wide text-ink placeholder:text-muted-2 outline-none [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search" className="text-muted tap-scale">
          <CloseIcon size={17} />
        </button>
      )}
    </div>
  );
}
