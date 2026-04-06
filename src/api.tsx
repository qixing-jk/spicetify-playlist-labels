import { cacheService } from "./services/CacheService";
import {
  LikedTracksResponse,
  PlaylistData,
  PlaylistItem,
  PlaylistMetadata,
  RootlistItem,
} from "./types";
/**
 * Fetches the contents of the user's rootlist, including playlists and folders.
 * @returns {Promise<RootlistItem>} A promise that resolves with the rootlist contents.
 */
export async function getContents(): Promise<RootlistItem> {
  return await Spicetify.Platform.RootlistAPI.getContents({
    decorateImagesAndOwner: true,
  });
}

/**
 * Fetches the total number of liked tracks for the current user.
 * @returns {Promise<number>} A promise that resolves with the count of liked tracks.
 */
export async function getLikedTracksCount(): Promise<number> {
  return (await Spicetify.Platform.LibraryAPI.getTracks()).totalLength;
}

/**
 * Fetches the items (tracks) within a specific playlist.
 * @param {string} uri - The Spotify URI of the playlist.
 * @returns {Promise<PlaylistItem[]>} A promise that resolves with an array of playlist items.
 */
export async function getPlaylistItems(uri: string): Promise<PlaylistItem[]> {
  const result = await Spicetify.Platform.PlaylistAPI.getContents(uri);
  return result.items;
}

export async function getPlaylistMetadata(
  uri: string,
): Promise<PlaylistMetadata> {
  const db = await cacheService.getDb();
  const cachedMetadata = await cacheService.getCachedPlaylistMetadata(db, uri);

  if (cachedMetadata) {
    return cachedMetadata;
  }

  const metadata = await Spicetify.Platform.PlaylistAPI.getMetadata(uri);
  await cacheService.cachePlaylistMetadata(db, metadata);
  return metadata;
}

/**
 * Removes a track from a specific playlist.
 * @param {string} playlistUri - The Spotify URI of the playlist.
 * @param {string} trackUri - The Spotify URI of the track to be removed.
 * @returns {Promise<void>}
 */
export async function removeTrackFromPlaylist(
  playlistUri: string,
  trackUri: string,
) {
  await Spicetify.Platform.PlaylistAPI.remove(playlistUri, [
    { uri: trackUri, uid: "" },
  ]);
}

/**
 * Removes a track from liked songs.
 * @param {string} trackUri - The Spotify URI of the track to unlike.
 * @returns {Promise<void>}
 */
export async function unlikeTrack(trackUri: string) {
  await Spicetify.Platform.LibraryAPI.remove({ uris: [trackUri] });
}

/**
 * Removes a track from a saved source.
 * @param {PlaylistData} playlistData - The saved source containing the track.
 * @param {string} trackUri - The Spotify URI of the track to remove.
 * @returns {Promise<void>}
 */
export async function removeTrackFromSource(
  playlistData: PlaylistData,
  trackUri: string,
) {
  if (playlistData.isLikedTracks) {
    await unlikeTrack(trackUri);
    return;
  }

  if (!playlistData.uri) {
    return;
  }

  await removeTrackFromPlaylist(playlistData.uri, trackUri);
}

/**
 * Fetches all liked tracks for the current user.
 * It retrieves the full list by using the maximum safe integer as the limit.
 * @returns {Promise<LikedTracksResponse>} A promise that resolves with the liked tracks object.
 */
export async function getLikedTracks(): Promise<LikedTracksResponse> {
  return await Spicetify.Platform.LibraryAPI.getTracks({
    limit: Number.MAX_SAFE_INTEGER,
  });
}
