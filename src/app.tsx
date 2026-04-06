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
  insertLabelContainer,
  playlistUriToPlaylistId,
} from "./utils/dom";
import { filterPlaylistData } from "./utils/filters";

// Global observers and update promise
let mainElementObserver: MutationObserver;
let updatePromise: Promise<void> = Promise.resolve();

/**
 * Manages rendering of the tracklist.
 */
class TracklistRenderer {
  /**
   * Updates the tracklist display.
   */
  updateTracklist(): void {
    const state = appState.getState();

    // Detect tracklist changes
    const newTracklists = getTracklistElements();
    appState.updateTracklists(newTracklists);

    if (appState.hasTracklistsChanged()) {
      layoutManager.resetLayout();
    }

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
    const tracks = getTrackRowElements(tracklist);

    for (const track of tracks) {
      this.processTrackRow(track as HTMLElement);
    }
  }

  /**
   * Processes a single track row.
   */
  private processTrackRow(track: HTMLElement): void {
    const state = appState.getState();

    // Update row height
    this.updateRowHeightIfNeeded(track);

    const trackUri = getTracklistTrackUri(track);
    if (!trackUri) return;

    // Handle highlighted track
    this.handleTrackHighlight(track, trackUri);

    // Get filtered playlist data
    const filteredPlaylistData = this.getFilteredPlaylistData(trackUri);

    // Update CSS variables
    layoutManager.updateMaxExistingLabelCount(filteredPlaylistData.length);

    // Handle label container
    this.handleLabelContainer(track, trackUri, filteredPlaylistData);
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
  private getFilteredPlaylistData(trackUri: string): PlaylistData[] {
    const state = appState.getState();
    const playlistData = state.trackUriToPlaylistData[trackUri] ?? [];
    return filterPlaylistData(playlistData, state.showAllPlaylists);
  }

  /**
   * Handles the label container.
   */
  private handleLabelContainer(
    track: HTMLElement,
    trackUri: string,
    filteredPlaylistData: PlaylistData[],
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

    // Create or update the label container
    if (!labelContainer && filteredPlaylistData.length > 0) {
      this.createAndRenderLabels(track, trackUri, filteredPlaylistData);
    }
  }

  /**
   * Creates and renders the labels.
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
    this.updateTracklist();
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

    tracklistRenderer.updateTracklist();

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
  const updateDataAndTracklist = (promise: Promise<any>) => {
    promise.then((data) => {
      appState.setTrackUriToPlaylistData(data);
      appState.markPlaylistUpdated();
      tracklistRenderer.updateTracklist();
    });
  };

  // Set up event listeners
  await setupEventListeners(updateDataAndTracklist);

  // Create playbar button
  createPlaybarButton();

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
  updateCallback: (promise: Promise<any>) => void,
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
 * Creates the playbar button.
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
 * Sets up observers.
 */
function setupObservers(): void {
  // Main element observer
  mainElementObserver = new MutationObserver(() => {
    tracklistRenderer.updateTracklist();
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
    layoutManager.calculateMaxLabelCount();
  });

  const mainView = appState.getState().mainView;
  if (mainView) {
    resizeObserver.observe(mainView);
  }
}

export default main;
