// Playlist data interface
export interface PlaylistData {
  isOwnPlaylist: boolean;
  isLikedTracks: boolean;
  uri: string | null;
  name: string;
  trackUid: string;
  image: string;
}

export interface PlaylistItem {
  uri: string;
  uid: string;
}

export interface PlaylistItemsByUri {
  [uri: string]: PlaylistItem[];
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
  items: PlaylistItem[];
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

export interface RootlistItem {
  type: string;
  uri?: string;
  name?: string;
  items?: RootlistItem[];
  totalLength?: number;
  addedAt?: string;
  images?: Array<{ url: string }>;
  isOwnedBySelf?: boolean;
}

export interface PlaylistMetadata {
  uri: string;
  images?: Array<{ url: string }>;
}

export interface LikedTracksResponse {
  items: PlaylistItem[];
  totalLength: number;
}

// Database operations interface
export interface DatabaseOperations {
  getDb(): Promise<IDBDatabase>;
  getCachedPlaylists(db: IDBDatabase): Promise<PlaylistExtra[]>;
  getCachedPlaylistItems(db: IDBDatabase): Promise<CachedPlaylistItem[]>;
  cachePlaylists(db: IDBDatabase, playlists: PlaylistExtra[]): Promise<void>;
  cachePlaylistItems(
    db: IDBDatabase,
    uriToPlaylistItems: PlaylistItemsByUri,
  ): Promise<void>;
  clearCachedPlaylists(db: IDBDatabase): Promise<void>;
  clearCachedPlaylistItems(db: IDBDatabase): Promise<void>;
}
