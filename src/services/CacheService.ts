import { CONFIG } from '../constants';
import { CachedPlaylistItem, DatabaseOperations } from '../types';

/**
 * 缓存服务类，管理IndexedDB操作
 */
export class CacheService implements DatabaseOperations {
  private db: IDBDatabase | null = null;

  /**
   * 获取或创建数据库连接
   */
  async getDb(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // 创建对象存储
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
   * 获取缓存的播放列表
   */
  async getCachedPlaylists(db: IDBDatabase): Promise<any[]> {
    return this.performTransaction(db, "playlists", "readonly", (store) => store.getAll());
  }

  /**
   * 获取缓存的播放列表项
   */
  async getCachedPlaylistItems(db: IDBDatabase): Promise<CachedPlaylistItem[]> {
    return this.performTransaction(db, "playlistItems", "readonly", (store) => store.getAll());
  }

  /**
   * 缓存播放列表
   */
  async cachePlaylists(db: IDBDatabase, playlists: any[]): Promise<void> {
    return this.performTransaction(db, "playlists", "readwrite", (store) => {
      playlists.forEach(playlist => store.put(playlist));
    });
  }

  /**
   * 缓存播放列表项
   */
  async cachePlaylistItems(db: IDBDatabase, uriToPlaylistItems: any): Promise<void> {
    return this.performTransaction(db, "playlistItems", "readwrite", (store) => {
      Object.entries(uriToPlaylistItems).forEach(([uri, items]) => {
        store.put({ uri, items });
      });
    });
  }

  /**
   * 清除缓存的播放列表
   */
  async clearCachedPlaylists(db: IDBDatabase): Promise<void> {
    return this.performTransaction(db, "playlists", "readwrite", (store) => store.clear());
  }

  /**
   * 清除缓存的播放列表项
   */
  async clearCachedPlaylistItems(db: IDBDatabase): Promise<void> {
    return this.performTransaction(db, "playlistItems", "readwrite", (store) => store.clear());
  }

  async getCachedPlaylistMetadata(db: IDBDatabase, uri: string): Promise<any> {
    return this.performTransaction(db, "playlistMetadata", "readonly", (store) => store.get(uri));
  }

  async cachePlaylistMetadata(db: IDBDatabase, metadata: any): Promise<void> {
    return this.performTransaction(db, "playlistMetadata", "readwrite", (store) => {
      store.put(metadata);
    });
  }

  /**
   * 执行数据库事务的通用方法
   */
  private async performTransaction<T>(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T> | void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      
      const request = operation(store);
      
      if (request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Transaction failed: ${request.error}`));
      } else {
        // 对于没有返回请求的操作（如批量插入）
        transaction.oncomplete = () => resolve(undefined as any);
        transaction.onerror = () => reject(new Error(`Transaction failed: ${transaction.error}`));
      }
    });
  }
}

// 导出单例实例
export const cacheService = new CacheService();