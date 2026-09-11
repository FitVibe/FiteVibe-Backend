import { Schema, model } from 'mongoose';
import { ChallengePostEntity, ChallengePostCommentEntity, ChallengePostReactionEntity } from '@/domain/entities/ChallengeCommunityEntity';

export const challengePostSchema = new Schema<ChallengePostEntity>({
    challengeId: {
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false,
    },
    reactionsCount: {
        type: Number,
        required: true,
        default: 0,
    },
    commentsCount: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });

export const challengePostCommentSchema = new Schema<ChallengePostCommentEntity>({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'ChallengePost',
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
}, { timestamps: true });

export const challengePostReactionSchema = new Schema<ChallengePostReactionEntity>({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'ChallengePost',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reactionType: {
        type: String,
        required: true,
        enum: ['like', 'fire', 'clap', 'muscle'],
        default: 'like',
    },
}, { timestamps: true });

challengePostReactionSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const ChallengePost = model<ChallengePostEntity>('ChallengePost', challengePostSchema);
export const ChallengePostComment = model<ChallengePostCommentEntity>('ChallengePostComment', challengePostCommentSchema);
export const ChallengePostReaction = model<ChallengePostReactionEntity>('ChallengePostReaction', challengePostReactionSchema);
