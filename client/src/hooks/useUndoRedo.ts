import { useState, useCallback } from "react";

/**
 * Hook for undo/redo functionality
 */
export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      // Remove any redo history
      const newHistory = prev.slice(0, currentIndex + 1);

      // Add new state
      const nextState =
        typeof newState === "function"
          ? (newState as (prev: T) => T)(prev[currentIndex])
          : newState;

      return [...newHistory, nextState];
    });

    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const reset = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    state,
    setState,
    undo,
    redo,
    reset,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    history: history.slice(0, currentIndex + 1),
  };
}
