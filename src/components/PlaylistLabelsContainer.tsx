import React from "react";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";
import {
  FloatingMenu,
  RemoveIcon,
  type FloatingMenuPosition,
} from "./FloatingMenu";
import { PlaylistLabel } from "./PlaylistLabel";
import { useDismissibleLayer } from "../hooks/useDismissibleLayer";

/**
 * Props for the PlaylistLabelsContainer component.
 */
interface PlaylistLabelsContainerProps {
  // Data for the playlists to display.
  playlistData: PlaylistData[];
  // The URI of the track.
  trackUri: string;
  // The maximum number of labels to display.
  maxLabelCount: number;
  // Callback for when a track is removed from a playlist.
  onRemoveTrack: (playlistUri: string, trackUri: string) => void;
  // Callback for when a user navigates to a playlist.
  onNavigateToPlaylist: (playlistData: PlaylistData, trackUri: string) => void;
}

interface PlaylistOverflowButtonProps {
  hiddenPlaylistData: PlaylistData[];
  trackUri: string;
  onRemoveTrack: (playlistUri: string, trackUri: string) => void;
  onNavigateToPlaylist: (playlistData: PlaylistData, trackUri: string) => void;
}

const PlaylistOverflowButton: React.FC<PlaylistOverflowButtonProps> = ({
  hiddenPlaylistData,
  trackUri,
  onRemoveTrack,
  onNavigateToPlaylist,
}) => {
  const hiddenCount = hiddenPlaylistData.length;
  const tooltipLabel = `Show ${hiddenCount} more playlist${hiddenCount === 1 ? "" : "s"}`;
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] =
    React.useState<FloatingMenuPosition | null>(null);

  const updateMenuPosition = React.useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const top = rect.bottom + 6;
    setMenuPosition({
      top,
      right: Math.max(window.innerWidth - rect.right, 8),
      maxHeight: Math.max(window.innerHeight - top - 8, 120),
    });
  }, []);

  const closeOverflowMenu = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  useDismissibleLayer({
    isOpen,
    refs: [buttonRef, menuRef],
    onDismiss: closeOverflowMenu,
    onOpen: updateMenuPosition,
  });

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    updateMenuPosition();
    setIsOpen((current) => !current);
  };

  const handlePlaylistClick =
    (playlistData: PlaylistData) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setIsOpen(false);
      onNavigateToPlaylist(playlistData, trackUri);
    };

  const handleRemoveClick =
    (playlistData: PlaylistData) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!playlistData.uri) {
        return;
      }
      event.stopPropagation();
      setIsOpen(false);
      onRemoveTrack(playlistData.uri, trackUri);
    };

  const menu =
    isOpen && menuPosition ? (
      <FloatingMenu menuRef={menuRef} position={menuPosition}>
        {hiddenPlaylistData.map((data, index) => (
          <li
            key={`${data.uri ?? "liked-tracks"}-${index}`}
            role="presentation"
            className="main-contextMenu-menuItem"
          >
            <div className={CSS_CLASSES.OVERFLOW_MENU_ITEM_CONTENT}>
              <button
                type="button"
                className="main-contextMenu-menuItemButton"
                onClick={handlePlaylistClick(data)}
                title={data.name}
                role="menuitem"
                tabIndex={-1}
              >
                {data.image && (
                  <img
                    className={CSS_CLASSES.OVERFLOW_MENU_ITEM_MEDIA}
                    src={data.image}
                    alt={data.name}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`${CSS_CLASSES.OVERFLOW_MENU_ITEM_LABEL} e-10180-text encore-text-body-small ellipsis-one-line main-contextMenu-menuItemLabel`}
                  dir="auto"
                >
                  {data.name}
                </span>
              </button>
              {!data.isLikedTracks && data.uri && (
                <button
                  type="button"
                  className={CSS_CLASSES.OVERFLOW_MENU_ITEM_REMOVE_BUTTON}
                  onClick={handleRemoveClick(data)}
                  aria-label={`Remove from ${data.name}`}
                  title={`Remove from ${data.name}`}
                  tabIndex={-1}
                >
                  <RemoveIcon />
                </button>
              )}
            </div>
          </li>
        ))}
      </FloatingMenu>
    ) : null;

  return (
    <>
      <Spicetify.ReactComponent.TooltipWrapper
        label={tooltipLabel}
        placement="top"
      >
        <button
          ref={buttonRef}
          type="button"
          className={CSS_CLASSES.OVERFLOW_BUTTON}
          aria-label={tooltipLabel}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={handleButtonClick}
        >
          +{hiddenCount}
        </button>
      </Spicetify.ReactComponent.TooltipWrapper>
      {menu}
    </>
  );
};

/**
 * A container for displaying playlist labels.
 */
export const PlaylistLabelsContainer: React.FC<
  PlaylistLabelsContainerProps
> = ({
  playlistData,
  trackUri,
  maxLabelCount,
  onRemoveTrack,
  onNavigateToPlaylist,
}) => {
  // Determines if there are more labels than the max count.
  const hasOverflow = playlistData.length > maxLabelCount;
  const visibleLabelCount = hasOverflow
    ? Math.max(maxLabelCount - 1, 0)
    : maxLabelCount;
  const displayedData = playlistData.slice(0, visibleLabelCount);
  const hiddenData = playlistData.slice(visibleLabelCount);

  return (
    <div className={CSS_CLASSES.LABELS_CONTAINER}>
      {displayedData.map((data) => (
        <PlaylistLabel
          key={data.uri || "liked-tracks"}
          playlistData={data}
          trackUri={trackUri}
          onRemoveTrack={onRemoveTrack}
          onNavigateToPlaylist={onNavigateToPlaylist}
        />
      ))}
      {hasOverflow && (
        <PlaylistOverflowButton
          hiddenPlaylistData={hiddenData}
          trackUri={trackUri}
          onRemoveTrack={onRemoveTrack}
          onNavigateToPlaylist={onNavigateToPlaylist}
        />
      )}
    </div>
  );
};
