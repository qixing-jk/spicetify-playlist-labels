import React from "react";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";
import {
  FloatingMenu,
  RemoveIcon,
  type FloatingMenuPosition,
} from "./FloatingMenu";
import { useDismissibleLayer } from "../hooks/useDismissibleLayer";

const VIEWPORT_PADDING = 8;
const CONTEXT_MENU_MIN_WIDTH = 220;
const CONTEXT_MENU_ITEM_HEIGHT = 44;

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
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] =
    React.useState<FloatingMenuPosition | null>(null);

  const closeContextMenu = React.useCallback(() => {
    setIsContextMenuOpen(false);
  }, []);

  useDismissibleLayer({
    isOpen: isContextMenuOpen,
    refs: [menuRef],
    onDismiss: closeContextMenu,
    dismissOnContextMenu: true,
  });

  const handleRemoveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    closeContextMenu();
    onRemoveTrack(playlistData.uri!, trackUri);
  };

  const handleLabelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    closeContextMenu();
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
    !playlistData.isLikedTracks && isContextMenuOpen && menuPosition ? (
      <FloatingMenu menuRef={menuRef} position={menuPosition}>
        <li role="presentation" className="main-contextMenu-menuItem">
          <button
            type="button"
            className="main-contextMenu-menuItemButton"
            onClick={handleRemoveClick}
            role="menuitem"
            tabIndex={-1}
          >
            <RemoveIcon className={CSS_CLASSES.CONTEXT_MENU_ICON} />
            <span
              className="e-10180-text encore-text-body-small ellipsis-one-line main-contextMenu-menuItemLabel"
              dir="auto"
            >
              Remove from {playlistData.name}
            </span>
          </button>
        </li>
      </FloatingMenu>
    ) : null;

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
