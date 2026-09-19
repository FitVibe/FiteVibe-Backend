import { IChallengeCommunityRepository } from "@/domain/repositories/IChallengeCommunityRepository";
import { getCache, setCache, delCache } from "@/infrastructure/memcached/memcachedClient";
import { publishReactionEvent } from "@/infrastructure/kafka/challengeReactionProducer";
import NotificationService from "./NotificationService";

export default class ChallengeCommunityService {
    private communityRepo: IChallengeCommunityRepository;
    private notificationService?: NotificationService;

    constructor(
        communityRepo: IChallengeCommunityRepository,
        notificationService?: NotificationService
    ) {
        this.communityRepo = communityRepo;
        this.notificationService = notificationService;
    }

    /**
     * Creates a new community post inside a challenge.
     */
    public async createPost(userId: string, challengeId: string, content: string, imageUrl?: string) {
        const post = await this.communityRepo.createPost({
            userId: userId as any,
            challengeId: challengeId as any,
            content,
            image: imageUrl || undefined,
            reactionsCount: 0,
            commentsCount: 0,
        });

        // Invalidate feed cache for this challenge
        await delCache(`challenge:posts:${challengeId}`);
        return post;
    }

    /**
     * Fetches community posts for a challenge.
     */
    public async getChallengePosts(challengeId: string, userId: string, skip: number = 0, limit: number = 20) {
        const cacheKey = `challenge:posts:${challengeId}:${skip}:${limit}`;
        let posts = await getCache<any[]>(cacheKey);

        if (!posts) {
            const rawPosts = await this.communityRepo.getChallengePosts(challengeId, skip, limit);
            posts = await Promise.all(
                rawPosts.map(async (p) => {
                    const userReaction = await this.communityRepo.getUserReaction(p._id!, userId);
                    return {
                        _id: p._id,
                        challengeId: p.challengeId,
                        author: {
                            _id: (p.userId as any)?._id || p.userId,
                            username: (p.userId as any)?.username || 'User',
                            fullName: `${(p.userId as any)?.first_name || ''} ${(p.userId as any)?.last_name || ''}`.trim(),
                            profileImage: (p.userId as any)?.profile_image || '',
                        },
                        content: p.content,
                        image: p.image || null,
                        reactionsCount: p.reactionsCount || 0,
                        commentsCount: p.commentsCount || 0,
                        userReaction: userReaction || null,
                        createdAt: p.createdAt,
                    };
                })
            );
            await setCache(cacheKey, posts, 120); // 2 minutes cache
        }

        return posts;
    }

    /**
     * Adds a comment to a community post.
     */
    public async addComment(userId: string, postId: string, content: string) {
        const comment = await this.communityRepo.addComment({
            postId: postId as any,
            userId: userId as any,
            content,
        });

        const post = await this.communityRepo.getPostById(postId);
        if (post) {
            await delCache(`challenge:posts:${post.challengeId}`);

            // Notify post author (DB save + FCM push)
            if (this.notificationService) {
                const authorId = ((post.userId as any)?._id || post.userId).toString();
                await this.notificationService.notifyPostComment(
                    authorId,
                    userId,
                    postId,
                    post.challengeId.toString(),
                    content
                );
            }
        }

        return comment;
    }

    /**
     * Fetches comments for a post.
     */
    public async getPostComments(postId: string) {
        return await this.communityRepo.getPostComments(postId);
    }

    /**
     * Toggles a reaction (like/fire/clap/muscle) on a post.
     * Streams reaction event to Kafka for high-scale asynchronous processing.
     */
    public async toggleReaction(userId: string, postId: string, reactionType: string = 'like') {
        const result = await this.communityRepo.toggleReaction(postId, userId, reactionType);
        
        // Stream event asynchronously via Kafka
        await publishReactionEvent(postId, userId, reactionType);

        const post = await this.communityRepo.getPostById(postId);
        if (post) {
            await delCache(`challenge:posts:${post.challengeId}`);
        }

        return result;
    }
}
