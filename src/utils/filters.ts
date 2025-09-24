import { PlaylistData } from '../types';
import { isCurrentPlaylistPage } from './dom';

/**
 * 过滤播放列表数据
 */
export function filterPlaylistData(
  playlistData: PlaylistData[], 
  showAllPlaylists: boolean
): PlaylistData[] {
  return playlistData.filter((data) => {
    // 如果不显示所有播放列表且用户不拥有该播放列表，则过滤掉
    if (!showAllPlaylists && !data.isOwnPlaylist) {
      return false;
    }

    // 不显示当前正在查看的播放列表的标签
    if (isCurrentPlaylistPage(data)) {
      return false;
    }

    return true;
  });
}

/**
 * 按日期排序播放列表
 */
export function sortPlaylistsByDate(playlists: any[]): any[] {
  return playlists.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
}

/**
 * 分离评级播放列表和普通播放列表
 */
export function separateRatedPlaylists(playlists: any[]): [any[], any[]] {
  const ratedPlaylists = playlists.filter(playlist => playlist.isRatedPlaylist);
  const nonRatedPlaylists = playlists.filter(playlist => !playlist.isRatedPlaylist);
  return [ratedPlaylists, nonRatedPlaylists];
}

/**
 * 检查播放列表是否有更新
 */
export function hasPlaylistUpdated(playlist: any, cachedPlaylist: any): boolean {
  return !cachedPlaylist || cachedPlaylist.totalLength !== playlist.totalLength;
}

/**
 * 构建URI到播放列表项的映射
 */
export function buildUriToPlaylistItems(cachedPlaylistItems: any[]): Record<string, any[]> {
  const uriToItems: Record<string, any[]> = {};
  cachedPlaylistItems.forEach((playlistItems) => {
    uriToItems[playlistItems.uri] = playlistItems.items;
  });
  return uriToItems;
}