import React from "react";
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
    // The data to display, truncated to the max label count.
  const displayedData = playlistData.slice(0, maxLabelCount);

    // The class name for the container, with an overflow class if needed.
  const containerClassName = hasOverflow
    ? `${CSS_CLASSES.LABELS_CONTAINER} ${CSS_CLASSES.OVERFLOW}`
    : CSS_CLASSES.LABELS_CONTAINER;

  return (
    <div className={containerClassName}>
      {displayedData.map((data) => (
        <PlaylistLabel
          key={data.uri || "liked-tracks"}
          playlistData={data}
          trackUri={trackUri}
          onRemoveTrack={onRemoveTrack}
          onNavigateToPlaylist={onNavigateToPlaylist}
        />
      ))}
    </div>
  );
};
