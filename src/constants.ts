// Application constant configuration
export const CONFIG = {
  // UI configuration
  DEFAULT_ROW_HEIGHT: "56px",
  MAX_POSSIBLE_LABEL_COUNT: 20,
  MIN_VIEW_SIZE: 516,

  // Cache configuration
  DB_NAME: "spicetify-playlist-labels",
  DB_VERSION: 2,

  // CSS variables
  CSS_VARS: {
    MAX_LABEL_COUNT: "--spicetify-playlist-labels-max-label-count",
    LABEL_COUNT: "--spicetify-playlist-labels-label-count",
    SIZE: "--spicetify-playlist-labels-size",
  },

  // Local storage keys
  STORAGE_KEYS: {
    SHOW_ALL: "spicetify-playlist-labels:show-all",
    LIKED_TRACKS_COUNT: "spicetify-playlist-labels:liked-tracks-count",
  },

  // Selectors
  SELECTORS: {
    MAIN: "main",
    MAIN_VIEW: ".Root__main-view",
    TRACKLIST: ".main-trackList-indexable",
    TRACK_ROW: ".main-trackList-trackListRow",
    LAST_COLUMN: ".main-trackList-rowSectionEnd",
    STATS_APP: "#stats-app .main-rootlist-wrapper",
  },

  // Paths
  PATHS: {
    LIKED_TRACKS: "/collection/tracks",
    PLAYLIST: "/playlist/",
  },

  // Image URLs
  LIKED_SONGS_IMAGE: "https://misc.scdn.co/liked-songs/liked-songs-300.png",
} as const;

// CSS class names
export const CSS_CLASSES = {
  LABEL_CONTAINER: "spicetify-playlist-labels",
  LABELS_CONTAINER: "spicetify-playlist-labels-labels-container",
  TRACK_CONTAINER: "spicetify-playlist-labels-label-container",
  OVERFLOW_BUTTON: "spicetify-playlist-labels-overflow-button",
  OVERFLOW_MENU_SHELL: "spicetify-playlist-labels-overflow-menu-shell",
  OVERFLOW_MENU: "spicetify-playlist-labels-overflow-menu",
} as const;
