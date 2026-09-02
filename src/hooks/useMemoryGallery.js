import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import useDebouncedValue from './useDebouncedValue.js';

const PAGE_SIZE = 24;

export default function useMemoryGallery({
  enabled,
  query,
  album,
  favorite,
  type,
  sort,
  notify,
}) {
  const [memories, setMemories] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);
  const debouncedQuery = useDebouncedValue(query, 350);

  const loadPage = useCallback(async ({ cursor = null, append = false } = {}) => {
    const requestId = ++requestRef.current;
    const params = new URLSearchParams();
    params.set('perPage', String(PAGE_SIZE));
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    if (album) params.set('albumId', album);
    if (favorite) params.set('favorite', '1');
    if (type !== 'all') params.set('type', type);
    params.set('sort', sort);
    if (cursor) params.set('cursor', cursor);

    setLoading(true);
    try {
      const response = await apiRequest(`/api/memories?${params}`);
      if (requestId !== requestRef.current) return;

      const items = Array.isArray(response) ? response : (response.items || []);
      setMemories((current) => {
        if (!append) return items;
        const known = new Set(current.map((item) => item.id));
        return [...current, ...items.filter((item) => !known.has(item.id))];
      });
      setNextCursor(Array.isArray(response) ? null : (response.nextCursor || null));
      setHasMore(Array.isArray(response) ? false : Boolean(response.hasMore));
    } catch (error) {
      if (requestId === requestRef.current) notify(error.message);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [album, debouncedQuery, favorite, notify, sort, type]);

  useEffect(() => {
    if (!enabled) return;
    loadPage();
  }, [enabled, loadPage]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loading) return;
    loadPage({ cursor: nextCursor, append: true });
  }, [loadPage, loading, nextCursor]);

  const reload = useCallback(() => loadPage(), [loadPage]);

  return { memories, loading, hasMore, loadMore, reload };
}
