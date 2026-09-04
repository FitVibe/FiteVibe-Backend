import { kafka, TOPICS } from './kafkaClient';
import User from '@/infrastructure/database/models/userModel';
import DailyMeals from '@/infrastructure/database/models/dailyMealsModel';
import { sendPushNotification } from '@/infrastructure/firebase/firebaseAdmin';

const consumer = kafka.consumer({ groupId: 'meal-reminder-group' });

export async function startMealReminderConsumer(): Promise<void> {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.MEAL_REMINDERS, fromBeginning: false });
    console.log('[Kafka Consumer] Meal reminder consumer started.');

    await consumer.run({
        eachMessage: async ({ message }) => {
            const now = new Date();
            let payload: { meal_type: string; triggeredAt: string };
            try {
                payload = JSON.parse(message.value?.toString() || '{}');
            } catch {
                return;
            }

            const mealType = payload.meal_type || 'Breakfast';
            console.log(`[Kafka Consumer] Processing ${mealType} meal tick at ${now.toISOString()}`);

            try {
                const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);

                // Fetch all users with an FCM device token
                const users = await User.find({ fcm_device_token: { $exists: true, $ne: null } }).select('_id first_name fcm_device_token');

                console.log(`[Kafka Consumer] Found ${users.length} users registered for meal notifications.`);

                for (const user of users) {
                    // Check if user has a daily meals plan today (or default free plan)
                    let plan = await DailyMeals.findOne({
                        userId: user._id,
                        date: { $gte: todayMidnight, $lt: tomorrowMidnight },
                    }).populate('meals.mealId');

                    if (!plan) {
                        plan = await DailyMeals.findOne({
                            $or: [{ userId: { $exists: false } }, { userId: null }],
                            date: { $gte: todayMidnight, $lt: tomorrowMidnight },
                        }).populate('meals.mealId');
                    }

                    if (!plan) {
                        plan = await DailyMeals.findOne({ isFree: true })
                            .sort({ date: -1 })
                            .populate('meals.mealId');
                    }

                    if (!plan) continue;

                    // Find meal matching the mealType
                    const mealItem = plan.meals.find(m => m.meal_type.toLowerCase() === mealType.toLowerCase());
                    if (!mealItem) continue;

                    const mealObj: any = mealItem.mealId || {};
                    const mealName = mealObj.name || `${mealType} Meal`;
                    const calories = mealObj.calories || ((mealObj.carbs || 0) * 4 + (mealObj.protein || 0) * 4 + (mealObj.fats || 0) * 9);

                    let title = '🥗 Meal Time!';
                    if (mealType === 'Breakfast') title = '🥣 Breakfast Time! / وقت الإفطار!';
                    else if (mealType === 'Lunch') title = '🍛 Lunch Time! / وقت الغداء!';
                    else if (mealType === 'Snacks') title = '🥗 Snack Time! / وقت الوجبة الخفيفة!';
                    else if (mealType === 'Dinner') title = '🍽️ Dinner Time! / وقت العشاء!';

                    const body = `Hi ${user.first_name || 'Champion'}! Time for your ${mealType}: "${mealName}" (${calories} kcal). Keep your nutrition on point! 💪`;

                    const sent = await sendPushNotification(
                        user.fcm_device_token!,
                        title,
                        body,
                        { type: 'meal_reminder', mealType, planId: plan._id.toString() }
                    );

                    if (sent) {
                        console.log(`[Kafka Consumer] ✅ ${mealType} push sent to user ${user._id}`);
                    } else {
                        console.warn(`[Kafka Consumer] ⚠️ FCM push failed for user ${user._id}`);
                    }
                }
            } catch (err) {
                console.error('[Kafka Consumer] Error sending meal notifications:', err);
            }
        },
    });
}
