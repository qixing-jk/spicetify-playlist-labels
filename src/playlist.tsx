// This module handles data fetching, caching, and mapping for the playlist labels.
import { getContents, getLikedTracks, getLikedTracksCount, getPlaylistItems } from "./api";

/**
 * Traverses the rootlist contents to separate regular playlists from rated playlists (those in a "Rated" folder).
 * @param {any} contents - The rootlist contents from Spicetify.Platform.RootlistAPI.
 * @returns {[any[], any[]]} An array containing two arrays: one for regular playlists and one for rated playlists.
 */
function getPlaylistsFromContents(contents) {
    let playlists = [];
    let ratedPlaylists = [];

    function traverse(item, isRated) {
        if (item.type === 'playlist') {
            if (isRated)
                ratedPlaylists.push(item);
            else
                playlists.push(item);
        } else if (item.type === 'folder' && item.items) {
            // Recursively traverse folders, marking playlists inside a "Rated" folder.
            item.items.forEach(i => traverse(i, item.name == 'Rated'));
        }
    }

    traverse(contents, false);

    return [playlists, ratedPlaylists];
}

/**
 * Fetches all user playlists and marks them if they are rated.
 * @returns {Promise<any[]>} A promise that resolves with an array of all playlists, with an `isRatedPlaylist` flag.
 */
async function getPlaylistsExtra() {
    const contents = await getContents();

    const [playlists, ratedPlaylists] = getPlaylistsFromContents(contents);

    let allPlaylists = [...playlists, ...ratedPlaylists];
    allPlaylists = allPlaylists.map((playlist) => ({
        ...playlist,
        isRatedPlaylist: ratedPlaylists.some((ratedPlaylist) => ratedPlaylist.uri === playlist.uri)
    }));

    return allPlaylists;
}

/**
 * Opens and initializes the IndexedDB database for caching.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
async function getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("spicetify-playlist-labels", 1);

        request.onerror = (event) => {
            reject(event);
        };
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            // Create object stores for playlists and their items.
            db.createObjectStore("playlists", { keyPath: "uri" });
            db.createObjectStore("playlistItems", { keyPath: "uri" });
        };
        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };
    });
}

/**
 * Retrieves cached playlists from IndexedDB.
 * @param {IDBDatabase} db - The database instance.
 * @returns {Promise<any[]>} A promise that resolves with an array of cached playlists.
 */
async function getCachedPlaylists(db: IDBDatabase): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const playlistObjectStoreRequest = db.transaction("playlists")
            .objectStore("playlists")
            .getAll();
        playlistObjectStoreRequest.onsuccess = (event) => {
            resolve(playlistObjectStoreRequest.result);
        };
        playlistObjectStoreRequest.onerror = (event) => {
            reject(event);
        };
    });
}

/**
 * Retrieves cached playlist items from IndexedDB.
 * @param {IDBDatabase} db - The database instance.
 * @returns {Promise<any[]>} A promise that resolves with an array of cached playlist items.
 */
async function getCachedPlaylistItems(db: IDBDatabase): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const playlistItemsObjectStoreRequest = db.transaction("playlistItems")
            .objectStore("playlistItems")
            .getAll();
        playlistItemsObjectStoreRequest.onsuccess = (event) => {
            resolve(playlistItemsObjectStoreRequest.result);
        };
        playlistItemsObjectStoreRequest.onerror = (event) => {
            reject(event);
        };
    });
}

/**
 * Clears all cached playlists from IndexedDB.
 * @param {IDBDatabase} db - The database instance.
 * @returns {Promise<void>}
 */
async function clearCachedPlaylists(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
        const playlistObjectStoreRequest = db.transaction("playlists", "readwrite")
            .objectStore("playlists")
            .clear();
        playlistObjectStoreRequest.onsuccess = (event) => {
            resolve();
        };
        playlistObjectStoreRequest.onerror = (event) => {
            reject(event);
        };
    });
}

/**
 * Clears all cached playlist items from IndexedDB.
 * @param {IDBDatabase} db - The database instance.
 * @returns {Promise<void>}
 */
async function clearCachedPlaylistItems(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
        const playlistItemsObjectStoreRequest = db.transaction("playlistItems", "readwrite")
            .objectStore("playlistItems")
            .clear();
        playlistItemsObjectStoreRequest.onsuccess = (event) => {
            resolve();
        };
        playlistItemsObjectStoreRequest.onerror = (event) => {
            reject(event);
        };
    });
}

/**
 * Caches an array of playlists in IndexedDB.
 * @param {IDBDatabase} db - The database instance.
 * @param {any[]} playlists - The array of playlists to cache.
 * @returns {Promise<void>}
 */
async function cachePlaylists(db: IDBDatabase, playlists: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const playlistObjectStore = db.transaction("playlists", "readwrite")
            .objectStore("playlists");

        playlists.forEach((playlist) => {
            playlistObjectStore.put(playlist);
        });

        playlistObjectStore.transaction.oncomplete = (event) => {
            resolve();
        };
        playlistObjectStore.transaction.onerror = (event) => {
            reject(event);
        };
    });
}

/**
 * Caches a map of playlist URIs to their items in IndexedDB.
 * @param {IDBDatabase} db - The database instance.
 * @param {any} uriToPlaylistItems - An object mapping playlist URIs to their items.
 * @returns {Promise<void>}
 */
async function cachePlaylistItems(db: IDBDatabase, uriToPlaylistItems): Promise<void> {
    return new Promise((resolve, reject) => {
        const playlistItemsObjectStore = db.transaction("playlistItems", "readwrite")
            .objectStore("playlistItems");

        Object.entries(uriToPlaylistItems).forEach(([uri, items]) => {
            playlistItemsObjectStore.put({ uri, items });
        });

        playlistItemsObjectStore.transaction.oncomplete = (event) => {
            resolve();
        };
        playlistItemsObjectStore.transaction.onerror = (event) => {
            reject(event);
        };
    });
}

/**
 * Populates the track-to-playlist data map for a given set of playlists.
 * @param {any} trackUriToPlaylistData - The main data map to populate.
 * @param {any[]} playlists - The array of playlists to process.
 * @param {any} uriToPlaylistItems - A map of playlist URIs to their items.
 */
function addPlaylists(trackUriToPlaylistData, playlists: any[], uriToPlaylistItems: any) {
    playlists.forEach((playlist) => {
        const playlistItems = uriToPlaylistItems[playlist.uri] ?? [];
        playlistItems.forEach((playlistItem) => {
            const trackUri = playlistItem.uri;
            if (!trackUriToPlaylistData[trackUri])
                trackUriToPlaylistData[trackUri] = [];
            // Avoid adding duplicate playlist labels for the same track.
            if (!trackUriToPlaylistData[trackUri].some(obj => obj.uri === playlist.uri)) {
                trackUriToPlaylistData[trackUri].push({
                    uri: playlist.uri,
                    name: playlist.name,
                    trackUid: playlistItem.uid,
                    image: playlist.images[0]?.url || '',
                    isOwnPlaylist: playlist.isOwnedBySelf,
                    isLikedTracks: false
                });
            }
        });
    });
}

/**
 * Populates the track-to-playlist data map for liked tracks.
 * @param {any} trackUriToPlaylistData - The main data map to populate.
 * @param {any[]} likedTracks - An array of liked track items.
 */
function addLikedTracks(trackUriToPlaylistData, likedTracks) {
    likedTracks.forEach((item) => {
        const trackUri = item.uri;
        if (!trackUriToPlaylistData[trackUri])
            trackUriToPlaylistData[trackUri] = [];
        // Add a special entry for "Liked Songs".
        if (!trackUriToPlaylistData[trackUri].some(obj => obj.isLikedTracks)) {
            trackUriToPlaylistData[trackUri].push({
                uri: null,
                name: 'Liked Songs',
                trackUid: item.uid,
                image: 'https://misc.scdn.co/liked-songs/liked-songs-300.png',
                isOwnPlaylist: true,
                isLikedTracks: true
            });
        }
    });
}

/**
 * Updates the data map when a specific playlist's data changes.
 * @param {string} uri - The URI of the playlist that was updated.
 * @returns {Promise<any>} A promise that resolves with the updated track-to-playlist data map.
 */
export async function updatePlaylistData(uri) {
    const db = await getDb();
    let playlists = await getPlaylistsExtra();
    const cachedPlaylistItems = await getCachedPlaylistItems(db);

    const cachedUriToPlaylistItems = [];
    cachedPlaylistItems.forEach((playlistItems) => {
        cachedUriToPlaylistItems[playlistItems.uri] = playlistItems.items;
    });

    // Fetch fresh items for the updated playlist.
    const updatedPlaylistItems = await getPlaylistItems(uri);
    cachedUriToPlaylistItems[uri] = updatedPlaylistItems;

    const trackUriToPlaylistData = {};
    // Sort playlists by date added to maintain a consistent order.
    playlists = playlists.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    const ratedPlaylists = playlists.filter((playlist) => playlist.isRatedPlaylist);
    const nonRatedPlaylists = playlists.filter((playlist) => !playlist.isRatedPlaylist);
    const likedTracks = cachedUriToPlaylistItems['likedTracks'];

    // Re-cache the newly fetched playlist items.
    const uriToPlaylistItems = {};
    uriToPlaylistItems[uri] = updatedPlaylistItems;
    await cachePlaylists(db, playlists);
    await cachePlaylistItems(db, uriToPlaylistItems);

    // Rebuild the main data map with updated data, maintaining priority order.
    addPlaylists(trackUriToPlaylistData, ratedPlaylists, cachedUriToPlaylistItems);
    addLikedTracks(trackUriToPlaylistData, likedTracks);
    addPlaylists(trackUriToPlaylistData, nonRatedPlaylists, cachedUriToPlaylistItems);

    return trackUriToPlaylistData;
}

/**
 * Updates the data map when the user's liked tracks change.
 * @returns {Promise<any>} A promise that resolves with the updated track-to-playlist data map.
 */
export async function updateLikedTracks() {
    const db = await getDb();
    const cachedPlaylists = await getCachedPlaylists(db);
    const cachedPlaylistItems = await getCachedPlaylistItems(db);

    const cachedUriToPlaylistItems = [];
    cachedPlaylistItems.forEach((playlistItems) => {
        cachedUriToPlaylistItems[playlistItems.uri] = playlistItems.items;
    });

    const trackUriToPlaylistData = {};
    const playlists = cachedPlaylists.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    const ratedPlaylists = playlists.filter((playlist) => playlist.isRatedPlaylist);
    const nonRatedPlaylists = playlists.filter((playlist) => !playlist.isRatedPlaylist);

    // Fetch the full, updated list of liked tracks.
    let likedTracks = await getLikedTracks();
    likedTracks = likedTracks.items;

    // Rebuild the main data map with the new liked tracks list.
    addPlaylists(trackUriToPlaylistData, ratedPlaylists, cachedUriToPlaylistItems);
    addLikedTracks(trackUriToPlaylistData, likedTracks);
    addPlaylists(trackUriToPlaylistData, nonRatedPlaylists, cachedUriToPlaylistItems);

    // Update the cache for liked tracks.
    const uriToPlaylistItems = {};
    uriToPlaylistItems['likedTracks'] = likedTracks;
    await cachePlaylistItems(db, uriToPlaylistItems);

    localStorage.setItem('spicetify-playlist-labels:liked-tracks-count', `${likedTracks.length}`);

    return trackUriToPlaylistData;
}

/**
 * The main function to get the complete track-to-playlist data map.
 * It intelligently checks for updates in playlists and liked tracks to avoid unnecessary API calls.
 * @returns {Promise<any>} A promise that resolves with the final track-to-playlist data map.
 */
export async function getTrackUriToPlaylistData() {
    const db = await getDb();
    const cachedPlaylists = await getCachedPlaylists(db);
    const cachedPlaylistItems = await getCachedPlaylistItems(db);

    let playlists = await getPlaylistsExtra();
    const updatedPlaylists = [];
    // Check for playlists that have been updated (track count changed).
    playlists.forEach((playlist) => {
        const cachedPlaylist = cachedPlaylists.find((cachedPlaylist) => cachedPlaylist.uri === playlist.uri);
        if (!cachedPlaylist || cachedPlaylist.totalLength !== playlist.totalLength) {
            updatedPlaylists.push(playlist);
        }
    });

    const cachedUriToPlaylistItems = [];
    cachedPlaylistItems.forEach((playlistItems) => {
        cachedUriToPlaylistItems[playlistItems.uri] = playlistItems.items;
    });

    // Fetch items only for the playlists that have been updated.
    const updatedPlaylistItems = await Promise.all(updatedPlaylists.map((playlist) => getPlaylistItems(playlist.uri)));
    const uriToUpdatedPlaylistItems = {}
    updatedPlaylistItems.forEach((playlistItems, index) => {
        const uri = updatedPlaylists[index].uri;
        uriToUpdatedPlaylistItems[uri] = playlistItems;
    });

    // Merge updated items with cached items.
    const uriToPlaylistItems = {};
    playlists.forEach((playlist) => {
        const uri = playlist.uri;
        if (uriToUpdatedPlaylistItems[uri])
            uriToPlaylistItems[uri] = uriToUpdatedPlaylistItems[uri];
        else
            uriToPlaylistItems[uri] = cachedUriToPlaylistItems[uri]
    });
    uriToPlaylistItems['likedTracks'] = cachedUriToPlaylistItems['likedTracks'];

    // Check if the number of liked tracks has changed.
    const cachedLikedTracksCount = JSON.parse(localStorage.getItem('spicetify-playlist-labels:liked-tracks-count') || '0');
    const likedTracksCount = await getLikedTracksCount();
    let likedTracks = uriToPlaylistItems['likedTracks'];
    if (!likedTracks || cachedLikedTracksCount != likedTracksCount) {
        likedTracks = await getLikedTracks();
        likedTracks = likedTracks.items;
        uriToPlaylistItems['likedTracks'] = likedTracks;
    }

    // Build the final track-to-playlist data map.
    const trackUriToPlaylistData = {};
    playlists = playlists.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    const ratedPlaylists = playlists.filter((playlist) => playlist.isRatedPlaylist);
    const nonRatedPlaylists = playlists.filter((playlist) => !playlist.isRatedPlaylist);

    addPlaylists(trackUriToPlaylistData, ratedPlaylists, uriToPlaylistItems);
    addLikedTracks(trackUriToPlaylistData, likedTracks);
    addPlaylists(trackUriToPlaylistData, nonRatedPlaylists, uriToPlaylistItems);

    // Clear and re-populate the cache with the latest data.
    await clearCachedPlaylists(db);
    await clearCachedPlaylistItems(db);
    await cachePlaylists(db, playlists);
    await cachePlaylistItems(db, uriToPlaylistItems);
    localStorage.setItem('spicetify-playlist-labels:liked-tracks-count', `${likedTracksCount}`);

    return trackUriToPlaylistData;
}