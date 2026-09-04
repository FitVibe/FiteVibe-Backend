import { startMemcachedCron } from '@/infrastructure/memcached/memcachedCacheCron';

export * from '@/infrastructure/memcached/memcachedCacheCron';

/**
 * Initializes and starts all background system cron jobs.
 */
export function startCronJobs(): void {
    console.log('[Cron Manager] Initializing system cron jobs...');
    
    // Start Memcached midnight cache invalidation cron
    startMemcachedCron();
}
