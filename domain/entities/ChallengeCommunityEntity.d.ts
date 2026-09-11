import { Document, Types } from "mongoose";

export interface ChallengePostEntity extends Document {
    _id?: Types.ObjectId;
    challengeId: Types.ObjectId;
    userId: Types.ObjectId;
    content: string;
    image?: string;
    reactionsCount: number;
    commentsCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ChallengePostCommentEntity extends Document {
    _id?: Types.ObjectId;
    postId: Types.ObjectId;
    userId: Types.ObjectId;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ChallengePostReactionEntity extends Document {
    _id?: Types.ObjectId;
    postId: Types.ObjectId;
    userId: Types.ObjectId;
    reactionType: 'like' | 'fire' | 'clap' | 'muscle';
    createdAt?: Date;
}
