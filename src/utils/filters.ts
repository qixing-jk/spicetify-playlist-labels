import {
  CachedPlaylistItem,
  PlaylistData,
  PlaylistExtra,
  PlaylistItemsByUri,
} from "../types";
import { isCurrentPlaylistPage } from "./dom";

/**
 * Filters playlist data.
 */
export function filterPlaylistData(
  playlistData: PlaylistData[],
  showAllPlaylists: boolean,
): PlaylistData[] {
  return playlistData.filter((data) => {
    // Filter out playlists the user doesn't own if not showing all
    if (!showAllPlaylists && !data.isOwnPlaylist) {
      return false;
    }

    // Don't show a label for the playlist currently being viewed
    if (isCurrentPlaylistPage(data)) {
      return false;
    }

    return true;
  });
}

/**
 * Sorts playlists by date.
 */
export function sortPlaylistsByDate(
  playlists: PlaylistExtra[],
): PlaylistExtra[] {
  return playlists.sort(
    (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime(),
  );
}

/**
 * Separates rated and non-rated playlists.
 */
export function separateRatedPlaylists(
  playlists: PlaylistExtra[],
): [PlaylistExtra[], PlaylistExtra[]] {
  const ratedPlaylists = playlists.filter(
    (playlist) => playlist.isRatedPlaylist,
  );
  const nonRatedPlaylists = playlists.filter(
    (playlist) => !playlist.isRatedPlaylist,
  );
  return [ratedPlaylists, nonRatedPlaylists];
}

/**
 * Checks if a playlist has been updated.
 */
export function hasPlaylistUpdated(
  playlist: PlaylistExtra,
  cachedPlaylist?: PlaylistExtra,
): boolean {
  return !cachedPlaylist || cachedPlaylist.totalLength !== playlist.totalLength;
}

/**
 * Builds a map from URI to playlist items.
 */
export function buildUriToPlaylistItems(
  cachedPlaylistItems: CachedPlaylistItem[],
): PlaylistItemsByUri {
  const uriToItems: PlaylistItemsByUri = {};
  cachedPlaylistItems.forEach((playlistItems) => {
    uriToItems[playlistItems.uri] = playlistItems.items;
  });
  return uriToItems;
}
