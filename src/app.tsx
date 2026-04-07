import React from "react";
import ReactDOM from "react-dom";
import "./app.css";
import { CONFIG, CSS_CLASSES } from "./constants";
import { PlaylistData } from "./types";
import { appState } from "./state/AppState";
import { layoutManager } from "./services/LayoutManager";
import { PlaylistLabelsContainer } from "./components/PlaylistLabelsContainer";
import { removeTrackFromSource } from "./api";
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
  createLabelHeaderPlaceholder,
  insertLabelContainer,
  playlistUriToPlaylistId,
} from "./utils/dom";
import { filterPlaylistData } from "./utils/filters";
import type { TracklistLabelLayout } from "./services/LayoutManager";

// Global observers and update promise
let mainElementObserver: MutationObserver;
let updatePromise: Promise<void> = Promise.resolve();

interface TrackRowRenderData {
  track: HTMLElement;
  trackUri: string;
  filteredPlaylistData: PlaylistData[];
}

/**
 * Manages rendering of the tracklist.
 */
class TracklistRenderer {
  private updateFrameId: number | null = null;

  scheduleTracklistUpdate(): void {
    if (this.updateFrameId !== null) {
      return;
    }

    this.updateFrameId = window.requestAnimationFrame(() => {
      this.updateFrameId = null;
      this.updateTracklist();
    });
  }

  /**
   * Updates the tracklist display.
   */
  updateTracklist(): void {
    const state = appState.getState();

    // Detect tracklist changes
    const newTracklists = getTracklistElements();
    appState.updateTracklists(newTracklists);

    // Process each tracklist
    for (const tracklist of state.tracklists) {
      this.processTracklist(tracklist);
    }

    appState.resetPlaylistUpdated();
  }

  /**
   * Processes a single tracklist.
   */
  private processTracklist(tracklist: Element): void {
    const tracklistElement = tracklist as HTMLElement;
    layoutManager.clearTracklistGridLayout(tracklistElement);

    const tracks = Array.from(getTrackRowElements(tracklist)) as HTMLElement[];
    const trackRows: TrackRowRenderData[] = [];
    for (const track of tracks) {
      this.updateRowHeightIfNeeded(track);

      const trackUri = getTracklistTrackUri(track);
      if (!trackUri) {
        continue;
      }

      this.handleTrackHighlight(track, trackUri);

      const filteredPlaylistData = filterPlaylistData(
        this.getPlaylistData(trackUri),
        appState.getState().showAllPlaylists,
      );

      trackRows.push({
        track,
        trackUri,
        filteredPlaylistData,
      });
    }

    const maxPlaylistCount = trackRows.reduce(
      (maxCount: number, row: TrackRowRenderData) =>
        Math.max(maxCount, row.filteredPlaylistData.length),
      0,
    );

    const tracklistLayout = layoutManager.calculateTracklistLabelLayout(
      tracklistElement,
      maxPlaylistCount,
    );
    this.applyTracklistGridLayout(tracklistElement, tracklistLayout);
    const renderLayout = this.resolveTracklistRenderLayout(
      tracklistElement,
      trackRows,
      tracklistLayout,
      maxPlaylistCount,
    );

    for (const { track, trackUri, filteredPlaylistData } of trackRows) {
      this.handleLabelContainer(
        track,
        trackUri,
        filteredPlaylistData,
        renderLayout,
      );
    }
  }

  /**
   * Applies the dedicated playlist-label grid column to the tracklist.
   */
  private applyTracklistGridLayout(
    tracklist: HTMLElement,
    tracklistLayout: TracklistLabelLayout,
  ): void {
    const gridElements = Array.from(
      tracklist.querySelectorAll(".main-trackList-trackListRowGrid"),
    ) as HTMLElement[];

    if (!tracklistLayout.gridTemplateColumns) {
      for (const element of gridElements) {
        element.style.removeProperty("grid-template-columns");
        this.clearExplicitGridColumns(element);
      }
      this.removeHeaderPlaceholders(tracklist);
      return;
    }

    for (const element of gridElements) {
      element.style.gridTemplateColumns = tracklistLayout.gridTemplateColumns;
      this.applyExplicitGridColumns(element);
    }

    this.ensureHeaderPlaceholders(tracklist);
  }

  /**
   * Updates the row height if needed.
   */
  private updateRowHeightIfNeeded(track: HTMLElement): void {
    const trackStyle = getComputedStyle(track);

    // Compatibility for Stats app
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
   * Handles track highlighting.
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
   * Gets filtered playlist data.
   */
  private getPlaylistData(trackUri: string): PlaylistData[] {
    return appState.getState().trackUriToPlaylistData[trackUri] ?? [];
  }

  /**
   * Handles the label container.
   */
  private handleLabelContainer(
    track: HTMLElement,
    trackUri: string,
    filteredPlaylistData: PlaylistData[],
    tracklistLayout: TracklistLabelLayout,
  ): void {
    const state = appState.getState();
    let labelContainer = track.querySelector(
      `.${CSS_CLASSES.LABEL_CONTAINER}`,
    ) as HTMLElement | null;

    // If a full update is needed, remove the existing container
    if (state.playlistUpdated && labelContainer) {
      labelContainer.remove();
      labelContainer = null;
    }

    if (tracklistLayout.maxLabelCount < 1 || tracklistLayout.columnWidth < 1) {
      if (labelContainer) {
        labelContainer.remove();
      }
      return;
    }

    if (!labelContainer) {
      labelContainer = createLabelContainer();
      insertLabelContainer(track, labelContainer);
    }

    if (filteredPlaylistData.length < 1) {
      this.renderEmptyLabelCell(labelContainer, tracklistLayout.maxLabelCount);
      return;
    }

    const layoutSignature = `${tracklistLayout.maxLabelCount}`;
    const shouldRender =
      !labelContainer.hasChildNodes() ||
      labelContainer.dataset.layoutSignature !== layoutSignature;

    // Create or update the label container
    if (shouldRender) {
      this.createAndRenderLabels(
        track,
        trackUri,
        filteredPlaylistData,
        tracklistLayout.maxLabelCount,
        labelContainer,
      );
    }
  }

  private renderEmptyLabelCell(
    labelContainer: HTMLElement,
    maxLabelCount: number,
  ): void {
    const layoutSignature = `empty:${maxLabelCount}`;
    if (labelContainer.dataset.layoutSignature === layoutSignature) {
      return;
    }

    ReactDOM.unmountComponentAtNode(labelContainer);
    labelContainer.replaceChildren();
    labelContainer.dataset.layoutSignature = layoutSignature;
  }

  private ensureHeaderPlaceholders(tracklist: HTMLElement): void {
    const nonTrackRows = Array.from(
      tracklist.querySelectorAll(".main-trackList-trackListRowGrid"),
    ).filter(
      (element) => !element.classList.contains("main-trackList-trackListRow"),
    ) as HTMLElement[];

    for (const row of nonTrackRows) {
      const lastColumn = row.querySelector(
        CONFIG.SELECTORS.LAST_COLUMN,
      ) as HTMLElement | null;
      if (!lastColumn) {
        continue;
      }

      const placeholder = row.querySelector(
        `.${CSS_CLASSES.LABEL_HEADER_PLACEHOLDER}`,
      ) as HTMLElement | null;
      if (!placeholder) {
        row.insertBefore(createLabelHeaderPlaceholder(), lastColumn);
      }
    }
  }

  private removeHeaderPlaceholders(tracklist: HTMLElement): void {
    const placeholders = tracklist.querySelectorAll(
      `.${CSS_CLASSES.LABEL_HEADER_PLACEHOLDER}`,
    );
    for (const placeholder of placeholders) {
      placeholder.remove();
    }
  }

  private resolveTracklistRenderLayout(
    tracklist: HTMLElement,
    trackRows: TrackRowRenderData[],
    tracklistLayout: TracklistLabelLayout,
    maxPlaylistCount: number,
  ): TracklistLabelLayout {
    if (tracklistLayout.maxLabelCount < 1 || tracklistLayout.columnWidth < 1) {
      return tracklistLayout;
    }

    const measuredColumnWidth = this.measureTracklistLabelColumnWidth(
      trackRows,
      tracklist,
      tracklistLayout.columnWidth,
    );
    const resolvedLayout = layoutManager.resolveLabelRenderLayout(
      maxPlaylistCount,
      measuredColumnWidth,
    );

    if (resolvedLayout.maxLabelCount < 1 || resolvedLayout.columnWidth < 1) {
      return {
        ...tracklistLayout,
        maxLabelCount: 0,
        columnWidth: 0,
      };
    }

    return {
      ...tracklistLayout,
      maxLabelCount: resolvedLayout.maxLabelCount,
      columnWidth: measuredColumnWidth,
    };
  }

  private measureTracklistLabelColumnWidth(
    trackRows: TrackRowRenderData[],
    tracklist: HTMLElement,
    fallbackWidth: number,
  ): number {
    if (!trackRows.some((row) => row.filteredPlaylistData.length > 0)) {
      return fallbackWidth;
    }

    const placeholder = tracklist.querySelector(
      `.${CSS_CLASSES.LABEL_HEADER_PLACEHOLDER}`,
    ) as HTMLElement | null;
    const measuredWidth = Math.floor(
      (placeholder ?? null)?.getBoundingClientRect().width ?? 0,
    );

    return measuredWidth > 0 ? measuredWidth : fallbackWidth;
  }

  private applyExplicitGridColumns(row: HTMLElement): void {
    const directChildren = Array.from(row.children) as HTMLElement[];
    for (const [index, child] of directChildren.entries()) {
      child.style.gridColumn = `${index + 1}`;
    }
  }

  private clearExplicitGridColumns(row: HTMLElement): void {
    const directChildren = Array.from(row.children) as HTMLElement[];
    for (const child of directChildren) {
      child.style.removeProperty("grid-column");
    }
  }

  /**
   * Creates and renders the labels.
   */
  private createAndRenderLabels(
    track: HTMLElement,
    trackUri: string,
    filteredPlaylistData: PlaylistData[],
    maxLabelCount: number,
    existingContainer?: HTMLElement | null,
  ): void {
    const state = appState.getState();
    const labelContainer = existingContainer ?? createLabelContainer();

    ReactDOM.render(
      <PlaylistLabelsContainer
        playlistData={filteredPlaylistData}
        trackUri={trackUri}
        maxLabelCount={maxLabelCount}
        showAllPlaylists={state.showAllPlaylists}
        onRemoveTrack={this.handleRemoveTrack}
        onNavigateToPlaylist={this.handleNavigateToPlaylist}
        onToggleShowAllPlaylists={this.handleToggleShowAllPlaylists}
      />,
      labelContainer,
    );

    labelContainer.dataset.layoutSignature = `${maxLabelCount}`;
  }

  /**
   * Handles removing a track.
   */
  private handleRemoveTrack = (
    playlistData: PlaylistData,
    trackUri: string,
  ): void => {
    void removeTrackFromSource(playlistData, trackUri);

    // Optimistically update UI
    const state = appState.getState();
    if (state.trackUriToPlaylistData[trackUri]) {
      const updatedData = state.trackUriToPlaylistData[trackUri].filter(
        (data) =>
          playlistData.isLikedTracks
            ? !data.isLikedTracks
            : data.uri !== playlistData.uri,
      );
      const newTrackData = { ...state.trackUriToPlaylistData };
      newTrackData[trackUri] = updatedData;
      appState.setTrackUriToPlaylistData(newTrackData);
    }

    appState.markPlaylistUpdated();
    this.scheduleTracklistUpdate();
  };

  /**
   * Handles navigating to a playlist.
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

  /**
   * Toggles whether to show all saved playlists.
   */
  private handleToggleShowAllPlaylists = (): void => {
    const newShowAllState = appState.toggleShowAllPlaylists();
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.SHOW_ALL,
      JSON.stringify(newShowAllState),
    );
    appState.markPlaylistUpdated();
    this.scheduleTracklistUpdate();
  };
}

// Create a renderer instance
const tracklistRenderer = new TracklistRenderer();

/**
 * Observer callback function.
 */
async function observerCallback(): Promise<void> {
  const newMainElement = getMainElement();
  appState.updateMainElement(newMainElement);

  if (appState.hasMainElementChanged()) {
    const state = appState.getState();
    if (state.oldMainElement) {
      mainElementObserver.disconnect();
    }

    tracklistRenderer.scheduleTracklistUpdate();

    // Start observing the new main element
    if (state.mainElement) {
      mainElementObserver.observe(state.mainElement, {
        childList: true,
        subtree: true,
      });
    }
  }
}

/**
 * Main entry point for the application.
 */
async function main(): Promise<void> {
  // Wait for Spicetify to load
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Initialize state
  const mainView = getMainViewElement();
  appState.setMainView(mainView);

  // Load user settings
  const showAllPlaylists = JSON.parse(
    localStorage.getItem(CONFIG.STORAGE_KEYS.SHOW_ALL) || "false",
  );
  appState.setShowAllPlaylists(showAllPlaylists);

  // Helper function for data updates
  const updateDataAndTracklist = (
    promise: Promise<Record<string, PlaylistData[]>>,
  ) => {
    promise.then((data) => {
      appState.setTrackUriToPlaylistData(data);
      appState.markPlaylistUpdated();
      tracklistRenderer.scheduleTracklistUpdate();
    });
  };

  // Set up event listeners
  await setupEventListeners(updateDataAndTracklist);

  // Initial data load
  const initialData = await getTrackUriToPlaylistData();
  appState.setTrackUriToPlaylistData(initialData);

  // Set up observers
  setupObservers();
}

/**
 * Sets up event listeners.
 */
async function setupEventListeners(
  updateCallback: (promise: Promise<Record<string, PlaylistData[]>>) => void,
): Promise<void> {
  // Library update listener
  await Spicetify.Platform.LibraryAPI.getEvents().addListener("update", () => {
    const nextUpdate = updatePromise.then(() => updateLikedTracks());
    updatePromise = nextUpdate.then(() => undefined);
    updateCallback(nextUpdate);
  });

  // Playlist operations listener
  await Spicetify.Platform.PlaylistAPI.getEvents().addListener(
    "operation_complete",
    (event: { data: { uri: string } }) => {
      const nextUpdate = updatePromise.then(() =>
        updatePlaylistData(event.data.uri),
      );
      updatePromise = nextUpdate.then(() => undefined);
      updateCallback(nextUpdate);
    },
  );
}

/**
 * Sets up observers.
 */
function setupObservers(): void {
  // Main element observer
  mainElementObserver = new MutationObserver(() => {
    tracklistRenderer.scheduleTracklistUpdate();
  });

  // Page observer
  const pageObserver = new MutationObserver(observerCallback);
  observerCallback();
  pageObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Resize observer
  const resizeObserver = new ResizeObserver(() => {
    tracklistRenderer.scheduleTracklistUpdate();
  });

  const mainView = appState.getState().mainView;
  if (mainView) {
    resizeObserver.observe(mainView);
  }
}

export default main;
