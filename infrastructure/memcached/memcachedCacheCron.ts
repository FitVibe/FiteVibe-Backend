import cron from 'node-cron';
import { flushCache } from './memcachedClient';

export function startMemcachedCron(): void {
    // Schedule daily midnight cron (00:00 UTC) to clear expired daily measures
    cron.schedule('0 0 * * *', async () => {
        console.log(`[Memcached Cron] Midnight UTC triggered — Flushing daily measures cache...`);
        await flushCache();
    });
    console.log('[Memcached Cron] Midnight cache invalidation cron started.');
}
