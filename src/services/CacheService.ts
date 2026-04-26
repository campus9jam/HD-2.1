import Dexie, { Table } from 'dexie';

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // In milliseconds
}

export interface SyncAction {
  id?: number;
  type: 'update_profile' | 'place_order' | 'wishlist_sync';
  payload: any;
  timestamp: number;
}

class DarajaDB extends Dexie {
  cache!: Table<CacheEntry>;
  syncQueue!: Table<SyncAction>;

  constructor() {
    super('DarajaSovereignCache');
    this.version(2).stores({
      cache: 'key, timestamp',
      syncQueue: '++id, type, timestamp'
    });
  }
}

export const db_local = new DarajaDB();

/**
 * CacheService: Orchestrates the persistence of high-value data nodes
 * to the local storage, reducing neural latency and API cost.
 */
export const CacheService = {
  /**
   * Retrieves a cached value if it exists and is still valid.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await db_local.cache.get(key);
      if (!entry) return null;

      const isExpired = Date.now() > entry.timestamp + entry.ttl;
      if (isExpired) {
        await db_local.cache.delete(key);
        return null;
      }

      return entry.data as T;
    } catch (e) {
      console.warn(`[Cache] Get failed for ${key}:`, e);
      return null;
    }
  },

  /**
   * Sets a value in the local persistent cache.
   */
  async set(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    try {
      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000
      };
      await db_local.cache.put(entry);
    } catch (e) {
      console.warn(`[Cache] Set failed for ${key}:`, e);
    }
  },

  /**
   * Multi-set for bulk caching
   */
  async setMany(entries: { key: string, data: any }[], ttlMinutes: number = 60): Promise<void> {
    const ttl = ttlMinutes * 60 * 1000;
    const now = Date.now();
    const cacheEntries: CacheEntry[] = entries.map(e => ({
      key: e.key,
      data: e.data,
      timestamp: now,
      ttl
    }));
    await db_local.cache.bulkPut(cacheEntries);
  },

  /**
   * Clears a specific cache node.
   */
  async delete(key: string): Promise<void> {
    await db_local.cache.delete(key);
  },

  /**
   * Purges all expired cache entries.
   */
  async purgeExpired(): Promise<void> {
    const now = Date.now();
    await db_local.cache.filter(entry => now > entry.timestamp + entry.ttl).delete();
  }
};
