import React from "react";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";
import { FloatingMenu, type FloatingMenuPosition } from "./FloatingMenu";
import {
  getRemoveActionLabel,
  getShowAllToggleLabel,
  MenuActionItem,
} from "./PlaylistMenuItems";
import { useDismissibleLayer } from "../hooks/useDismissibleLayer";

const VIEWPORT_PADDING = 8;
const CONTEXT_MENU_MIN_WIDTH = 220;
const CONTEXT_MENU_ITEM_HEIGHT = 44;

interface PlaylistLabelProps {
  playlistData: PlaylistData;
  trackUri: string;
  showAllPlaylists: boolean;
  onRemoveTrack: (playlistData: PlaylistData, trackUri: string) => void;
  onNavigateToPlaylist: (playlistData: PlaylistData, trackUri: string) => void;
  onToggleShowAllPlaylists: () => void;
}

export const PlaylistLabel: React.FC<PlaylistLabelProps> = ({
  playlistData,
  trackUri,
  showAllPlaylists,
  onRemoveTrack,
  onNavigateToPlaylist,
  onToggleShowAllPlaylists,
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
    onRemoveTrack(playlistData, trackUri);
  };

  const handleToggleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    closeContextMenu();
    onToggleShowAllPlaylists();
  };

  const handleLabelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    closeContextMenu();
    onNavigateToPlaylist(playlistData, trackUri);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
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
    isContextMenuOpen && menuPosition ? (
      <FloatingMenu menuRef={menuRef} position={menuPosition}>
        <MenuActionItem
          iconName={playlistData.isLikedTracks ? "heart-active" : "x"}
          label={getRemoveActionLabel(playlistData)}
          onClick={handleRemoveClick}
        />
        <MenuActionItem
          iconName="playlist"
          label={getShowAllToggleLabel(showAllPlaylists)}
          onClick={handleToggleClick}
        />
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
