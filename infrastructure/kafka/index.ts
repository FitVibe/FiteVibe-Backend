import { startWaterReminderProducer } from './waterReminderProducer';
import { startWaterReminderConsumer } from './waterReminderConsumer';
import { startWorkoutReminderProducer } from './workoutReminderProducer';
import { startWorkoutReminderConsumer } from './workoutReminderConsumer';
import { startMealReminderProducer } from './mealReminderProducer';
import { startMealReminderConsumer } from './mealReminderConsumer';

export * from './kafkaClient';
export * from './waterReminderProducer';
export * from './waterReminderConsumer';
export * from './workoutReminderProducer';
export * from './workoutReminderConsumer';
export * from './mealReminderProducer';
export * from './mealReminderConsumer';

/**
 * Initializes and starts all Kafka producer and consumer pipelines with graceful connection handling.
 */
export async function startKafkaPipelines(): Promise<void> {
    // Water reminder pipeline
    try {
        await startWaterReminderProducer();
        await startWaterReminderConsumer();
        console.log('[Kafka] Water reminder pipeline started.');
    } catch (err: any) {
        console.warn('[Kafka] Water reminder pipeline skipped (Kafka broker not reachable at localhost:9092)');
    }

    // Workout reminder pipeline
    try {
        await startWorkoutReminderProducer();
        await startWorkoutReminderConsumer();
        console.log('[Kafka] Workout reminder pipeline started.');
    } catch (err: any) {
        console.warn('[Kafka] Workout reminder pipeline skipped (Kafka broker not reachable at localhost:9092)');
    }

    // Meal reminder pipeline
    try {
        await startMealReminderProducer();
        await startMealReminderConsumer();
        console.log('[Kafka] Meal reminder pipeline started.');
    } catch (err: any) {
        console.warn('[Kafka] Meal reminder pipeline skipped (Kafka broker not reachable at localhost:9092)');
    }
}
