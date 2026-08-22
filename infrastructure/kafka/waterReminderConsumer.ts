import { kafka, TOPICS } from './kafkaClient';
import UserSettings from '@/infrastructure/database/models/userSettingsModel';
import User from '@/infrastructure/database/models/userModel';
import { sendPushNotification } from '@/infrastructure/firebase/firebaseAdmin';

const consumer = kafka.consumer({ groupId: 'water-reminder-group' });

export async function startWaterReminderConsumer(): Promise<void> {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.WATER_REMINDERS, fromBeginning: false });
    console.log('[Kafka Consumer] Water reminder consumer started.');

    await consumer.run({
        eachMessage: async ({ message }) => {
            const now = new Date();
            console.log(`[Kafka Consumer] Processing tick at ${now.toISOString()}`);

            try {
                // Find all user settings where water reminder is due
                const dueSettings = await UserSettings.find({
                    'water.is_active': true,
                    'water.next_reminder_at': { $lte: now },
                });

                console.log(`[Kafka Consumer] Found ${dueSettings.length} users due for a water reminder.`);

                for (const setting of dueSettings) {
                    // Always advance next_reminder_at first, regardless of token availability
                    const nextReminder = new Date(now.getTime() + setting.water.reminder_interval_minutes * 60 * 1000);
                    await UserSettings.findByIdAndUpdate(setting._id, {
                        $set: { 'water.next_reminder_at': nextReminder },
                    });

                    // Get the user's FCM token
                    const user = await User.findById(setting.userId).select('fcm_device_token first_name');
                    if (!user || !user.fcm_device_token) {
                        console.warn(`[Kafka Consumer] No FCM token for user ${setting.userId} — skipping push, next reminder at ${nextReminder.toISOString()}`);
                        continue;
                    }

                    // Send FCM push notification
                    const sent = await sendPushNotification(
                        user.fcm_device_token,
                        '💧 وقت شرب الماء!',
                        `مرحباً ${user.first_name}، لا تنسَ شرب كوب ماء للحفاظ على طاقتك 💪`,
                        { type: 'water_reminder' }
                    );

                    if (sent) {
                        console.log(`[Kafka Consumer] ✅ Notified user ${setting.userId}, next reminder at ${nextReminder.toISOString()}`);
                    } else {
                        console.warn(`[Kafka Consumer] ⚠️ FCM failed for user ${setting.userId}, next reminder still advanced to ${nextReminder.toISOString()}`);
                    }
                }
            } catch (err) {
                console.error('[Kafka Consumer] Error processing water reminders:', err);
            }
        },
    });
}

