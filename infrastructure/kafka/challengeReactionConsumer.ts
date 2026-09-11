import { kafka, TOPICS } from './kafkaClient';
import { sendPushNotification } from '@/infrastructure/firebase/firebaseAdmin';
import { delCache } from '../memcached/memcachedClient';
import { userRepository, challengeCommunityRepository } from '@/app/services';

const consumer = kafka.consumer({ groupId: 'fitvibe-challenge-reactions-group' });

export async function startChallengeReactionConsumer(): Promise<void> {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.CHALLENGE_REACTIONS, fromBeginning: false });
    console.log('[Kafka Consumer] Challenge reaction consumer started.');

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;
            try {
                const data = JSON.parse(message.value.toString());
                const { postId, userId: actorUserId, reactionType } = data;

                console.log(`[Kafka Consumer] Reaction event received: Post ${postId}, Actor ${actorUserId}, Type ${reactionType}`);

                // 1. Fetch Post via Repository to find the post author and challenge ID
                const post = await challengeCommunityRepository.getPostById(postId);
                if (!post) return;

                // 2. Cache Invalidation Action: Flush challenge feed cache in Memcached
                if (post.challengeId) {
                    await delCache(`challenge:posts:${post.challengeId}`);
                }

                // 3. Push Notification Action: Notify Post Author via User Repository
                const authorId = ((post.userId as any)?._id || post.userId).toString();
                if (authorId !== actorUserId) {
                    const [authorUser, actorUser] = await Promise.all([
                        userRepository.findById(authorId),
                        userRepository.findById(actorUserId),
                    ]);

                    if (authorUser && authorUser.fcm_device_token) {
                        const actorName = actorUser?.first_name || actorUser?.username || 'أحد المستخدمين';
                        const emojiMap: Record<string, string> = {
                            like: '❤️',
                            fire: '🔥',
                            clap: '👏',
                            muscle: '💪',
                        };
                        const emoji = emojiMap[reactionType] || '❤️';

                        const title = 'تفاعل جديد على منشورك!';
                        const body = `${actorName} تفاعل مع منشورك بـ ${emoji}`;

                        const sent = await sendPushNotification(
                            authorUser.fcm_device_token,
                            title,
                            body,
                            { type: 'post_reaction', postId: postId.toString(), challengeId: post.challengeId.toString() }
                        );

                        if (sent) {
                            console.log(`[Kafka Consumer] ✅ FCM push notification sent to author ${authorId}`);
                        } else {
                            console.warn(`[Kafka Consumer] ⚠️ FCM push notification failed for author ${authorId}`);
                        }
                    }
                }
            } catch (err) {
                console.error('[Kafka Consumer] Error processing reaction message:', err);
            }
        },
    });
}
