import cron from 'node-cron';
import { kafka, TOPICS } from './kafkaClient';

const producer = kafka.producer();

export async function startWaterReminderProducer(): Promise<void> {
    await producer.connect();
    console.log('[Kafka Producer] Connected — Water reminder producer started.');

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
        waitForLeaders: true,
        topics: [{ topic: TOPICS.WATER_REMINDERS, numPartitions: 1, replicationFactor: 1 }],
    }).catch(() => { /* topic may already exist */ });
    await admin.disconnect();

    // Tick every minute — consumer decides who gets notified
    cron.schedule('* * * * *', async () => {
        try {
            await producer.send({
                topic: TOPICS.WATER_REMINDERS,
                messages: [
                    {
                        key: 'tick',
                        value: JSON.stringify({ triggeredAt: new Date().toISOString() }),
                    },
                ],
            });
            console.log(`[Kafka Producer] Water reminder tick sent at ${new Date().toISOString()}`);
        } catch (err) {
            console.error('[Kafka Producer] Failed to send tick:', err);
        }
    });
}
