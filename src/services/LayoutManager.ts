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
    const maxLabelColumnWidth = this.getMaxLabelColumnWidth(
      sampleRow,
      baseColumns,
      columnGap,
    );

    for (let candidate = baseMaxLabelCount; candidate >= 1; candidate--) {
      const renderLayout = this.getRenderLayout(
        candidate,
        maxPlaylistCount,
        labelSize,
      );
      if (renderLayout.columnWidth > maxLabelColumnWidth) {
        continue;
      }

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

  private getMaxLabelColumnWidth(
    sampleRow: HTMLElement,
    columns: string[],
    columnGap: number,
  ): number {
    const adjacentColumnIndex = columns.length - 2;
    const adjacentColumnWidth = this.parsePixelValue(
      columns[adjacentColumnIndex],
    );
    const nativeChildren = this.getNativeRowChildren(sampleRow);
    const adjacentMinimumWidth = this.getColumnMinimumWidth(
      sampleRow,
      nativeChildren,
      columns.length,
      adjacentColumnIndex,
    );
    const trailingColumn = columns[columns.length - 1];
    const trailingColumnWidth = this.parsePixelValue(trailingColumn);
    const trailingColumnIndex = columns.length - 1;
    const trailingMinimumWidth = this.getColumnMinimumWidth(
      sampleRow,
      nativeChildren,
      columns.length,
      trailingColumnIndex,
    );
    const trailingSpareWidth = Math.max(
      trailingColumnWidth - trailingMinimumWidth,
      0,
    );
    const trailingColumnCap =
      trailingColumnWidth > 0
        ? trailingColumnWidth + columnGap
        : Number.POSITIVE_INFINITY;
    const adjacentSpareWidth =
      adjacentMinimumWidth > 0
        ? Math.max(adjacentColumnWidth - adjacentMinimumWidth + columnGap, 0)
        : 0;

    return Math.max(trailingColumnCap, adjacentSpareWidth) + trailingSpareWidth;
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
      .slice(1)
      .map((column) => {
        const minimumWidth = this.getColumnMinimumWidth(
          sampleRow,
          rowChildren,
          columns.length,
          column.index,
        );
        return {
          column,
          availableReduction: Math.max(column.width - minimumWidth, 0),
        };
      })
      .filter((column) => column.availableReduction > 0)
      .sort((left, right) => {
        const trailingColumnIndex = columns.length - 1;
        const adjacentColumnIndex = columns.length - 2;
        const getPriority = (index: number): number => {
          if (index === trailingColumnIndex) return 0;
          if (index === adjacentColumnIndex) return 1;
          return 2;
        };
        const priorityDifference =
          getPriority(left.column.index) - getPriority(right.column.index);

        return priorityDifference || right.column.width - left.column.width;
      });

    let remainingWidth =
      labelColumnWidth + (columns.length > 1 ? columnGap : 0);
    for (const donor of donorColumns) {
      const reduction = Math.min(donor.availableReduction, remainingWidth);

      donor.column.width -= reduction;
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

  private getConfiguredColumnMinimumWidth(
    row: HTMLElement,
    nativeChildren: HTMLElement[],
    columnCount: number,
    columnIndex: number,
  ): number {
    const firstChild = nativeChildren[0];
    const hasIndexColumn = firstChild?.classList.contains(
      "main-trackList-rowSectionIndex",
    );
    const firstContentColumnIndex = hasIndexColumn ? 1 : 0;
    let variableName: string | null = null;

    if (hasIndexColumn && columnIndex === 0) {
      variableName = "--index-column-width";
    } else if (columnIndex === columnCount - 1) {
      variableName = "--last-min-width";
    } else if (columnIndex === firstContentColumnIndex) {
      variableName = "--first-min-width";
    } else {
      const variableColumnIndex = columnIndex - firstContentColumnIndex;
      variableName =
        variableColumnIndex > 0
          ? `--var${variableColumnIndex}-min-width`
          : null;
    }

    if (!variableName) {
      return 0;
    }

    const tracklist = row.closest(CONFIG.SELECTORS.TRACKLIST);
    const style = getComputedStyle((tracklist as HTMLElement | null) ?? row);

    return this.parsePixelValue(style.getPropertyValue(variableName));
  }

  private getColumnMinimumWidth(
    row: HTMLElement,
    nativeChildren: HTMLElement[],
    columnCount: number,
    columnIndex: number,
  ): number {
    return Math.max(
      this.getGridItemMinimumWidth(nativeChildren[columnIndex]),
      this.getConfiguredColumnMinimumWidth(
        row,
        nativeChildren,
        columnCount,
        columnIndex,
      ),
    );
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
