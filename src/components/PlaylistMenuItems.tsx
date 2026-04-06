import React from "react";
import { PlaylistData } from "../types";
import { CSS_CLASSES } from "../constants";
import { RemoveIcon } from "./FloatingMenu";

export function getRemoveActionLabel(playlistData: PlaylistData): string {
  return playlistData.isLikedTracks
    ? "Unlike track"
    : `Remove from ${playlistData.name}`;
}

export function getShowAllToggleLabel(showAllPlaylists: boolean): string {
  return showAllPlaylists
    ? "Show Only My Playlists"
    : "Show All Saved Playlists";
}

interface MenuActionItemProps {
  iconName: string;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const MenuActionItem: React.FC<MenuActionItemProps> = ({
  iconName,
  label,
  onClick,
}) => (
  <li role="presentation" className="main-contextMenu-menuItem">
    <button
      type="button"
      className="main-contextMenu-menuItemButton"
      onClick={onClick}
      role="menuitem"
      tabIndex={-1}
    >
      <RemoveIcon
        className={CSS_CLASSES.CONTEXT_MENU_ICON}
        iconName={iconName}
      />
      <span
        className="e-10180-text encore-text-body-small ellipsis-one-line main-contextMenu-menuItemLabel"
        dir="auto"
      >
        {label}
      </span>
    </button>
  </li>
);
