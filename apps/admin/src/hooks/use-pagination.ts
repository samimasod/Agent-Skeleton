import { useState, useCallback } from "react"

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePagination(options: UsePaginationOptions = {}) {
  const [page, setPage] = useState(options.initialPage || 1)
  const [pageSize, setPageSize] = useState(options.initialPageSize || 10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const updatePagination = useCallback((newTotal: number, newTotalPages?: number) => {
    setTotal(newTotal)
    if (typeof newTotalPages === "number") {
      setTotalPages(newTotalPages)
    } else {
      setTotalPages(Math.ceil(newTotal / pageSize) || 1)
    }
  }, [pageSize])

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1))
  }, [])

  const resetPage = useCallback(() => {
    setPage(1)
  }, [])

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    updatePagination,
    nextPage,
    prevPage,
    resetPage,
  }
}
