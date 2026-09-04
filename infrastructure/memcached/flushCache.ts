import { flushCache, memcached } from './memcachedClient';

async function run() {
    console.log('[Memcached] Flushing all cache keys...');
    const success = await flushCache();
    if (success) {
        console.log('[Memcached] Successfully cleared all cache entries!');
    } else {
        console.error('[Memcached] Failed to clear cache or server offline.');
    }
    memcached.end();
    process.exit(0);
}

run();
