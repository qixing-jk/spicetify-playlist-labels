import { CONFIG } from "../constants";
import { appState } from "../state/AppState";
import { updateCSSVariable } from "../utils/dom";

/**
 * Layout manager responsible for calculating and managing the display of playlist labels.
 */
export class LayoutManager {
  /**
   * Calculates and updates the maximum number of labels.
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
   * Calculates the number of labels based on width.
   */
  private calculateLabelCountByWidth(
    width: number,
    space: number,
    minViewSize: number,
    maxPossibleLabelCount: number,
  ): number {
      // Base case: minimum width shows only 1 label
    if (width <= minViewSize) {
      return 1;
    }

      // Calculate how many labels can be displayed
    for (let i = 1; i < maxPossibleLabelCount - 1; i++) {
      const min = minViewSize + 1 + space * (i - 1);
      const max = minViewSize + 1 + space * i;
      if (width >= min && width <= max) {
        return i + 1;
      }
    }

      // Exceeds maximum calculation range, return max value
    const minForMax = minViewSize + 1 + space * (maxPossibleLabelCount - 2);
    return width >= minForMax ? maxPossibleLabelCount : 1;
  }

  /**
   * Updates row height and recalculates layout.
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
   * Updates the maximum number of existing labels.
   */
  updateMaxExistingLabelCount(count: number): void {
    const state = appState.getState();
    if (count > state.maxExistingLabelCount) {
      appState.updateMaxExistingLabelCount(count);
      updateCSSVariable(CONFIG.CSS_VARS.LABEL_COUNT, `${count}`);
    }
  }

  /**
   * Resets the layout state.
   */
  resetLayout(): void {
    appState.resetMaxExistingLabelCount();
  }
}

// Export a singleton instance
export const layoutManager = new LayoutManager();
