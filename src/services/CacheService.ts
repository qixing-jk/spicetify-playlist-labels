import { CONFIG } from "../constants";
import { CachedPlaylistItem, DatabaseOperations } from "../types";

/**
 * Cache service class for managing IndexedDB operations.
 */
export class CacheService implements DatabaseOperations {
  private db: IDBDatabase | null = null;

  /**
   * Gets or creates a database connection.
   */
  async getDb(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create object stores
        if (!db.objectStoreNames.contains("playlists")) {
          db.createObjectStore("playlists", { keyPath: "uri" });
        }
        if (!db.objectStoreNames.contains("playlistItems")) {
          db.createObjectStore("playlistItems", { keyPath: "uri" });
        }
        if (!db.objectStoreNames.contains("playlistMetadata")) {
          db.createObjectStore("playlistMetadata", { keyPath: "uri" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
    });
  }

  /**
   * Gets cached playlists.
   */
  async getCachedPlaylists(db: IDBDatabase): Promise<any[]> {
    return this.performTransaction(db, "playlists", "readonly", (store) =>
      store.getAll(),
    );
  }

  /**
   * Gets cached playlist items.
   */
  async getCachedPlaylistItems(db: IDBDatabase): Promise<CachedPlaylistItem[]> {
    return this.performTransaction(db, "playlistItems", "readonly", (store) =>
      store.getAll(),
    );
  }

  /**
   * Caches playlists.
   */
  async cachePlaylists(db: IDBDatabase, playlists: any[]): Promise<void> {
    return this.performTransaction(db, "playlists", "readwrite", (store) => {
      playlists.forEach((playlist) => store.put(playlist));
    });
  }

  /**
   * Caches playlist items.
   */
  async cachePlaylistItems(
    db: IDBDatabase,
    uriToPlaylistItems: any,
  ): Promise<void> {
    return this.performTransaction(
      db,
      "playlistItems",
      "readwrite",
      (store) => {
        Object.entries(uriToPlaylistItems).forEach(([uri, items]) => {
          store.put({ uri, items });
        });
      },
    );
  }

  /**
   * Clears cached playlists.
   */
  async clearCachedPlaylists(db: IDBDatabase): Promise<void> {
    return this.performTransaction(db, "playlists", "readwrite", (store) =>
      store.clear(),
    );
  }

  /**
   * Clears cached playlist items.
   */
  async clearCachedPlaylistItems(db: IDBDatabase): Promise<void> {
    return this.performTransaction(db, "playlistItems", "readwrite", (store) =>
      store.clear(),
    );
  }

  async getCachedPlaylistMetadata(db: IDBDatabase, uri: string): Promise<any> {
    return this.performTransaction(
      db,
      "playlistMetadata",
      "readonly",
      (store) => store.get(uri),
    );
  }

  async cachePlaylistMetadata(db: IDBDatabase, metadata: any): Promise<void> {
    return this.performTransaction(
      db,
      "playlistMetadata",
      "readwrite",
      (store) => {
        store.put(metadata);
      },
    );
  }

  /**
   * Generic method for performing database transactions.
   */
  private async performTransaction<T>(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T> | void,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      const request = operation(store);

      if (request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(new Error(`Transaction failed: ${request.error}`));
      } else {
        // For operations without a return request (e.g., batch inserts)
        transaction.oncomplete = () => resolve(undefined as any);
        transaction.onerror = () =>
          reject(new Error(`Transaction failed: ${transaction.error}`));
      }
    });
  }
}

// Export a singleton instance
export const cacheService = new CacheService();
