import React from "react";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";
import { PlaylistLabel } from "./PlaylistLabel";

interface PlaylistLabelsContainerProps {
  playlistData: PlaylistData[];
  trackUri: string;
  maxLabelCount: number;
  onRemoveTrack: (playlistUri: string, trackUri: string) => void;
  onNavigateToPlaylist: (playlistData: PlaylistData, trackUri: string) => void;
}

export const PlaylistLabelsContainer: React.FC<
  PlaylistLabelsContainerProps
> = ({
  playlistData,
  trackUri,
  maxLabelCount,
  onRemoveTrack,
  onNavigateToPlaylist,
}) => {
  const hasOverflow = playlistData.length > maxLabelCount;
  const displayedData = playlistData.slice(0, maxLabelCount);

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
