import { kafka, TOPICS } from './kafkaClient';

const producer = kafka.producer();
let isConnected = false;

export async function startChallengeReactionProducer(): Promise<void> {
    if (isConnected) return;
    await producer.connect();
    isConnected = true;
    console.log('[Kafka Producer] Connected — Challenge Reaction producer active.');

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
        waitForLeaders: true,
        topics: [{ topic: TOPICS.CHALLENGE_REACTIONS, numPartitions: 1, replicationFactor: 1 }],
    }).catch(() => { /* topic exists */ });
    await admin.disconnect();
}

export async function publishReactionEvent(postId: string, userId: string, reactionType: string): Promise<void> {
    try {
        if (!isConnected) {
            await startChallengeReactionProducer();
        }
        await producer.send({
            topic: TOPICS.CHALLENGE_REACTIONS,
            messages: [
                {
                    key: postId,
                    value: JSON.stringify({
                        postId,
                        userId,
                        reactionType,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
    } catch (err: any) {
        console.warn('[Kafka Producer] Failed to stream reaction event:', err.message);
    }
}
