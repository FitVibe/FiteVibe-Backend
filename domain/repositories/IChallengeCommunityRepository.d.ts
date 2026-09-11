import { ChallengePostEntity, ChallengePostCommentEntity, ChallengePostReactionEntity } from "@/domain/entities/ChallengeCommunityEntity";
import { Types } from "mongoose";

export interface IChallengeCommunityRepository {
    createPost(post: Partial<ChallengePostEntity>): Promise<ChallengePostEntity>;
    getChallengePosts(challengeId: string | Types.ObjectId, skip?: number, limit?: number): Promise<ChallengePostEntity[]>;
    getPostById(postId: string | Types.ObjectId): Promise<ChallengePostEntity | null>;
    
    addComment(comment: Partial<ChallengePostCommentEntity>): Promise<ChallengePostCommentEntity>;
    getPostComments(postId: string | Types.ObjectId): Promise<ChallengePostCommentEntity[]>;
    
    toggleReaction(postId: string | Types.ObjectId, userId: string | Types.ObjectId, reactionType: string): Promise<{ reacted: boolean; reactionType?: string }>;
    getUserReaction(postId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<string | null>;
    
    incrementReactionsCount(postId: string | Types.ObjectId, delta: number): Promise<void>;
    incrementCommentsCount(postId: string | Types.ObjectId, delta: number): Promise<void>;
}
