import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_TABLE_PAGE_SIZE } from '../constants/tablePagination';

/**
 * Client-side page slicing for tables that already have the full dataset loaded.
 */
export function useClientPagination(items, initialPageSize = DEFAULT_TABLE_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const list = Array.isArray(items) ? items : [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [pageSize, totalItems]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  const setPageSize = (size) => {
    setPageSizeState(size);
    setPage(1);
  };

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
    from,
    to,
  };
}
