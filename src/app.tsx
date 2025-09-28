import React from "react";
import ReactDOM from "react-dom";
import "./app.css";
import { CONFIG, CSS_CLASSES } from "./constants";
import { PlaylistData } from "./types";
import { appState } from "./state/AppState";
import { layoutManager } from "./services/LayoutManager";
import { PlaylistLabelsContainer } from "./components/PlaylistLabelsContainer";
import { removeTrackFromPlaylist } from "./api";
import {
  getTrackUriToPlaylistData,
  updateLikedTracks,
  updatePlaylistData,
} from "./playlist";
import {
  getMainElement,
  getMainViewElement,
  getTracklistElements,
  getTrackRowElements,
  getTracklistTrackUri,
  createLabelContainer,
  insertLabelContainer,
  playlistUriToPlaylistId,
} from "./utils/dom";
import { filterPlaylistData } from "./utils/filters";

// 全局观察器和更新Promise
let mainElementObserver: MutationObserver;
let updatePromise = Promise.resolve();

/**
 * 轨道列表渲染管理器
 */
class TracklistRenderer {
  /**
   * 更新轨道列表显示
   */
  updateTracklist(): void {
    const state = appState.getState();

    // 检测轨道列表变化
    const newTracklists = getTracklistElements();
    appState.updateTracklists(newTracklists);

    if (appState.hasTracklistsChanged()) {
      layoutManager.resetLayout();
    }

    // 处理每个轨道列表
    for (const tracklist of state.tracklists) {
      this.processTracklist(tracklist);
    }

    appState.resetPlaylistUpdated();
  }

  /**
   * 处理单个轨道列表
   */
  private processTracklist(tracklist: Element): void {
    const tracks = getTrackRowElements(tracklist);

    for (const track of tracks) {
      this.processTrackRow(track as HTMLElement);
    }
  }

  /**
   * 处理单个轨道行
   */
  private processTrackRow(track: HTMLElement): void {
    const state = appState.getState();

    // 更新行高
    this.updateRowHeightIfNeeded(track);

    const trackUri = getTracklistTrackUri(track);
    if (!trackUri) return;

    // 处理高亮轨道
    this.handleTrackHighlight(track, trackUri);

    // 获取过滤后的播放列表数据
    const filteredPlaylistData = this.getFilteredPlaylistData(trackUri);

    // 更新CSS变量
    layoutManager.updateMaxExistingLabelCount(filteredPlaylistData.length);

    // 处理标签容器
    this.handleLabelContainer(track, trackUri, filteredPlaylistData);
  }

  /**
   * 更新行高（如果需要）
   */
  private updateRowHeightIfNeeded(track: HTMLElement): void {
    const trackStyle = getComputedStyle(track);

    // Stats应用兼容性处理
    const statsApp = document.querySelector(CONFIG.SELECTORS.STATS_APP);
    if (statsApp) {
      (statsApp as HTMLElement).style.setProperty(
        "--row-height",
        trackStyle.height,
      );
    }

    const trackRowHeight = trackStyle.getPropertyValue("--row-height");
    if (trackRowHeight && trackRowHeight !== appState.getState().rowHeight) {
      layoutManager.updateRowHeight(trackRowHeight);
    }
  }

  /**
   * 处理轨道高亮
   */
  private handleTrackHighlight(track: HTMLElement, trackUri: string): void {
    const state = appState.getState();
    if (
      state.highlightTrack === trackUri &&
      Spicetify.Platform.History.location.pathname === state.highlightTrackPath
    ) {
      track.click();
      appState.setHighlightTrack(null);
    }
  }

  /**
   * 获取过滤后的播放列表数据
   */
  private getFilteredPlaylistData(trackUri: string): PlaylistData[] {
    const state = appState.getState();
    const playlistData = state.trackUriToPlaylistData[trackUri] ?? [];
    return filterPlaylistData(playlistData, state.showAllPlaylists);
  }

  /**
   * 处理标签容器
   */
  private handleLabelContainer(
    track: HTMLElement,
    trackUri: string,
    filteredPlaylistData: PlaylistData[],
  ): void {
    const state = appState.getState();
    let labelContainer = track.querySelector(
      `.${CSS_CLASSES.LABEL_CONTAINER}`,
    ) as HTMLElement;

    // 如果需要完全更新，移除现有容器
    if (state.playlistUpdated && labelContainer) {
      labelContainer.remove();
      labelContainer = null;
    }

    // 创建或更新标签容器
    if (!labelContainer && filteredPlaylistData.length > 0) {
      this.createAndRenderLabels(track, trackUri, filteredPlaylistData);
    }
  }

  /**
   * 创建并渲染标签
   */
  private createAndRenderLabels(
    track: HTMLElement,
    trackUri: string,
    filteredPlaylistData: PlaylistData[],
  ): void {
    const state = appState.getState();
    const labelContainer = createLabelContainer();

    ReactDOM.render(
      <PlaylistLabelsContainer
        playlistData={filteredPlaylistData}
        trackUri={trackUri}
        maxLabelCount={state.maxLabelCount}
        onRemoveTrack={this.handleRemoveTrack}
        onNavigateToPlaylist={this.handleNavigateToPlaylist}
      />,
      labelContainer,
    );

    insertLabelContainer(track, labelContainer);
  }

  /**
   * 处理移除轨道
   */
  private handleRemoveTrack = (playlistUri: string, trackUri: string): void => {
    removeTrackFromPlaylist(playlistUri, trackUri);

    // 乐观更新UI
    const state = appState.getState();
    if (state.trackUriToPlaylistData[trackUri]) {
      const updatedData = state.trackUriToPlaylistData[trackUri].filter(
        (data) => data.uri !== playlistUri,
      );
      const newTrackData = { ...state.trackUriToPlaylistData };
      newTrackData[trackUri] = updatedData;
      appState.setTrackUriToPlaylistData(newTrackData);
    }

    appState.markPlaylistUpdated();
    this.updateTracklist();
  };

  /**
   * 处理导航到播放列表
   */
  private handleNavigateToPlaylist = (
    playlistData: PlaylistData,
    trackUri: string,
  ): void => {
    const path = playlistData.isLikedTracks
      ? CONFIG.PATHS.LIKED_TRACKS
      : Spicetify.URI.fromString(playlistData.uri!)?.toURLPath(true);

    appState.setHighlightTrack(trackUri, path);

    if (path) {
      Spicetify.Platform.History.push({
        pathname: path,
        search: `?uid=${playlistData.trackUid}`,
      });
    }
  };
}

// 创建渲染器实例
const tracklistRenderer = new TracklistRenderer();

/**
 * 观察器回调函数
 */
async function observerCallback(): Promise<void> {
  const newMainElement = getMainElement();
  appState.updateMainElement(newMainElement);

  if (appState.hasMainElementChanged()) {
    const state = appState.getState();
    if (state.oldMainElement) {
      mainElementObserver.disconnect();
    }

    tracklistRenderer.updateTracklist();

    // 开始观察新的主元素
    if (state.mainElement) {
      mainElementObserver.observe(state.mainElement, {
        childList: true,
        subtree: true,
      });
    }
  }
}

/**
 * 应用程序主入口
 */
async function main(): Promise<void> {
  // 等待Spicetify加载
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // 初始化状态
  const mainView = getMainViewElement();
  appState.setMainView(mainView);

  // 加载用户设置
  const showAllPlaylists = JSON.parse(
    localStorage.getItem(CONFIG.STORAGE_KEYS.SHOW_ALL) || "false",
  );
  appState.setShowAllPlaylists(showAllPlaylists);

  // 数据更新辅助函数
  const updateDataAndTracklist = (promise: Promise<any>) => {
    promise.then((data) => {
      appState.setTrackUriToPlaylistData(data);
      appState.markPlaylistUpdated();
      tracklistRenderer.updateTracklist();
    });
  };

  // 设置事件监听器
  await setupEventListeners(updateDataAndTracklist);

  // 创建播放栏按钮
  createPlaybarButton();

  // 初始数据加载
  const initialData = await getTrackUriToPlaylistData();
  appState.setTrackUriToPlaylistData(initialData);

  // 设置观察器
  setupObservers();
}

/**
 * 设置事件监听器
 */
async function setupEventListeners(
  updateCallback: (promise: Promise<any>) => void,
): Promise<void> {
  // 库更新监听器
  await Spicetify.Platform.LibraryAPI.getEvents().addListener("update", () => {
    updatePromise = updatePromise.then(() => updateLikedTracks());
    updateCallback(updatePromise);
  });

  // 播放列表操作监听器
  await Spicetify.Platform.PlaylistAPI.getEvents().addListener(
    "operation_complete",
    (event) => {
      updatePromise = updatePromise.then(() =>
        updatePlaylistData(event.data.uri),
      );
      updateCallback(updatePromise);
    },
  );
}

/**
 * 创建播放栏按钮
 */
function createPlaybarButton(): void {
  const handleButtonClick = (buttonElement: Spicetify.Playbar.Button) => {
    const newShowAllState = appState.toggleShowAllPlaylists();
    buttonElement.active = newShowAllState;
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.SHOW_ALL,
      JSON.stringify(newShowAllState),
    );
    appState.markPlaylistUpdated();
    tracklistRenderer.updateTracklist();
  };

  const iconHTML = `<svg data-encore-id="icon" role="img" viewBox="0 0 16 16" class="Svg-img-icon-small">${Spicetify.SVGIcons["spotify"]}</svg>`;
  new Spicetify.Playbar.Button(
    "Show All Saved Playlists",
    iconHTML,
    handleButtonClick,
    false,
    appState.getState().showAllPlaylists,
  );
}

/**
 * 设置观察器
 */
function setupObservers(): void {
  // 主元素观察器
  mainElementObserver = new MutationObserver(() => {
    tracklistRenderer.updateTracklist();
  });

  // 页面观察器
  const pageObserver = new MutationObserver(observerCallback);
  observerCallback();
  pageObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 尺寸观察器
  const resizeObserver = new ResizeObserver(() => {
    layoutManager.calculateMaxLabelCount();
  });

  const mainView = appState.getState().mainView;
  if (mainView) {
    resizeObserver.observe(mainView);
  }
}

export default main;
