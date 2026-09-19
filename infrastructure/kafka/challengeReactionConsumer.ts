import { kafka, TOPICS } from './kafkaClient';
import { delCache } from '../memcached/memcachedClient';
import { challengeCommunityRepository, notificationService } from '@/app/services';

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

                // 3. Notification Action: Persist in DB and send FCM push notification to Post Author
                const authorId = ((post.userId as any)?._id || post.userId).toString();
                if (authorId !== actorUserId) {
                    await notificationService.notifyPostReaction(
                        authorId,
                        actorUserId,
                        postId.toString(),
                        post.challengeId ? post.challengeId.toString() : '',
                        reactionType
                    );
                    console.log(`[Kafka Consumer] ✅ Notification saved to DB and FCM dispatched for author ${authorId}`);
                }
            } catch (err) {
                console.error('[Kafka Consumer] Error processing reaction message:', err);
            }
        },
    });
}
