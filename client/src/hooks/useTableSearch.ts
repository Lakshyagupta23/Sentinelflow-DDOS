import { useState, useMemo, useCallback } from "react";

/**
 * Hook for table search and filtering functionality
 */
export function useTableSearch<T extends Record<string, any>>(
  items: T[],
  searchableFields: (keyof T)[]
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = searchableFields.some((field) => {
          const value = item[field];
          return String(value).toLowerCase().includes(query);
        });
        if (!matchesSearch) return false;
      }

      // Apply filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== "") {
          if (item[key as keyof T] !== value) {
            return false;
          }
        }
      }

      return true;
    });
  }, [items, searchQuery, filters, searchableFields]);

  const addFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    filteredItems,
    clearSearch,
    hasActiveFilters: Object.keys(filters).length > 0 || searchQuery.length > 0,
  };
}
