import { CONFIG } from "../constants";
import { appState } from "../state/AppState";
import { updateCSSVariable } from "../utils/dom";

/**
 * 布局管理器，负责计算和管理播放列表标签的显示
 */
export class LayoutManager {
  /**
   * 计算并更新最大标签数量
   */
  calculateMaxLabelCount(): void {
    const state = appState.getState();
    if (!state.mainView) return;

    const contentRect = state.mainView.getBoundingClientRect();
    const space = state.rowHeight === CONFIG.DEFAULT_ROW_HEIGHT ? 44 : 32;
    const minViewSize = CONFIG.MIN_VIEW_SIZE;
    const maxPossibleLabelCount = CONFIG.MAX_POSSIBLE_LABEL_COUNT;

    let newMaxLabelCount = this.calculateLabelCountByWidth(
      contentRect.width,
      space,
      minViewSize,
      maxPossibleLabelCount,
    );

    if (newMaxLabelCount !== state.maxLabelCount) {
      appState.updateMaxLabelCount(newMaxLabelCount);
      updateCSSVariable(CONFIG.CSS_VARS.MAX_LABEL_COUNT, `${newMaxLabelCount}`);
      appState.markPlaylistUpdated();
    }
  }

  /**
   * 根据宽度计算标签数量
   */
  private calculateLabelCountByWidth(
    width: number,
    space: number,
    minViewSize: number,
    maxPossibleLabelCount: number,
  ): number {
    // 基础情况：最小宽度只显示1个标签
    if (width <= minViewSize) {
      return 1;
    }

    // 计算能显示多少标签
    for (let i = 1; i < maxPossibleLabelCount - 1; i++) {
      const min = minViewSize + 1 + space * (i - 1);
      const max = minViewSize + 1 + space * i;
      if (width >= min && width <= max) {
        return i + 1;
      }
    }

    // 超过最大计算范围，返回最大值
    const minForMax = minViewSize + 1 + space * (maxPossibleLabelCount - 2);
    return width >= minForMax ? maxPossibleLabelCount : 1;
  }

  /**
   * 更新行高并重新计算布局
   */
  updateRowHeight(newHeight: string): void {
    const state = appState.getState();
    if (newHeight !== state.rowHeight) {
      appState.updateRowHeight(newHeight);
      updateCSSVariable(CONFIG.CSS_VARS.SIZE, `calc(${newHeight} * 0.5)`);
      this.calculateMaxLabelCount();
      appState.markPlaylistUpdated();
    }
  }

  /**
   * 更新最大现有标签数量
   */
  updateMaxExistingLabelCount(count: number): void {
    const state = appState.getState();
    if (count > state.maxExistingLabelCount) {
      appState.updateMaxExistingLabelCount(count);
      updateCSSVariable(CONFIG.CSS_VARS.LABEL_COUNT, `${count}`);
    }
  }

  /**
   * 重置布局状态
   */
  resetLayout(): void {
    appState.resetMaxExistingLabelCount();
  }
}

// 导出单例实例
export const layoutManager = new LayoutManager();
