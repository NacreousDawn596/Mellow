import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { searchCache, searchHistory } from '../services/storage';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const reqRef = useRef(0);
  const timer = useRef(null);

  const run = useCallback(async (raw) => {
    const q = (raw ?? '').trim();
    if (!q) {
      reqRef.current += 1;
      setResults([]);
      setLoading(false);
      setSearched(false);
      setError(null);
      return;
    }

    const cached = searchCache.get(q);
    if (cached) {
      setResults(cached);
      setLoading(false);
      setSearched(true);
      setError(null);
      return;
    }

    const id = ++reqRef.current;
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const data = await api.search(q);
      if (id !== reqRef.current) return;
      const list = data.results || [];
      setResults(list);
      searchCache.set(q, list);
      searchHistory.add(q);
    } catch (e) {
      if (id !== reqRef.current) return;
      setError(e.message || 'Search failed.');
      setResults([]);
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, []);

  // Instant input update; debounce only the network request.
  const onInput = useCallback(
    (raw) => {
      setQuery(raw);
      if (timer.current) clearTimeout(timer.current);
      const q = (raw ?? '').trim();
      if (!q) {
        reqRef.current += 1;
        setResults([]);
        setLoading(false);
        setSearched(false);
        setError(null);
        return;
      }
      timer.current = setTimeout(() => run(q), 320);
    },
    [run]
  );

  // Immediate search (history tap, ?q= param, retry).
  const select = useCallback(
    (raw) => {
      setQuery(raw ?? '');
      if (timer.current) clearTimeout(timer.current);
      run(raw);
    },
    [run]
  );

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    reqRef.current += 1;
    setQuery('');
    setResults([]);
    setError(null);
    setSearched(false);
    setLoading(false);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { query, results, loading, error, searched, run, onInput, select, clear };
}

export default useSearch;
