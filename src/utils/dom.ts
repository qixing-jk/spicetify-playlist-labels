import { CONFIG } from "../constants";
import { getFiberFromDom, getParentProps } from "../utilties";
import { PlaylistData } from "../types";

/**
 * 从Spotify播放列表URI提取播放列表ID
 */
export function playlistUriToPlaylistId(
  uri: string | null,
): string | undefined {
  return uri?.match(/spotify:playlist:(.*)/)?.[1];
}

/**
 * 获取轨道行的URI
 */
export function getTracklistTrackUri(tracklistElement: Element): string | null {
  const tracklistParentElement = tracklistElement.parentElement;
  if (!tracklistParentElement) return null;

  const tracklistParentFiber = getFiberFromDom(
    tracklistParentElement as HTMLElement,
  );
  if (!tracklistParentFiber) return null;

  const tracklistParentProps = getParentProps(tracklistParentFiber, (fiber) => {
    const props = fiber.memoizedProps || fiber.pendingProps;
    return props && props.uri;
  });

  if (!tracklistParentProps) {
    return null;
  }
  return tracklistParentProps.uri;
}

/**
 * 更新CSS变量
 */
export function updateCSSVariable(variable: string, value: string): void {
  document.documentElement.style.setProperty(variable, value);
}

/**
 * 获取所有轨道列表元素
 */
export function getTracklistElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(CONFIG.SELECTORS.TRACKLIST),
  ) as HTMLElement[];
}

/**
 * 获取轨道行元素
 */
export function getTrackRowElements(
  tracklist: Element,
): HTMLCollectionOf<Element> {
  return tracklist.getElementsByClassName("main-trackList-trackListRow");
}

/**
 * 获取主元素
 */
export function getMainElement(): HTMLElement | null {
  return document.querySelector(CONFIG.SELECTORS.MAIN);
}

/**
 * 获取主视图元素
 */
export function getMainViewElement(): Element | null {
  return document.querySelector(CONFIG.SELECTORS.MAIN_VIEW);
}

/**
 * 创建标签容器元素
 */
export function createLabelContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.classList.add("spicetify-playlist-labels");
  return container;
}

/**
 * 插入标签容器到轨道行
 */
export function insertLabelContainer(
  track: Element,
  labelContainer: HTMLElement,
): void {
  const lastColumn = track.querySelector(CONFIG.SELECTORS.LAST_COLUMN);
  if (lastColumn) {
    lastColumn.insertBefore(labelContainer, lastColumn.firstChild);
  }
}

/**
 * 检查是否在当前播放列表页面
 */
export function isCurrentPlaylistPage(playlistData: PlaylistData): boolean {
  if (!playlistData.isLikedTracks) {
    const playlistId = playlistUriToPlaylistId(playlistData.uri);
    return (
      Spicetify.Platform.History.location.pathname === `/playlist/${playlistId}`
    );
  } else {
    return (
      Spicetify.Platform.History.location.pathname === "/collection/tracks"
    );
  }
}
