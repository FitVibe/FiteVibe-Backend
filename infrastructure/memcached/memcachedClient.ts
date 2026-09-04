import Memcached from 'memcached';
import 'dotenv/config';

const host = process.env.MEMCACHED_HOST || 'localhost';
const port = process.env.MEMCACHED_PORT || '11211';
const serverLocation = `${host}:${port}`;

export const memcached = new Memcached(serverLocation, {
    retries: 2,
    retry: 1000,
    remove: true,
    failOverServers: [],
});

memcached.on('failure', (details) => {
    console.warn(`[Memcached] Server failure: ${details.server}`);
});

/**
 * Gets a cached item by key.
 */
export function getCache<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
        memcached.get(key, (err, data) => {
            if (err || !data) {
                resolve(null);
            } else {
                try {
                    resolve(typeof data === 'string' ? JSON.parse(data) : data);
                } catch {
                    resolve(data as any);
                }
            }
        });
    });
}

/**
 * Sets a cache item with TTL (in seconds).
 */
export function setCache(key: string, value: any, lifetimeSeconds: number = 86400): Promise<boolean> {
    return new Promise((resolve) => {
        const serialized = JSON.stringify(value);
        memcached.set(key, serialized, lifetimeSeconds, (err) => {
            if (err) {
                console.warn(`[Memcached] Failed to set cache key "${key}":`, err.message);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * Deletes a cache item by key.
 */
export function delCache(key: string): Promise<boolean> {
    return new Promise((resolve) => {
        memcached.del(key, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * Flushes all cached items.
 */
export function flushCache(): Promise<boolean> {
    return new Promise((resolve) => {
        memcached.flush((err) => {
            if (err) {
                console.warn('[Memcached] Flush failed:', err.message);
                resolve(false);
            } else {
                console.log('[Memcached] Flushed all cache entries.');
                resolve(true);
            }
        });
    });
}

/**
 * Helper to invalidate daily measures cache for a specific user.
 */
export async function clearUserDailyMeasures(userId: string): Promise<void> {
    const now = new Date();
    const todayString = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    const cacheKey = `daily_measures:${userId}:${todayString}`;
    await delCache(cacheKey);
    console.log(`[Memcached] Invalidated cache key "${cacheKey}"`);
}
