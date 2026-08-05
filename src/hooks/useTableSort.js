import { useMemo, useState } from 'react';

const getByPath = (item, path) => {
  if (!item || !path) return undefined;
  return String(path).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), item);
};

const toComparable = (value) => {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;

  const asNumber = Number(value);
  if (typeof value !== 'string' && Number.isFinite(asNumber)) return asNumber;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(asNumber) && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return asNumber;
  }

  const asDate = Date.parse(value);
  if (typeof value === 'string' && !Number.isNaN(asDate) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return asDate;
  }

  return String(value).toLowerCase();
};

const compareValues = (left, right, direction) => {
  const a = toComparable(left);
  const b = toComparable(right);

  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  let result = 0;
  if (typeof a === 'number' && typeof b === 'number') {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
  }

  return direction === 'desc' ? -result : result;
};

/**
 * Client-side table sorting for currently loaded rows.
 * @param {Array} items
 * @param {{ initialKey?: string|null, initialDirection?: 'asc'|'desc', accessors?: Record<string, (item: any) => any> }} [options]
 */
export function useTableSort(items, options = {}) {
  const { initialKey = null, initialDirection = 'asc', accessors = {} } = options;
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

  const sortedItems = useMemo(() => {
    if (!Array.isArray(items) || !sortKey) return items ?? [];
    const accessor = typeof accessors[sortKey] === 'function'
      ? accessors[sortKey]
      : (item) => getByPath(item, sortKey);

    const copy = [...items];
    copy.sort((a, b) => compareValues(accessor(a), accessor(b), sortDir));
    return copy;
  }, [items, sortKey, sortDir, accessors]);

  return {
    sortedItems,
    sortKey,
    sortDir,
    requestSort,
  };
}
