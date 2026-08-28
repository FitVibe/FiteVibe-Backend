import { kafka, TOPICS } from './kafkaClient';
import User from '@/infrastructure/database/models/userModel';
import DailyTrainingPlanner from '@/infrastructure/database/models/dailyTrainingPlannerModel';
import { sendPushNotification } from '@/infrastructure/firebase/firebaseAdmin';

const consumer = kafka.consumer({ groupId: 'workout-reminder-group' });

export async function startWorkoutReminderConsumer(): Promise<void> {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.WORKOUT_REMINDERS, fromBeginning: false });
    console.log('[Kafka Consumer] Workout reminder consumer started.');

    await consumer.run({
        eachMessage: async ({ message }) => {
            const now = new Date();
            console.log(`[Kafka Consumer] Processing daily workout tick at ${now.toISOString()}`);

            try {
                const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);

                // Fetch all users with an FCM device token
                const users = await User.find({ fcm_device_token: { $exists: true, $ne: null } }).select('_id first_name fcm_device_token');

                console.log(`[Kafka Consumer] Found ${users.length} users registered for notifications.`);

                for (const user of users) {
                    // Check if user has a daily training planner today (or default free planner)
                    let planner = await DailyTrainingPlanner.findOne({
                        userId: user._id,
                        date: { $gte: todayMidnight, $lt: tomorrowMidnight },
                    });

                    if (!planner) {
                        planner = await DailyTrainingPlanner.findOne({
                            $or: [{ userId: { $exists: false } }, { userId: null }],
                            date: { $gte: todayMidnight, $lt: tomorrowMidnight },
                        });
                    }

                    if (!planner) {
                        planner = await DailyTrainingPlanner.findOne({ isFree: true }).sort({ date: -1 });
                    }

                    if (!planner) continue;

                    const title = '🏋️ workout of today!';
                    const body = `Hello ${user.first_name || 'Champion'}! Today's workout "${planner.name}" (${planner.duration} mins, ${planner.exercises?.length || 0} exercises) is ready. Let's crush it!`;

                    const sent = await sendPushNotification(
                        user.fcm_device_token!,
                        title,
                        body,
                        { type: 'daily_workout', plannerId: planner._id.toString() }
                    );

                    if (sent) {
                        console.log(`[Kafka Consumer] ✅ Daily workout push sent to user ${user._id}`);
                    } else {
                        console.warn(`[Kafka Consumer] ⚠️ FCM push failed for user ${user._id}`);
                    }
                }
            } catch (err) {
                console.error('[Kafka Consumer] Error sending daily workout reminders:', err);
            }
        },
    });
}
