import cron from 'node-cron';
import { kafka, TOPICS } from './kafkaClient';

const producer = kafka.producer();

export async function startMealReminderProducer(): Promise<void> {
    await producer.connect();
    console.log('[Kafka Producer] Connected — Meal reminder producer started.');

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
        waitForLeaders: true,
        topics: [{ topic: TOPICS.MEAL_REMINDERS, numPartitions: 1, replicationFactor: 1 }],
    }).catch(() => { /* topic may already exist */ });
    await admin.disconnect();

    // Helper to send tick for a meal type
    const sendMealTick = async (mealType: string) => {
        try {
            await producer.send({
                topic: TOPICS.MEAL_REMINDERS,
                messages: [
                    {
                        key: mealType,
                        value: JSON.stringify({
                            meal_type: mealType,
                            triggeredAt: new Date().toISOString(),
                        }),
                    },
                ],
            });
            console.log(`[Kafka Producer] Meal reminder tick (${mealType}) sent at ${new Date().toISOString()}`);
        } catch (err) {
            console.error(`[Kafka Producer] Failed to send ${mealType} reminder tick:`, err);
        }
    };

    // 1. Breakfast Notification at 07:00 UTC (08:00 UTC+1)
    cron.schedule('0 7 * * *', async () => {
        await sendMealTick('Breakfast');
    });

    // 2. Lunch Notification at 11:00 UTC (12:00 UTC+1)
    cron.schedule('0 11 * * *', async () => {
        await sendMealTick('Lunch');
    });

    // 3. Snacks Notification at 16:00 UTC (16:00 UTC+1)
    cron.schedule('0 15 * * *', async () => {
        await sendMealTick('Snacks');
    });

    // 4. Dinner Notification at 19:00 UTC (20:00 UTC+1)
    cron.schedule('0 19 * * *', async () => {
        await sendMealTick('Dinner');
    });
}
