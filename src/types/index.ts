// Playlist data interface
export interface PlaylistData {
  isOwnPlaylist: boolean;
  isLikedTracks: boolean;
  uri: string | null;
  name: string;
  trackUid: string;
  image: string;
}

// App state interface
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

// Cache-related types
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

// Database operations interface
export interface DatabaseOperations {
  getDb(): Promise<IDBDatabase>;
  getCachedPlaylists(db: IDBDatabase): Promise<any[]>;
  getCachedPlaylistItems(db: IDBDatabase): Promise<any[]>;
  cachePlaylists(db: IDBDatabase, playlists: any[]): Promise<void>;
  cachePlaylistItems(db: IDBDatabase, uriToPlaylistItems: any): Promise<void>;
  clearCachedPlaylists(db: IDBDatabase): Promise<void>;
  clearCachedPlaylistItems(db: IDBDatabase): Promise<void>;
}

