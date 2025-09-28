// 应用程序常量配置
export const CONFIG = {
  // UI 配置
  DEFAULT_ROW_HEIGHT: '56px',
  MAX_POSSIBLE_LABEL_COUNT: 20,
  MIN_VIEW_SIZE: 516,
  
  // 缓存配置
  DB_NAME: 'spicetify-playlist-labels',
  DB_VERSION: 2,
  
  // CSS 变量
  CSS_VARS: {
    MAX_LABEL_COUNT: '--spicetify-playlist-labels-max-label-count',
    LABEL_COUNT: '--spicetify-playlist-labels-label-count',
    SIZE: '--spicetify-playlist-labels-size'
  },
  
  // 本地存储键名
  STORAGE_KEYS: {
    SHOW_ALL: 'spicetify-playlist-labels:show-all',
    LIKED_TRACKS_COUNT: 'spicetify-playlist-labels:liked-tracks-count'
  },
  
  // 选择器
  SELECTORS: {
    MAIN: 'main',
    MAIN_VIEW: '.Root__main-view',
    TRACKLIST: '.main-trackList-indexable',
    TRACK_ROW: '.main-trackList-trackListRow',
    LAST_COLUMN: '.main-trackList-rowSectionEnd',
    STATS_APP: '#stats-app .main-rootlist-wrapper'
  },
  
  // 路径
  PATHS: {
    LIKED_TRACKS: '/collection/tracks',
    PLAYLIST: '/playlist/'
  },
  
  // 图片URL
  LIKED_SONGS_IMAGE: 'https://misc.scdn.co/liked-songs/liked-songs-300.png'
} as const;

// CSS 类名
export const CSS_CLASSES = {
  LABEL_CONTAINER: 'spicetify-playlist-labels',
  LABELS_CONTAINER: 'spicetify-playlist-labels-labels-container',
  OVERFLOW: 'spicetify-playlist-labels-overflow',
  TRACK_CONTAINER: 'spicetify-playlist-labels-label-container'
} as const;