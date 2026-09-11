import { Types } from "mongoose";
import { ChallengePost, ChallengePostComment, ChallengePostReaction } from "../models/challengeCommunityModel";
import { ChallengePostEntity, ChallengePostCommentEntity } from "@/domain/entities/ChallengeCommunityEntity";
import { IChallengeCommunityRepository } from "@/domain/repositories/IChallengeCommunityRepository";

export class MongoChallengeCommunityRepository implements IChallengeCommunityRepository {
    async createPost(post: Partial<ChallengePostEntity>): Promise<ChallengePostEntity> {
        const newPost = new ChallengePost(post);
        return await newPost.save();
    }

    async getChallengePosts(challengeId: string | Types.ObjectId, skip: number = 0, limit: number = 20): Promise<ChallengePostEntity[]> {
        return await ChallengePost.find({ challengeId: new Types.ObjectId(challengeId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username first_name last_name profile_image');
    }

    async getPostById(postId: string | Types.ObjectId): Promise<ChallengePostEntity | null> {
        return await ChallengePost.findById(postId).populate('userId', 'username first_name last_name profile_image');
    }

    async addComment(comment: Partial<ChallengePostCommentEntity>): Promise<ChallengePostCommentEntity> {
        const newComment = new ChallengePostComment(comment);
        const saved = await newComment.save();
        await this.incrementCommentsCount(comment.postId!, 1);
        return saved;
    }

    async getPostComments(postId: string | Types.ObjectId): Promise<ChallengePostCommentEntity[]> {
        return await ChallengePostComment.find({ postId: new Types.ObjectId(postId) })
            .sort({ createdAt: 1 })
            .populate('userId', 'username first_name last_name profile_image');
    }

    async toggleReaction(
        postId: string | Types.ObjectId,
        userId: string | Types.ObjectId,
        reactionType: string
    ): Promise<{ reacted: boolean; reactionType?: string }> {
        const pId = new Types.ObjectId(postId);
        const uId = new Types.ObjectId(userId);

        const existing = await ChallengePostReaction.findOne({ postId: pId, userId: uId });

        if (existing) {
            if (existing.reactionType === reactionType) {
                // Remove reaction if clicking same reaction type
                await ChallengePostReaction.deleteOne({ _id: existing._id });
                await this.incrementReactionsCount(postId, -1);
                return { reacted: false };
            } else {
                // Change reaction type
                existing.reactionType = reactionType as any;
                await existing.save();
                return { reacted: true, reactionType };
            }
        } else {
            // New reaction
            const newReaction = new ChallengePostReaction({
                postId: pId,
                userId: uId,
                reactionType,
            });
            await newReaction.save();
            await this.incrementReactionsCount(postId, 1);
            return { reacted: true, reactionType };
        }
    }

    async getUserReaction(postId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<string | null> {
        const reaction = await ChallengePostReaction.findOne({
            postId: new Types.ObjectId(postId),
            userId: new Types.ObjectId(userId),
        });
        return reaction ? reaction.reactionType : null;
    }

    async incrementReactionsCount(postId: string | Types.ObjectId, delta: number): Promise<void> {
        await ChallengePost.findByIdAndUpdate(postId, { $inc: { reactionsCount: delta } });
    }

    async incrementCommentsCount(postId: string | Types.ObjectId, delta: number): Promise<void> {
        await ChallengePost.findByIdAndUpdate(postId, { $inc: { commentsCount: delta } });
    }
}
