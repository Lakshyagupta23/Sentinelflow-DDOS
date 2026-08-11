import { useEffect } from "react";

/**
 * Hook for keyboard shortcuts
 * Common shortcuts: Cmd/Ctrl+K for search, Cmd/Ctrl+S for save, Esc for close
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl+K: Open search/command palette
      if (modKey && event.key === "k") {
        event.preventDefault();
        shortcuts["cmd+k"]?.();
      }

      // Cmd/Ctrl+S: Save
      if (modKey && event.key === "s") {
        event.preventDefault();
        shortcuts["cmd+s"]?.();
      }

      // Esc: Close modal/dialog
      if (event.key === "Escape") {
        shortcuts["esc"]?.();
      }

      // Cmd/Ctrl+/: Help
      if (modKey && event.key === "/") {
        event.preventDefault();
        shortcuts["cmd+/"]?.();
      }

      // Cmd/Ctrl+Z: Undo
      if (modKey && event.key === "z") {
        event.preventDefault();
        shortcuts["cmd+z"]?.();
      }

      // Cmd/Ctrl+Shift+Z: Redo
      if (modKey && event.shiftKey && event.key === "z") {
        event.preventDefault();
        shortcuts["cmd+shift+z"]?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

/**
 * Get keyboard shortcut display text
 */
export function getShortcutText(shortcut: string): string {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts: Record<string, string> = {
    "cmd+k": `${modKey}+K`,
    "cmd+s": `${modKey}+S`,
    esc: "Esc",
    "cmd+/": `${modKey}+/`,
    "cmd+z": `${modKey}+Z`,
    "cmd+shift+z": `${modKey}+Shift+Z`,
  };

  return shortcuts[shortcut] || shortcut;
}
