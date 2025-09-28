import React from "react";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";

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
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveTrack(playlistData.uri!, trackUri);
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToPlaylist(playlistData, trackUri);
  };

  // todo: fix context menu crash issue, temporarily disable it
  const contextMenu = playlistData.isLikedTracks ? null : (
    <Spicetify.ReactComponent.Menu>
      <Spicetify.ReactComponent.MenuItem
        leadingIcon={
          <Spicetify.ReactComponent.IconComponent
            // @ts-ignore
            dangerouslySetInnerHTML={{ __html: Spicetify.SVGIcons.trash }}
            iconSize={16}
            style={{ color: "var(--text-subdued)" }}
          />
        }
        onClick={handleRemoveClick}
      >
        Remove from {playlistData.name}
      </Spicetify.ReactComponent.MenuItem>
    </Spicetify.ReactComponent.Menu>
  );

  return (
    <Spicetify.ReactComponent.TooltipWrapper
      label={playlistData.name}
      placement="top"
    >
      <div>
          {/*<Spicetify.ReactComponent.RightClickMenu*/}
        {/*  placement="bottom-end"*/}
        {/*  menu={contextMenu}*/}
        {/*>*/}
        <div
          className={CSS_CLASSES.TRACK_CONTAINER}
          style={{ cursor: "pointer" }}
          onClick={handleLabelClick}
        >
          {playlistData.image && (
            <img src={playlistData.image} alt={playlistData.name} />
          )}
        </div>
        {/*</Spicetify.ReactComponent.RightClickMenu>*/}
      </div>
    </Spicetify.ReactComponent.TooltipWrapper>
  );
};
