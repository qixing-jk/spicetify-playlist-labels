import { AppState, PlaylistData } from "../types";
import { CONFIG } from "../constants";

// 应用状态管理类
class AppStateManager {
  private state: AppState = {
    oldMainElement: null,
    mainElement: null,
    tracklists: [],
    oldTracklists: [],
    trackUriToPlaylistData: {},
    playlistUpdated: false,
    showAllPlaylists: false,
    highlightTrack: null,
    highlightTrackPath: null,
    maxExistingLabelCount: 0,
    maxLabelCount: 1,
    rowHeight: CONFIG.DEFAULT_ROW_HEIGHT,
    mainView: null,
  };

  // 获取完整状态
  getState(): AppState {
    return this.state;
  }

  // 更新主元素
  updateMainElement(element: HTMLElement | null): void {
    this.state.oldMainElement = this.state.mainElement;
    this.state.mainElement = element;
  }

  // 更新轨道列表
  updateTracklists(tracklists: HTMLElement[]): void {
    this.state.oldTracklists = this.state.tracklists;
    this.state.tracklists = tracklists;
  }

  // 设置播放列表数据
  setTrackUriToPlaylistData(data: Record<string, PlaylistData[]>): void {
    this.state.trackUriToPlaylistData = data;
  }

  // 标记播放列表已更新
  markPlaylistUpdated(): void {
    this.state.playlistUpdated = true;
  }

  // 重置更新标志
  resetPlaylistUpdated(): void {
    this.state.playlistUpdated = false;
  }

  // 切换显示所有播放列表
  toggleShowAllPlaylists(): boolean {
    this.state.showAllPlaylists = !this.state.showAllPlaylists;
    return this.state.showAllPlaylists;
  }

  // 设置显示所有播放列表
  setShowAllPlaylists(show: boolean): void {
    this.state.showAllPlaylists = show;
  }

  // 设置高亮轨道
  setHighlightTrack(trackUri: string | null, path?: string | null): void {
    this.state.highlightTrack = trackUri;
    this.state.highlightTrackPath = path;
  }

  // 更新最大标签数量
  updateMaxLabelCount(count: number): void {
    this.state.maxLabelCount = count;
  }

  // 更新最大现有标签数量
  updateMaxExistingLabelCount(count: number): void {
    if (count > this.state.maxExistingLabelCount) {
      this.state.maxExistingLabelCount = count;
    }
  }

  // 重置最大现有标签数量
  resetMaxExistingLabelCount(): void {
    this.state.maxExistingLabelCount = 0;
  }

  // 更新行高
  updateRowHeight(height: string): void {
    this.state.rowHeight = height;
  }

  // 设置主视图
  setMainView(view: Element | null): void {
    this.state.mainView = view;
  }

  // 检查轨道列表是否改变
  hasTracklistsChanged(): boolean {
    return (
      this.state.oldTracklists.length !== this.state.tracklists.length ||
      !this.state.oldTracklists.every(
        (value, index) => value === this.state.tracklists[index],
      )
    );
  }

  // 检查主元素是否改变
  hasMainElementChanged(): boolean {
    return (
      !!this.state.mainElement &&
      !this.state.mainElement.isEqualNode(this.state.oldMainElement)
    );
  }
}

// 导出单例实例
export const appState = new AppStateManager();
