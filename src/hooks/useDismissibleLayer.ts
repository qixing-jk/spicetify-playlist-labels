import React from "react";

interface UseDismissibleLayerOptions {
  isOpen: boolean;
  refs: Array<React.RefObject<HTMLElement | null>>;
  onDismiss: () => void;
  onOpen?: () => void;
  dismissOnContextMenu?: boolean;
}

export function useDismissibleLayer({
  isOpen,
  refs,
  onDismiss,
  onOpen,
  dismissOnContextMenu = false,
}: UseDismissibleLayerOptions): void {
  React.useEffect(() => {
    if (!isOpen) return;

    onOpen?.();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        refs.some((ref) => {
          return ref.current?.contains(target);
        })
      ) {
        return;
      }
      onDismiss();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("resize", onDismiss);
    window.addEventListener("scroll", onDismiss, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    if (dismissOnContextMenu) {
      document.addEventListener("contextmenu", handlePointerDown);
    }

    return () => {
      window.removeEventListener("resize", onDismiss);
      window.removeEventListener("scroll", onDismiss, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);

      if (dismissOnContextMenu) {
        document.removeEventListener("contextmenu", handlePointerDown);
      }
    };
  }, [dismissOnContextMenu, isOpen, onDismiss, onOpen]);
}
