import { useState } from 'react';

/**
 * Sort state for server-paginated tables.
 * Pass sortKey/sortDir to the API so order continues across pages.
 */
export function useServerTableSort(options = {}) {
  const { initialKey = null, initialDirection = 'asc' } = options;
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState(initialDirection);

  const requestSort = (key) => {
    if (!key || typeof key !== 'string') return;
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const applySortParams = (params) => {
    if (!sortKey) return params;
    if (params instanceof URLSearchParams) {
      params.set('sort_by', sortKey);
      params.set('sort_dir', sortDir);
      return params;
    }
    return params;
  };

  const sortQuery = sortKey
    ? `&sort_by=${encodeURIComponent(sortKey)}&sort_dir=${encodeURIComponent(sortDir)}`
    : '';

  return {
    sortKey,
    sortDir,
    requestSort,
    applySortParams,
    sortQuery,
  };
}
