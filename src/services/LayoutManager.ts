import { CONFIG, CSS_CLASSES } from "../constants";
import { appState } from "../state/AppState";
import { updateCSSVariable } from "../utils/dom";

export interface TracklistLabelLayout {
  maxLabelCount: number;
  columnWidth: number;
  gridTemplateColumns: string | null;
}

export interface ResolvedLabelRenderLayout {
  maxLabelCount: number;
  columnWidth: number;
}

/**
 * Layout manager responsible for calculating and managing the display of playlist labels.
 */
export class LayoutManager {
  /**
   * Updates row height and recalculates layout.
   */
  updateRowHeight(newHeight: string): void {
    const state = appState.getState();
    if (newHeight !== state.rowHeight) {
      appState.updateRowHeight(newHeight);
      updateCSSVariable(CONFIG.CSS_VARS.SIZE, `calc(${newHeight} * 0.5)`);
    }
  }

  /**
   * Removes inline grid overrides so fresh measurements follow Spotify's layout.
   */
  clearTracklistGridLayout(tracklist: HTMLElement): void {
    const gridElements = tracklist.querySelectorAll(
      ".main-trackList-trackListRowGrid",
    );
    for (const element of gridElements) {
      const row = element as HTMLElement;
      row.style.removeProperty("grid-template-columns");
      for (const child of Array.from(row.children) as HTMLElement[]) {
        child.style.removeProperty("grid-column");
      }
    }
  }

  /**
   * Calculates the grid layout for a single tracklist.
   */
  calculateTracklistLabelLayout(
    tracklist: HTMLElement,
    maxPlaylistCount: number,
  ): TracklistLabelLayout {
    if (maxPlaylistCount < 1) {
      return {
        maxLabelCount: 0,
        columnWidth: 0,
        gridTemplateColumns: null,
      };
    }

    const sampleRow = tracklist.querySelector(
      CONFIG.SELECTORS.TRACK_ROW,
    ) as HTMLElement | null;
    if (!sampleRow) {
      return {
        maxLabelCount: 0,
        columnWidth: 0,
        gridTemplateColumns: null,
      };
    }

    const sampleRowStyle = getComputedStyle(sampleRow);
    const baseColumns = this.splitGridTemplateColumns(
      sampleRowStyle.gridTemplateColumns,
    );
    if (baseColumns.length < 2) {
      return {
        maxLabelCount: 0,
        columnWidth: 0,
        gridTemplateColumns: null,
      };
    }

    const state = appState.getState();
    const labelSize = this.getLabelSize(state.rowHeight);
    const baseMaxLabelCount = Math.max(
      1,
      Math.min(maxPlaylistCount, CONFIG.MAX_POSSIBLE_LABEL_COUNT),
    );
    const columnGap = this.parsePixelValue(sampleRowStyle.columnGap);

    for (let candidate = baseMaxLabelCount; candidate >= 1; candidate--) {
      const renderLayout = this.getRenderLayout(
        candidate,
        maxPlaylistCount,
        labelSize,
      );
      const adjustedColumns = this.allocateLabelColumn(
        sampleRow,
        baseColumns,
        renderLayout.columnWidth,
        columnGap,
      );

      if (adjustedColumns) {
        return {
          maxLabelCount: candidate,
          columnWidth: renderLayout.columnWidth,
          gridTemplateColumns: adjustedColumns.join(" "),
        };
      }
    }

    return {
      maxLabelCount: 0,
      columnWidth: 0,
      gridTemplateColumns: null,
    };
  }

  resolveLabelRenderLayout(
    playlistCount: number,
    availableWidth: number,
  ): ResolvedLabelRenderLayout {
    if (playlistCount < 1 || availableWidth < 1) {
      return {
        maxLabelCount: 0,
        columnWidth: 0,
      };
    }

    const state = appState.getState();
    const labelSize = this.getLabelSize(state.rowHeight);
    const maxCandidate = Math.max(
      1,
      Math.min(playlistCount, CONFIG.MAX_POSSIBLE_LABEL_COUNT),
    );

    for (let candidate = maxCandidate; candidate >= 1; candidate--) {
      const renderLayout = this.getRenderLayout(
        candidate,
        playlistCount,
        labelSize,
      );
      if (renderLayout.columnWidth <= availableWidth) {
        return {
          maxLabelCount: candidate,
          columnWidth: renderLayout.columnWidth,
        };
      }
    }

    return {
      maxLabelCount: 0,
      columnWidth: 0,
    };
  }

  private allocateLabelColumn(
    sampleRow: HTMLElement,
    columns: string[],
    labelColumnWidth: number,
    columnGap: number,
  ): string[] | null {
    const parsedColumns = columns.map((column, index) => ({
      index,
      width: this.parsePixelValue(column),
    }));
    const rowChildren = this.getNativeRowChildren(sampleRow);

    const donorColumns = parsedColumns
      .slice(1, -1)
      .map((column) => {
        const donorElement = rowChildren[column.index];
        const minimumWidth = this.getGridItemMinimumWidth(donorElement);
        return {
          ...column,
          availableReduction: Math.max(column.width - minimumWidth, 0),
        };
      })
      .filter((column) => column.availableReduction > 0)
      .sort((left, right) => right.width - left.width);

    let remainingWidth =
      labelColumnWidth + (columns.length > 1 ? columnGap : 0);
    for (const donor of donorColumns) {
      const reduction = Math.min(donor.availableReduction, remainingWidth);

      donor.width -= reduction;
      remainingWidth -= reduction;

      if (remainingWidth <= 0) {
        break;
      }
    }

    if (remainingWidth > 0) {
      return null;
    }

    const rebalancedWidths = parsedColumns
      .sort((left, right) => left.index - right.index)
      .map((column) => `${Math.max(Math.floor(column.width), 0)}px`);

    const lastColumn = rebalancedWidths.pop();
    if (!lastColumn) {
      return null;
    }

    return [
      ...rebalancedWidths,
      `minmax(0, ${labelColumnWidth}px)`,
      lastColumn,
    ];
  }

  private getNativeRowChildren(row: HTMLElement): HTMLElement[] {
    return Array.from(row.children).filter(
      (child) => !child.classList.contains(CSS_CLASSES.LABEL_CONTAINER),
    ) as HTMLElement[];
  }

  private getGridItemMinimumWidth(element: HTMLElement | undefined): number {
    if (!element) {
      return 0;
    }

    const style = getComputedStyle(element);
    const minimumWidth = this.parsePixelValue(style.minWidth);
    const horizontalChrome =
      this.parsePixelValue(style.paddingLeft) +
      this.parsePixelValue(style.paddingRight) +
      this.parsePixelValue(style.borderLeftWidth) +
      this.parsePixelValue(style.borderRightWidth);

    if (style.boxSizing === "border-box") {
      return Math.max(minimumWidth, horizontalChrome);
    }

    return Math.max(minimumWidth + horizontalChrome, horizontalChrome);
  }

  private getRenderLayout(
    maxLabelCount: number,
    playlistCount: number,
    labelSize: number,
  ): { columnWidth: number } {
    const hasOverflow = playlistCount > maxLabelCount;
    const shouldRenderOverflowOnly = hasOverflow && maxLabelCount === 1;
    const shouldShowOverflowButton =
      hasOverflow && (maxLabelCount > 1 || shouldRenderOverflowOnly);
    const visibleLabelCount = shouldRenderOverflowOnly
      ? 0
      : hasOverflow
        ? Math.max(maxLabelCount - (shouldShowOverflowButton ? 1 : 0), 1)
        : Math.min(playlistCount, Math.max(maxLabelCount, 1));
    const hiddenCount = Math.max(playlistCount - visibleLabelCount, 0);
    const itemCount =
      visibleLabelCount + (shouldShowOverflowButton && hiddenCount > 0 ? 1 : 0);
    const overflowButtonWidth =
      shouldShowOverflowButton && hiddenCount > 0
        ? this.getOverflowButtonWidth(hiddenCount, labelSize)
        : 0;
    const columnWidth =
      visibleLabelCount * labelSize +
      overflowButtonWidth +
      Math.max(itemCount - 1, 0) * CONFIG.LABEL_GAP;

    return {
      columnWidth: Math.ceil(columnWidth),
    };
  }

  private getOverflowButtonWidth(
    hiddenCount: number,
    labelSize: number,
  ): number {
    const textWidth =
      (String(hiddenCount).length + 1) * CONFIG.OVERFLOW_BUTTON_CHARACTER_WIDTH;

    return Math.max(
      labelSize,
      textWidth + CONFIG.OVERFLOW_BUTTON_HORIZONTAL_PADDING,
    );
  }

  private getLabelSize(rowHeight: string): number {
    const parsedHeight = this.parsePixelValue(rowHeight);
    return parsedHeight > 0
      ? parsedHeight * 0.5
      : this.parsePixelValue(CONFIG.DEFAULT_ROW_HEIGHT) * 0.5;
  }

  private splitGridTemplateColumns(template: string): string[] {
    const columns: string[] = [];
    let currentColumn = "";
    let functionDepth = 0;
    let lineNameDepth = 0;

    for (const character of template) {
      if (lineNameDepth > 0) {
        if (character === "[") {
          lineNameDepth += 1;
        } else if (character === "]") {
          lineNameDepth = Math.max(lineNameDepth - 1, 0);
        }
        continue;
      }

      if (character === "[") {
        lineNameDepth = 1;
        if (currentColumn) {
          columns.push(currentColumn);
          currentColumn = "";
        }
        continue;
      }

      if (character === "(") {
        functionDepth += 1;
      } else if (character === ")") {
        functionDepth = Math.max(functionDepth - 1, 0);
      }

      if (character === " " && functionDepth === 0) {
        if (currentColumn) {
          columns.push(currentColumn);
          currentColumn = "";
        }
        continue;
      }

      currentColumn += character;
    }

    if (currentColumn) {
      columns.push(currentColumn);
    }

    return columns;
  }

  private parsePixelValue(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const parsedValue = Number.parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }
}

export const layoutManager = new LayoutManager();
