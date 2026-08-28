import cron from 'node-cron';
import { kafka, TOPICS } from './kafkaClient';

const producer = kafka.producer();

export async function startWorkoutReminderProducer(): Promise<void> {
    await producer.connect();
    console.log('[Kafka Producer] Connected — Workout reminder producer started.');

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
        waitForLeaders: true,
        topics: [{ topic: TOPICS.WORKOUT_REMINDERS, numPartitions: 1, replicationFactor: 1 }],
    }).catch(() => { /* topic may already exist */ });
    await admin.disconnect();

    // Cron schedule: Trigger every day at 08:00 AM (also tick every hour to ensure reminders are sent)
    cron.schedule('0 8 * * *', async () => {
        try {
            await producer.send({
                topic: TOPICS.WORKOUT_REMINDERS,
                messages: [
                    {
                        key: 'daily-workout-tick',
                        value: JSON.stringify({ triggeredAt: new Date().toISOString() }),
                    },
                ],
            });
            console.log(`[Kafka Producer] Daily workout reminder tick sent at ${new Date().toISOString()}`);
        } catch (err) {
            console.error('[Kafka Producer] Failed to send workout reminder tick:', err);
        }
    });
}
