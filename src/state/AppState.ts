import { AppState, PlaylistData } from "../types";
import { CONFIG } from "../constants";

// Application state management class
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

    // Gets the full state
  getState(): AppState {
    return this.state;
  }

    // Updates the main element
  updateMainElement(element: HTMLElement | null): void {
    this.state.oldMainElement = this.state.mainElement;
    this.state.mainElement = element;
  }

    // Updates the tracklists
  updateTracklists(tracklists: HTMLElement[]): void {
    this.state.oldTracklists = this.state.tracklists;
    this.state.tracklists = tracklists;
  }

    // Sets the playlist data
  setTrackUriToPlaylistData(data: Record<string, PlaylistData[]>): void {
    this.state.trackUriToPlaylistData = data;
  }

    // Marks the playlist as updated
  markPlaylistUpdated(): void {
    this.state.playlistUpdated = true;
  }

    // Resets the updated flag
  resetPlaylistUpdated(): void {
    this.state.playlistUpdated = false;
  }

    // Toggles showing all playlists
  toggleShowAllPlaylists(): boolean {
    this.state.showAllPlaylists = !this.state.showAllPlaylists;
    return this.state.showAllPlaylists;
  }

    // Sets whether to show all playlists
  setShowAllPlaylists(show: boolean): void {
    this.state.showAllPlaylists = show;
  }

    // Sets the highlighted track
  setHighlightTrack(trackUri: string | null, path?: string | null): void {
    this.state.highlightTrack = trackUri;
    this.state.highlightTrackPath = path;
  }

    // Updates the maximum label count
  updateMaxLabelCount(count: number): void {
    this.state.maxLabelCount = count;
  }

    // Updates the maximum number of existing labels
  updateMaxExistingLabelCount(count: number): void {
    if (count > this.state.maxExistingLabelCount) {
      this.state.maxExistingLabelCount = count;
    }
  }

    // Resets the maximum number of existing labels
  resetMaxExistingLabelCount(): void {
    this.state.maxExistingLabelCount = 0;
  }

    // Updates the row height
  updateRowHeight(height: string): void {
    this.state.rowHeight = height;
  }

    // Sets the main view
  setMainView(view: Element | null): void {
    this.state.mainView = view;
  }

    // Checks if the tracklists have changed
  hasTracklistsChanged(): boolean {
    return (
      this.state.oldTracklists.length !== this.state.tracklists.length ||
      !this.state.oldTracklists.every(
        (value, index) => value === this.state.tracklists[index],
      )
    );
  }

    // Checks if the main element has changed
  hasMainElementChanged(): boolean {
    return (
      !!this.state.mainElement &&
      !this.state.mainElement.isEqualNode(this.state.oldMainElement)
    );
  }
}

// Export a singleton instance
export const appState = new AppStateManager();
