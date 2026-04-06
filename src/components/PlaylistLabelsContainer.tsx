import React from "react";
import ReactDOM from "react-dom";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";
import { PlaylistLabel } from "./PlaylistLabel";

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
  onNavigateToPlaylist: (playlistData: PlaylistData, trackUri: string) => void;
}

interface OverflowMenuPosition {
  top: number;
  right: number;
  maxHeight: number;
}

const PlaylistOverflowButton: React.FC<PlaylistOverflowButtonProps> = ({
  hiddenPlaylistData,
  trackUri,
  onNavigateToPlaylist,
}) => {
  const hiddenCount = hiddenPlaylistData.length;
  const tooltipLabel = `Show ${hiddenCount} more playlist${hiddenCount === 1 ? "" : "s"}`;
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] =
    React.useState<OverflowMenuPosition | null>(null);

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

  React.useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (buttonRef.current?.contains(target) ||
          menuRef.current?.contains(target))
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleViewportChange = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updateMenuPosition]);

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

  const menu =
    isOpen && menuPosition
      ? ReactDOM.createPortal(
          <div
            ref={menuRef}
            className={CSS_CLASSES.OVERFLOW_MENU_SHELL}
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
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
              {hiddenPlaylistData.map((data, index) => (
                <li
                  key={`${data.uri ?? "liked-tracks"}-${index}`}
                  role="presentation"
                  className="main-contextMenu-menuItem"
                >
                  <button
                    type="button"
                    className="main-contextMenu-menuItemButton"
                    onClick={handlePlaylistClick(data)}
                    title={data.name}
                    role="menuitem"
                    tabIndex={-1}
                  >
                    <span
                      className="e-10180-text encore-text-body-small ellipsis-one-line main-contextMenu-menuItemLabel"
                      dir="auto"
                    >
                      {data.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )
      : null;

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
          onNavigateToPlaylist={onNavigateToPlaylist}
        />
      )}
    </div>
  );
};
