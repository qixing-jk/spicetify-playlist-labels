// Import necessary React libraries and local modules.
import React from 'react';
import ReactDOM from 'react-dom';
import './app.css'
import {removeTrackFromPlaylist} from "./api";
import {getTrackUriToPlaylistData, updateLikedTracks, updatePlaylistData} from "./playlist";
import {getFiberFromDom, getParentProps} from "./utilties";

// Global state variables to manage the DOM and application state.
let oldMainElement = null; // Stores the previous main element to detect changes.
let mainElement: HTMLElement | null = null; // The main container element of the Spotify client.
let mainElementObserver: MutationObserver; // Observes changes in the main element.
let tracklists: HTMLElement[] = []; // Holds the current tracklist elements on the page.
let oldTracklists: HTMLElement[] = []; // Holds the previous tracklist elements to detect changes.
let trackUriToPlaylistData: Record<string, PlaylistData[]> = {}; // Maps track URIs to their associated playlist data.
let playlistUpdated = false; // Flag to indicate if the playlist data has been updated.
let showAllPlaylists = false; // Flag to toggle showing all playlists or only user-owned ones.
let highlightTrack: string | null = null; // The URI of the track to be highlighted on navigation.
let highlightTrackPath: string | null | undefined = null; // The path to navigate to for highlighting a track.
let maxExistingLabelCount = 0; // The maximum number of labels any track currently has.
let maxLabelCount = 1; // The maximum number of labels to display per track, based on screen width.
let rowHeight = '56px'; // The height of a track row, used for layout calculations.
let mainView: Element | null; // The main view container for observing resize events.
let updatePromise = Promise.resolve(); // A promise chain to serialize data updates.

interface PlaylistData {
    isOwnPlaylist: boolean;
    isLikedTracks: boolean;
    uri: string;
    name: string;
    trackUid: string;
    image: string;
}

/**
 * Extracts the playlist ID from a Spotify playlist URI.
 * @param {string} uri - The Spotify playlist URI (e.g., "spotify:playlist:...")
 * @returns {string} The playlist ID.
 */
function playlistUriToPlaylistId(uri: string | null) {
    return uri && uri.match(/spotify:playlist:(.*)/)?.[1];
}

/**
 * Extracts the track URI from a tracklist row element by traversing its React component props.
 * This is a fragile method and might break with Spotify UI updates.
 * @param {any} tracklistElement - The tracklist row's React component instance.
 * @returns {string | null} The track URI or null if not found.
 */
function getTracklistTrackUri(tracklistElement: Element): string | null {
    const tracklistParentElement = tracklistElement.parentElement;
    if (!tracklistParentElement) return null;
    const tracklistParentFiber = getFiberFromDom(tracklistParentElement);
    if (!tracklistParentFiber) return null;
    const tracklistParentProps = getParentProps(tracklistParentFiber, fiber => {
        const props = fiber.memoizedProps || fiber.pendingProps;
        return props && props.uri
    });
    if (!tracklistParentProps) {
        return null;
    }
    return tracklistParentProps.uri
}

/**
 * Calculates the maximum number of playlist labels that can be displayed per track
 * based on the available width of the main view. This makes the layout responsive.
 */
function calculateMaxLabelCount() {
    if (!mainView) return;

    let newMaxLabelCount = maxLabelCount;
    let space = rowHeight == '56px' ? 44 : 32; // Space needed per label.
    let maxPossibleLabelCount = 20; // A hard cap on the number of labels.
    const minViewSize = 516; // The minimum width for displaying more than one label.
    const contentRect = mainView.getBoundingClientRect();

    // Determine the number of labels that can fit based on breakpoints.
    let min = 0;
    let max = minViewSize;
    if (min <= contentRect.width && contentRect.width <= max) {
        newMaxLabelCount = 1;
    }

    for (let i = 1; i < maxPossibleLabelCount - 1; i++) {
        min = minViewSize + 1 + space * (i - 1);
        max = minViewSize + 1 + space * i;
        if (min <= contentRect.width && contentRect.width <= max) {
            newMaxLabelCount = i + 1;
        }
    }

    min = minViewSize + 1 + space * (maxPossibleLabelCount - 2);
    if (min <= contentRect.width) {
        newMaxLabelCount = maxPossibleLabelCount;
    }

    // If the count has changed, update the CSS variable and force a tracklist update.
    if (newMaxLabelCount !== maxLabelCount) {
        maxLabelCount = newMaxLabelCount;
        document.documentElement.style.setProperty('--spicetify-playlist-labels-max-label-count', `${maxLabelCount}`);
        playlistUpdated = true;
        updateTracklist();
    }
}

/**
 * Core function to update the tracklist with playlist labels.
 * It finds all track rows, determines which labels to show, and renders them using React.
 */
function updateTracklist() {
    // Detect if the tracklist itself has changed (e.g., new page, sorting).
    oldTracklists = tracklists;
    tracklists = Array.from(document.querySelectorAll(".main-trackList-indexable"));

    if (oldTracklists.length !== tracklists.length || !oldTracklists.every((value, index) => value === tracklists[index])) {
        // Reset the max count if the tracklist is new.
        maxExistingLabelCount = 0;
    }

    // Iterate over each tracklist on the page.
    for (const tracklist of tracklists) {
        const tracks = tracklist.getElementsByClassName("main-trackList-trackListRow");
        // Iterate over each track row in the tracklist.
        for (const track of tracks) {
            const trackStyle = getComputedStyle(track);
            // This is a workaround for compatibility with the "Stats" custom app.
            document.querySelector("#stats-app .main-rootlist-wrapper")?.style.setProperty('--row-height', trackStyle.height);
            const trackRowHeight = trackStyle.getPropertyValue('--row-height');
            // If row height changes, recalculate label sizes and max count.
            if (trackRowHeight != rowHeight) {
                rowHeight = trackRowHeight;
                document.documentElement.style.setProperty('--spicetify-playlist-labels-size', `calc(${rowHeight} * 0.5)`);
                calculateMaxLabelCount();
                playlistUpdated = true;
            }

            const trackUri = getTracklistTrackUri(track);
            if (!trackUri) continue;
            // If this track is meant to be highlighted after navigation, simulate a click.
            if (highlightTrack === trackUri && Spicetify.Platform.History.location.pathname === highlightTrackPath) {
                (track as HTMLElement).click();
                highlightTrack = null;
            }

            // Filter the playlists for the current track based on settings and context.
            let filteredPlaylistData = (trackUriToPlaylistData[trackUri] ?? []).filter((playlistData) => {
                // Filter out playlists if "Show All" is off and the user doesn't own it.
                if (!showAllPlaylists && !playlistData.isOwnPlaylist) return false;

                // Don't show a label for the playlist that is currently being viewed.
                if (!playlistData.isLikedTracks) {
                    const playlistId = playlistUriToPlaylistId(playlistData.uri);
                    if (Spicetify.Platform.History.location.pathname === `/playlist/${playlistId}`) return false;
                } else if (Spicetify.Platform.History.location.pathname === '/collection/tracks') {
                    return false; // Don't show "Liked Songs" label when in the "Liked Songs" view.
                }

                return true;
            });

            // Update the CSS variable for the total number of labels to manage layout.
            if (filteredPlaylistData.length > maxExistingLabelCount) {
                maxExistingLabelCount = filteredPlaylistData.length;
                document.documentElement.style.setProperty('--spicetify-playlist-labels-label-count', `${maxExistingLabelCount}`);
            }

            let labelContainer = track.querySelector(".spicetify-playlist-labels");

            // If a full update is needed, remove the existing container to be re-rendered.
            if (playlistUpdated) {
                if (labelContainer) {
                    labelContainer.remove();
                    labelContainer = null;
                }
            }

            // If no label container exists, create and render one.
            if (!labelContainer) {
                // Create a new div to hold the labels and inject it into the track row.
                let lastColumn = track.querySelector(".main-trackList-rowSectionEnd");
                if (lastColumn) {

                    labelContainer = document.createElement("div");
                    labelContainer.classList.add("spicetify-playlist-labels");

                    let containerClassName = 'spicetify-playlist-labels-labels-container';

                    // Add an overflow class if the number of labels exceeds the displayable limit.
                    if (filteredPlaylistData.length > maxLabelCount) {
                        containerClassName += ' spicetify-playlist-labels-overflow';
                    }

                    // Slice the data to only render the number of labels that can fit.
                    filteredPlaylistData = filteredPlaylistData.slice(0, maxLabelCount)

                    // Use ReactDOM to render the React components into the newly created container.
                    ReactDOM.render(
                        <div className={containerClassName}>
                            {
                                filteredPlaylistData.map((playlistData) => {
                                    // Redundant filter check, but ensures correctness.
                                    if (!showAllPlaylists && !playlistData.isOwnPlaylist) return null;

                                    if (!playlistData.isLikedTracks) {
                                        const playlistId = playlistUriToPlaylistId(playlistData.uri);
                                        if (Spicetify.Platform.History.location.pathname === `/playlist/${playlistId}`) return null;
                                    } else if (Spicetify.Platform.History.location.pathname === '/collection/tracks') {
                                        return null;
                                    }

                                    // Each label is wrapped in a Tooltip and a RightClickMenu.
                                    return (
                                        <Spicetify.ReactComponent.TooltipWrapper
                                            label={playlistData.name}
                                            placement="top"
                                        >
                                            <div>
                                                <Spicetify.ReactComponent.RightClickMenu placement="bottom-end"
                                                                                         menu={playlistData.isLikedTracks ? null :
                                                                                             // The context menu for removing a track from a playlist.
                                                                                             <Spicetify.ReactComponent.Menu>
                                                                                                 <Spicetify.ReactComponent.MenuItem
                                                                                                     leadingIcon={
                                                                                                         <Spicetify.ReactComponent.IconComponent
                                                                                                             dangerouslySetInnerHTML={{__html: Spicetify.SVGIcons.trash}}
                                                                                                             iconSize={16}
                                                                                                             style={{color: "var(--text-subdued)"}}
                                                                                                         />
                                                                                                     } onClick={
                                                                                                     (e: React.MouseEvent) => {
                                                                                                         e.stopPropagation();
                                                                                                         // API call to remove the track.
                                                                                                         removeTrackFromPlaylist(playlistData.uri, trackUri);
                                                                                                         // Optimistically update the UI.
                                                                                                         if (trackUriToPlaylistData[trackUri]) {
                                                                                                             trackUriToPlaylistData[trackUri] = trackUriToPlaylistData[trackUri].filter((otherPlaylistData) => otherPlaylistData.uri !== playlistData.uri);
                                                                                                         }
                                                                                                         playlistUpdated = true;
                                                                                                         updateTracklist();
                                                                                                     }
                                                                                                 }>Remove
                                                                                                     from {playlistData.name}</Spicetify.ReactComponent.MenuItem>
                                                                                             </Spicetify.ReactComponent.Menu>
                                                                                         }>
                                                    {/*playlist-label-icon*/}
                                                    <div className="spicetify-playlist-labels-label-container" style={{
                                                        cursor: 'pointer',
                                                    }} onClick={(e: React.MouseEvent) => {
                                                        // Handle click to navigate to the playlist.
                                                        e.stopPropagation();
                                                        const path = playlistData.isLikedTracks ? '/collection/tracks' : Spicetify.URI.fromString(playlistData.uri)?.toURLPath(true);
                                                        // Set track to be highlighted on the target page.
                                                        highlightTrack = trackUri;
                                                        highlightTrackPath = path;
                                                        if (path) Spicetify.Platform.History.push({
                                                            pathname: path,
                                                            search: `?uid=${playlistData.trackUid}`
                                                        });
                                                    }}>
                                                        <img src={playlistData.image} alt={playlistData.name}/>
                                                    </div>
                                                </Spicetify.ReactComponent.RightClickMenu>
                                            </div>
                                        </Spicetify.ReactComponent.TooltipWrapper>
                                    );
                                })
                            }
                        </div>
                        , labelContainer);

                    // Insert the new label container into the DOM.
                    lastColumn.insertBefore(labelContainer, lastColumn.firstChild);
                }
            }
        }

        // Reset the update flag after processing.
        playlistUpdated = false;
    }
}

/**
 * A callback for the body observer, which re-initializes the main element observer
 * when the main element is replaced (e.g., on page navigation).
 */
async function observerCallback() {
    oldMainElement = mainElement;
    mainElement = document.querySelector("main");
    if (mainElement && !mainElement.isEqualNode(oldMainElement)) {
        if (oldMainElement) {
            mainElementObserver.disconnect();
        }
        updateTracklist();
        // Start observing the new main element for changes to its children.
        mainElementObserver.observe(mainElement, {
            childList: true,
            subtree: true,
        });
    }
}

/**
 * The main entry point of the application.
 * It initializes the extension, sets up observers, and registers event listeners.
 */
async function main() {
    // Wait until Spicetify and its APIs are fully loaded.
    while (!Spicetify?.showNotification) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    mainView = document.querySelector('.Root__main-view');

    // Load user settings from local storage.
    showAllPlaylists = JSON.parse(localStorage.getItem('spicetify-playlist-labels:show-all') || 'false');

    // Helper function to update the data map and trigger a UI refresh.
    const getDataAndUpdateTracklist = (promise: Promise<any>) => {
        promise.then((data) => {
            trackUriToPlaylistData = data;
            playlistUpdated = true;
            updateTracklist();
        });
    }

    // Listen for changes in the user's library (e.g., liking/unliking a track).
    await Spicetify.Platform.LibraryAPI.getEvents().addListener('update', () => {
        updatePromise = updatePromise.then(() => {
            updateLikedTracks()
        });
        getDataAndUpdateTracklist(updatePromise);
    });

    // Listen for playlist operations (e.g., adding/removing tracks).
    await Spicetify.Platform.PlaylistAPI.getEvents().addListener('operation_complete', (event: {
        data: { uri: string; };
    }) => {
        updatePromise = updatePromise.then(() => {
            updatePlaylistData(event.data.uri)
        });
        getDataAndUpdateTracklist(updatePromise);
    });

    // Handler for the playbar button click.
    const handleButtonClick = (buttonElement: Spicetify.Playbar.Button) => {
        buttonElement.active = showAllPlaylists = !buttonElement.active;
        localStorage.setItem('spicetify-playlist-labels:show-all', JSON.stringify(showAllPlaylists));
        playlistUpdated = true;
        updateTracklist();
    };

    // Create the playbar toggle button to switch between showing all/owned playlists.
    const iconHTML = `<svg data-encore-id="icon" role="img" viewBox="0 0 16 16" class="Svg-img-icon-small">${Spicetify.SVGIcons["spotify"]}</svg>`;
    new Spicetify.Playbar.Button("Show All Saved Playlists", iconHTML, handleButtonClick, false, showAllPlaylists);

    // Initial fetch of all playlist data.
    trackUriToPlaylistData = await getTrackUriToPlaylistData();

    // This observer triggers updates whenever the tracklist content changes.
    mainElementObserver = new MutationObserver(() => {
        updateTracklist();
    });

    // This observer detects when the main 'view' is swapped out by Spotify's router.
    const observer = new MutationObserver(async () => {
        await observerCallback();
    });
    await observerCallback();
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // This observer triggers recalculation of label counts when the window is resized.
    const resizeObserver = new ResizeObserver(entries => {
        calculateMaxLabelCount();
    });

    if (mainView) {
        resizeObserver.observe(mainView);
    }
}

export default main;