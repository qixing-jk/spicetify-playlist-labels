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
 * 播放列表数据管理类
 */
class PlaylistDataManager {
  /**
   * 从根列表内容中提取播放列表
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
        // 递归遍历文件夹，标记"Rated"文件夹内的播放列表
        item.items.forEach((child: any) =>
          traverse(child, item.name === "Rated"),
        );
      }
    };

    traverse(contents, false);
    return [playlists, ratedPlaylists];
  }

  /**
   * 获取带有额外信息的播放列表
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
   * 添加播放列表到轨道数据映射
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

        // 避免重复添加
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
   * 添加喜欢的歌曲到轨道数据映射
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

      // 检查是否已经存在喜欢的歌曲标签
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
   * 构建轨道到播放列表的数据映射
   */
  private async buildTrackUriToPlaylistData(
    playlists: PlaylistExtra[],
    uriToPlaylistItems: Record<string, any[]>,
    likedTracks?: any[],
  ): Promise<Record<string, PlaylistData[]>> {
    const trackUriToPlaylistData: Record<string, PlaylistData[]> = {};

    // 按日期排序播放列表
    const sortedPlaylists = sortPlaylistsByDate(playlists);
    const [ratedPlaylists, nonRatedPlaylists] =
      separateRatedPlaylists(sortedPlaylists);

    // 按优先级顺序添加：评级播放列表 > 喜欢的歌曲 > 普通播放列表
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
   * 更新特定播放列表的数据
   */
  async updatePlaylistData(
    uri: string,
  ): Promise<Record<string, PlaylistData[]>> {
    const db = await cacheService.getDb();
    const playlists = await this.getPlaylistsExtra();
    const cachedPlaylistItems = await cacheService.getCachedPlaylistItems(db);

    const cachedUriToItems = buildUriToPlaylistItems(cachedPlaylistItems);

    // 获取更新的播放列表项目
    const updatedItems = await getPlaylistItems(uri);
    cachedUriToItems[uri] = updatedItems;

    // 重新缓存
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
   * 更新喜欢的歌曲数据
   */
  async updateLikedTracks(): Promise<Record<string, PlaylistData[]>> {
    const db = await cacheService.getDb();
    const cachedPlaylists = await cacheService.getCachedPlaylists(db);
    const cachedPlaylistItems = await cacheService.getCachedPlaylistItems(db);

    const cachedUriToItems = buildUriToPlaylistItems(cachedPlaylistItems);

    // 获取最新的喜欢的歌曲
    const likedTracksData = await getLikedTracks();
    const likedTracks = likedTracksData.items;

    // 更新缓存
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
   * 获取完整的轨道到播放列表数据映射
   */
  async getTrackUriToPlaylistData(): Promise<Record<string, PlaylistData[]>> {
    const db = await cacheService.getDb();
    const cachedPlaylists = await cacheService.getCachedPlaylists(db);
    const cachedPlaylistItems = await cacheService.getCachedPlaylistItems(db);

    const playlists = await this.getPlaylistsExtra();

    // 检查哪些播放列表需要更新
    const updatedPlaylists = playlists.filter((playlist) => {
      const cached = cachedPlaylists.find(
        (cached) => cached.uri === playlist.uri,
      );
      return hasPlaylistUpdated(playlist, cached);
    });

    const cachedUriToItems = buildUriToPlaylistItems(cachedPlaylistItems);

    // 获取更新的播放列表项目
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

    // 合并更新和缓存的数据
    const uriToPlaylistItems: Record<string, any[]> = { ...cachedUriToItems };
    updatedPlaylists.forEach((playlist, index) => {
      const items = updatedPlaylistItems[index];
      // Only update if fetch was successful
      if (items !== null) {
        uriToPlaylistItems[playlist.uri] = items;
      }
    });

    // 检查喜欢的歌曲是否需要更新
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

    // 更新缓存
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

// 创建单例实例
const playlistDataManager = new PlaylistDataManager();

// 导出公共方法
export const updatePlaylistData = (uri: string) =>
  playlistDataManager.updatePlaylistData(uri);
export const updateLikedTracks = () => playlistDataManager.updateLikedTracks();
export const getTrackUriToPlaylistData = () =>
  playlistDataManager.getTrackUriToPlaylistData();
