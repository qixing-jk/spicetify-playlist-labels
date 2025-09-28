// 播放列表数据接口
export interface PlaylistData {
  isOwnPlaylist: boolean;
  isLikedTracks: boolean;
  uri: string | null;
  name: string;
  trackUid: string;
  image: string;
}

// 应用状态接口
export interface AppState {
  oldMainElement: HTMLElement | null;
  mainElement: HTMLElement | null;
  tracklists: HTMLElement[];
  oldTracklists: HTMLElement[];
  trackUriToPlaylistData: Record<string, PlaylistData[]>;
  playlistUpdated: boolean;
  showAllPlaylists: boolean;
  highlightTrack: string | null;
  highlightTrackPath: string | null | undefined;
  maxExistingLabelCount: number;
  maxLabelCount: number;
  rowHeight: string;
  mainView: Element | null;
}

// 缓存相关类型
export interface CachedPlaylistItem {
  uri: string;
  items: any[];
}

export interface PlaylistExtra {
  uri: string;
  name: string;
  totalLength: number;
  addedAt: string;
  images: Array<{ url: string }>;
  isOwnedBySelf: boolean;
  isRatedPlaylist?: boolean;
}

// 数据库操作接口
export interface DatabaseOperations {
  getDb(): Promise<IDBDatabase>;
  getCachedPlaylists(db: IDBDatabase): Promise<any[]>;
  getCachedPlaylistItems(db: IDBDatabase): Promise<any[]>;
  cachePlaylists(db: IDBDatabase, playlists: any[]): Promise<void>;
  cachePlaylistItems(db: IDBDatabase, uriToPlaylistItems: any): Promise<void>;
  clearCachedPlaylists(db: IDBDatabase): Promise<void>;
  clearCachedPlaylistItems(db: IDBDatabase): Promise<void>;
}

// 工具函数类型
export type FilterFunction = (parent: any) => boolean;

// 事件处理器类型
export type ButtonClickHandler = (
  buttonElement: Spicetify.Playbar.Button,
) => void;
export type MenuItemClickHandler = (e: React.MouseEvent) => void;
export type LabelClickHandler = (e: React.MouseEvent) => void;
