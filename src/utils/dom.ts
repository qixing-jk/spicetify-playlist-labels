import { CONFIG, CSS_CLASSES } from "../constants";
import { getFiberFromDom, getParentProps } from "../utilties";
import { PlaylistData } from "../types";

/**
 * Extracts the playlist ID from a Spotify playlist URI.
 */
export function playlistUriToPlaylistId(
  uri: string | null,
): string | undefined {
  return uri?.match(/spotify:playlist:(.*)/)?.[1];
}

/**
 * Gets the URI for a track row.
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
 * Updates a CSS variable.
 */
export function updateCSSVariable(variable: string, value: string): void {
  document.documentElement.style.setProperty(variable, value);
}

/**
 * Gets all tracklist elements.
 */
export function getTracklistElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(CONFIG.SELECTORS.TRACKLIST),
  ) as HTMLElement[];
}

/**
 * Gets track row elements.
 */
export function getTrackRowElements(
  tracklist: Element,
): HTMLCollectionOf<Element> {
  return tracklist.getElementsByClassName("main-trackList-trackListRow");
}

/**
 * Gets the main element.
 */
export function getMainElement(): HTMLElement | null {
  return document.querySelector(CONFIG.SELECTORS.MAIN);
}

/**
 * Gets the main view element.
 */
export function getMainViewElement(): Element | null {
  return document.querySelector(CONFIG.SELECTORS.MAIN_VIEW);
}

/**
 * Creates a label container element.
 */
export function createLabelContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.classList.add("spicetify-playlist-labels");
  container.classList.add(CSS_CLASSES.LABEL_GRID_CELL);
  container.setAttribute("role", "gridcell");
  return container;
}

/**
 * Inserts a label container into a track row.
 */
export function insertLabelContainer(
  track: Element,
  labelContainer: HTMLElement,
): void {
  const lastColumn = track.querySelector(CONFIG.SELECTORS.LAST_COLUMN);
  if (lastColumn) {
    track.insertBefore(labelContainer, lastColumn);
  }
}

/**
 * Creates a placeholder cell for the tracklist header row.
 */
export function createLabelHeaderPlaceholder(): HTMLDivElement {
  const placeholder = document.createElement("div");
  placeholder.classList.add(CSS_CLASSES.LABEL_HEADER_PLACEHOLDER);
  placeholder.classList.add(CSS_CLASSES.LABEL_GRID_CELL);
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.setAttribute("role", "gridcell");
  return placeholder;
}

/**
 * Checks if the current page is the playlist page.
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
