import {
  getContents,
  getLikedTracks,
  getLikedTracksCount,
  getPlaylistItems,
  getPlaylistMetadata,
} from "./api";
import { CONFIG } from "./constants";
import { cacheService } from "./services/CacheService";
import { PlaylistExtra, PlaylistData } from "./types";
import {
  sortPlaylistsByDate,
  separateRatedPlaylists,
  hasPlaylistUpdated,
  buildUriToPlaylistItems,
} from "./utils/filters";

/**
 * Manages playlist data.
 */
class PlaylistDataManager {
  /**
   * Extracts playlists from the rootlist contents.
   */
  private getPlaylistsFromContents(contents: any): [any[], any[]] {
    const playlists: any[] = [];
    const ratedPlaylists: any[] = [];

    const traverse = (item: any, isRated: boolean): void => {
      if (item.type === "playlist") {
        if (isRated) {
          ratedPlaylists.push(item);
        } else {
          playlists.push(item);
        }
      } else if (item.type === "folder" && item.items) {
          // Recursively traverse folders, marking playlists inside "Rated" folders
        item.items.forEach((child: any) =>
          traverse(child, item.name === "Rated"),
        );
      }
    };

    traverse(contents, false);
    return [playlists, ratedPlaylists];
  }

  /**
   * Gets playlists with extra information.
   */
  private async getPlaylistsExtra(): Promise<PlaylistExtra[]> {
    const contents = await getContents();
    const [playlists, ratedPlaylists] = this.getPlaylistsFromContents(contents);

    const allPlaylists = [...playlists, ...ratedPlaylists];
    return allPlaylists.map((playlist) => ({
      ...playlist,
      isRatedPlaylist: ratedPlaylists.some(
        (rated) => rated.uri === playlist.uri,
      ),
    }));
  }

  /**
   * Adds playlists to the track data map.
   */
  private async addPlaylists(
    trackUriToPlaylistData: Record<string, PlaylistData[]>,
    playlists: PlaylistExtra[],
    uriToPlaylistItems: Record<string, any[]>,
  ): Promise<void> {
    for (const playlist of playlists) {
      const playlistItems = uriToPlaylistItems[playlist.uri] ?? [];

      let imageUrl = playlist.images?.[0]?.url;

      if (!imageUrl) {
        try {
          const metadata = await getPlaylistMetadata(playlist.uri);
          if (metadata?.images?.length) {
            imageUrl = metadata.images[0].url;
          }
        } catch (error) {
          console.error(
            "Failed to get metadata for playlist:",
            playlist.name,
            error,
          );
        }
      }

      playlistItems.forEach((item) => {
        const trackUri = item.uri;

        if (!trackUriToPlaylistData[trackUri]) {
          trackUriToPlaylistData[trackUri] = [];
        }

          // Avoid duplicates
        const exists = trackUriToPlaylistData[trackUri].some(
          (data) => data.uri === playlist.uri,
        );

        if (!exists) {
          trackUriToPlaylistData[trackUri].push({
            uri: playlist.uri,
            name: playlist.name,
            trackUid: item.uid,
            image: imageUrl || "",
            isOwnPlaylist: playlist.isOwnedBySelf,
            isLikedTracks: false,
          });
        }
      });
    }
  }

  /**
   * Adds liked tracks to the track data map.
   */
  private addLikedTracks(
    trackUriToPlaylistData: Record<string, PlaylistData[]>,
    likedTracks: any[],
  ): void {
    likedTracks.forEach((item) => {
      const trackUri = item.uri;

      if (!trackUriToPlaylistData[trackUri]) {
        trackUriToPlaylistData[trackUri] = [];
      }

        // Check if a "Liked Songs" label already exists
      const hasLikedTrack = trackUriToPlaylistData[trackUri].some(
        (data) => data.isLikedTracks,
      );

      if (!hasLikedTrack) {
        trackUriToPlaylistData[trackUri].push({
          uri: null,
          name: "Liked Songs",
          trackUid: item.uid,
          image: CONFIG.LIKED_SONGS_IMAGE,
          isOwnPlaylist: true,
          isLikedTracks: true,
        });
      }
    });
  }

  /**
   * Builds the track URI to playlist data map.
   */
  private async buildTrackUriToPlaylistData(
    playlists: PlaylistExtra[],
    uriToPlaylistItems: Record<string, any[]>,
    likedTracks?: any[],
  ): Promise<Record<string, PlaylistData[]>> {
    const trackUriToPlaylistData: Record<string, PlaylistData[]> = {};

      // Sort playlists by date
    const sortedPlaylists = sortPlaylistsByDate(playlists);
    const [ratedPlaylists, nonRatedPlaylists] =
      separateRatedPlaylists(sortedPlaylists);

      // Add in order of priority: Rated Playlists > Liked Songs > Normal Playlists
    await this.addPlaylists(
      trackUriToPlaylistData,
      ratedPlaylists,
      uriToPlaylistItems,
    );

    if (likedTracks) {
      this.addLikedTracks(trackUriToPlaylistData, likedTracks);
    }

    await this.addPlaylists(
      trackUriToPlaylistData,
      nonRatedPlaylists,
      uriToPlaylistItems,
    );

    return trackUriToPlaylistData;
  }

  /**
   * Updates data for a specific playlist.
   */
  async updatePlaylistData(
    uri: string,
  ): Promise<Record<string, PlaylistData[]>> {
    const db = await cacheService.getDb();
    const playlists = await this.getPlaylistsExtra();
    const cachedPlaylistItems = await cacheService.getCachedPlaylistItems(db);

    const cachedUriToItems = buildUriToPlaylistItems(cachedPlaylistItems);

      // Get updated playlist items
    const updatedItems = await getPlaylistItems(uri);
    cachedUriToItems[uri] = updatedItems;

      // Recache
    await cacheService.cachePlaylists(db, playlists);
    await cacheService.cachePlaylistItems(db, { [uri]: updatedItems });

    const likedTracks = cachedUriToItems["likedTracks"];
    return await this.buildTrackUriToPlaylistData(
      playlists,
      cachedUriToItems,
      likedTracks,
    );
  }

  /**
   * Updates liked tracks data.
   */
  async updateLikedTracks(): Promise<Record<string, PlaylistData[]>> {
    const db = await cacheService.getDb();
    const cachedPlaylists = await cacheService.getCachedPlaylists(db);
    const cachedPlaylistItems = await cacheService.getCachedPlaylistItems(db);

    const cachedUriToItems = buildUriToPlaylistItems(cachedPlaylistItems);

      // Get the latest liked tracks
    const likedTracksData = await getLikedTracks();
    const likedTracks = likedTracksData.items;

      // Update cache
    await cacheService.cachePlaylistItems(db, { likedTracks });
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.LIKED_TRACKS_COUNT,
      `${likedTracks.length}`,
    );

    const sortedPlaylists = sortPlaylistsByDate(cachedPlaylists);
    return await this.buildTrackUriToPlaylistData(
      sortedPlaylists,
      cachedUriToItems,
      likedTracks,
    );
  }

  /**
   * Gets the complete track URI to playlist data map.
   */
  async getTrackUriToPlaylistData(): Promise<Record<string, PlaylistData[]>> {
    const db = await cacheService.getDb();
    const cachedPlaylists = await cacheService.getCachedPlaylists(db);
    const cachedPlaylistItems = await cacheService.getCachedPlaylistItems(db);

    const playlists = await this.getPlaylistsExtra();

      // Check which playlists need updating
    const updatedPlaylists = playlists.filter((playlist) => {
      const cached = cachedPlaylists.find(
        (cached) => cached.uri === playlist.uri,
      );
      return hasPlaylistUpdated(playlist, cached);
    });

    const cachedUriToItems = buildUriToPlaylistItems(cachedPlaylistItems);

      // Get updated playlist items
    const updatedPlaylistPromises = updatedPlaylists.map((playlist) =>
      getPlaylistItems(playlist.uri).catch((e) => {
        console.error(
          `Failed to fetch items for playlist ${playlist.name} (${playlist.uri}):`,
          e,
        );
        return null; // Return null on error to preserve old cache
      }),
    );
    const updatedPlaylistItems = await Promise.all(updatedPlaylistPromises);

      // Merge updated and cached data
    const uriToPlaylistItems: Record<string, any[]> = { ...cachedUriToItems };
    updatedPlaylists.forEach((playlist, index) => {
      const items = updatedPlaylistItems[index];
      // Only update if fetch was successful
      if (items !== null) {
        uriToPlaylistItems[playlist.uri] = items;
      }
    });

      // Check if liked tracks need updating
    const cachedLikedCount = parseInt(
      localStorage.getItem(CONFIG.STORAGE_KEYS.LIKED_TRACKS_COUNT) || "0",
    );
    const currentLikedCount = await getLikedTracksCount();

    let likedTracks = uriToPlaylistItems["likedTracks"];
    if (!likedTracks || cachedLikedCount !== currentLikedCount) {
      const likedTracksData = await getLikedTracks();
      likedTracks = likedTracksData.items;
      uriToPlaylistItems["likedTracks"] = likedTracks;
    }

      // Update cache
    await cacheService.clearCachedPlaylists(db);
    await cacheService.clearCachedPlaylistItems(db);
    await cacheService.cachePlaylists(db, playlists);
    await cacheService.cachePlaylistItems(db, uriToPlaylistItems);
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.LIKED_TRACKS_COUNT,
      `${currentLikedCount}`,
    );

    return await this.buildTrackUriToPlaylistData(
      playlists,
      uriToPlaylistItems,
      likedTracks,
    );
  }
}

// Create a singleton instance
const playlistDataManager = new PlaylistDataManager();

// Export public methods
export const updatePlaylistData = (uri: string) =>
  playlistDataManager.updatePlaylistData(uri);
export const updateLikedTracks = () => playlistDataManager.updateLikedTracks();
export const getTrackUriToPlaylistData = () =>
  playlistDataManager.getTrackUriToPlaylistData();
