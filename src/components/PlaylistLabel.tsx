import React from "react";
import ReactDOM from "react-dom";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";

const VIEWPORT_PADDING = 8;
const CONTEXT_MENU_MIN_WIDTH = 220;
const CONTEXT_MENU_ITEM_HEIGHT = 44;

interface ContextMenuPosition {
  top: number;
  left: number;
  maxHeight: number;
}

interface PlaylistLabelProps {
  playlistData: PlaylistData;
  trackUri: string;
  onRemoveTrack: (playlistUri: string, trackUri: string) => void;
  onNavigateToPlaylist: (playlistData: PlaylistData, trackUri: string) => void;
}

export const PlaylistLabel: React.FC<PlaylistLabelProps> = ({
  playlistData,
  trackUri,
  onRemoveTrack,
  onNavigateToPlaylist,
}) => {
  const removeIconPath =
    (Spicetify.SVGIcons as Record<string, string>).trash ??
    Spicetify.SVGIcons.x;
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] =
    React.useState<ContextMenuPosition | null>(null);

  React.useEffect(() => {
    if (!isContextMenuOpen) return;

    const closeContextMenu = () => {
      setIsContextMenuOpen(false);
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) {
        return;
      }
      closeContextMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeContextMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("contextmenu", handlePointerDown);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("contextmenu", handlePointerDown);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
    };
  }, [isContextMenuOpen]);

  const handleRemoveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsContextMenuOpen(false);
    onRemoveTrack(playlistData.uri!, trackUri);
  };

  const handleLabelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setIsContextMenuOpen(false);
    onNavigateToPlaylist(playlistData, trackUri);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (playlistData.isLikedTracks) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const maxLeft = Math.max(
      VIEWPORT_PADDING,
      window.innerWidth - CONTEXT_MENU_MIN_WIDTH - VIEWPORT_PADDING,
    );
    const maxTop = Math.max(
      VIEWPORT_PADDING,
      window.innerHeight - CONTEXT_MENU_ITEM_HEIGHT - VIEWPORT_PADDING,
    );
    const left = Math.min(Math.max(event.clientX, VIEWPORT_PADDING), maxLeft);
    const top = Math.min(Math.max(event.clientY, VIEWPORT_PADDING), maxTop);

    setMenuPosition({
      top,
      left,
      maxHeight: Math.max(
        window.innerHeight - top - VIEWPORT_PADDING,
        CONTEXT_MENU_ITEM_HEIGHT,
      ),
    });
    setIsContextMenuOpen(true);
  };

  const contextMenu =
    !playlistData.isLikedTracks && isContextMenuOpen && menuPosition
      ? ReactDOM.createPortal(
          <div
            ref={menuRef}
            className={CSS_CLASSES.OVERFLOW_MENU_SHELL}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              maxHeight: `${menuPosition.maxHeight}px`,
            }}
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
              <li role="presentation" className="main-contextMenu-menuItem">
                <button
                  type="button"
                  className="main-contextMenu-menuItemButton"
                  onClick={handleRemoveClick}
                  role="menuitem"
                  tabIndex={-1}
                >
                  <span
                    className={CSS_CLASSES.CONTEXT_MENU_ICON}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{
                      __html: `<svg data-encore-id="icon" role="img" viewBox="0 0 16 16">${removeIconPath}</svg>`,
                    }}
                  />
                  <span
                    className="e-10180-text encore-text-body-small ellipsis-one-line main-contextMenu-menuItemLabel"
                    dir="auto"
                  >
                    Remove from {playlistData.name}
                  </span>
                </button>
              </li>
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Spicetify.ReactComponent.TooltipWrapper
        label={playlistData.name}
        placement="top"
      >
        <div
          className={CSS_CLASSES.TRACK_CONTAINER}
          style={{ cursor: "pointer" }}
          onClick={handleLabelClick}
          onContextMenu={handleContextMenu}
        >
          {playlistData.image && (
            <img src={playlistData.image} alt={playlistData.name} />
          )}
        </div>
      </Spicetify.ReactComponent.TooltipWrapper>
      {contextMenu}
    </>
  );
};
