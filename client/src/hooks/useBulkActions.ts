import { useState, useCallback } from "react";

/**
 * Hook for bulk actions on table items
 */
export function useBulkActions<T extends { id: string | number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  );

  const toggleSelect = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll]);

  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const isSelected = useCallback(
    (id: string | number) => selectedIds.has(id),
    [selectedIds]
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isAllSelected: selectedIds.size === items.length && items.length > 0,
    hasSelection: selectedIds.size > 0,
    toggleSelect,
    selectAll,
    deselectAll,
    toggleSelectAll,
    getSelectedItems,
    isSelected,
  };
}
