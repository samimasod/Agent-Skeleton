import { useState, useCallback } from 'react';

export interface PaginatedResult<T> {
  items: T[];
  has_more?: boolean;
  total?: number;
}

export function usePaginatedList<T>(
  fetcher: (page: number, pageSize: number) => Promise<PaginatedResult<T>>,
  pageSize = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      setError('');
      try {
        const res = await fetcher(pageNum, pageSize);
        const newItems = res.items || [];
        if (isRefresh || pageNum === 1) {
          setData(newItems);
        } else {
          setData((prev) => [...prev, ...newItems]);
        }
        setPage(pageNum);
        setHasMore(res.has_more ?? false);
      } catch (err: any) {
        setError(err.message || 'Failed to load list items.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [fetcher, pageSize]
  );

  const handleEndReached = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    void load(page + 1);
  }, [hasMore, isLoadingMore, isLoading, load, page]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    void load(1, true);
  }, [load]);

  return {
    data,
    setData,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    setError,
    load,
    refresh,
    handleEndReached,
  };
}
