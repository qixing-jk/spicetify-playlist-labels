import React from "react";
import ReactDOM from "react-dom";
import { CSS_CLASSES } from "../constants";

export interface FloatingMenuPosition {
  top: number;
  maxHeight: number;
  left?: number;
  right?: number;
}

interface FloatingMenuProps {
  children: React.ReactNode;
  menuRef?: React.Ref<HTMLDivElement>;
  position: FloatingMenuPosition;
}

export const FloatingMenu = React.forwardRef<HTMLDivElement, FloatingMenuProps>(
  ({ children, menuRef, position }, forwardedRef) => {
    const ref = menuRef ?? forwardedRef;
    const style: React.CSSProperties = {
      top: `${position.top}px`,
      maxHeight: `${position.maxHeight}px`,
    };

    if (typeof position.left === "number") {
      style.left = `${position.left}px`;
    }
    if (typeof position.right === "number") {
      style.right = `${position.right}px`;
    }

    return ReactDOM.createPortal(
      <div
        ref={ref}
        className={CSS_CLASSES.OVERFLOW_MENU_SHELL}
        style={style}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <ul
          tabIndex={0}
          role="menu"
          data-depth={0}
          className={`${CSS_CLASSES.OVERFLOW_MENU} encore-dark-theme encore-layout-themes main-contextMenu-menu`}
          data-roving-interactive={1}
        >
          {children}
        </ul>
      </div>,
      document.body,
    );
  },
);

FloatingMenu.displayName = "FloatingMenu";

interface RemoveIconProps {
  className?: string;
}

export const RemoveIcon: React.FC<RemoveIconProps> = ({ className }) => {
  const removeIconPath =
    (Spicetify.SVGIcons as Record<string, string>).trash ??
    Spicetify.SVGIcons.x;

  return (
    <span className={className} aria-hidden="true">
      <svg
        data-encore-id="icon"
        role="img"
        viewBox="0 0 16 16"
        dangerouslySetInnerHTML={{ __html: removeIconPath }}
      />
    </span>
  );
};
