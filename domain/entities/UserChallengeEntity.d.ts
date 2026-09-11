import { Document, Types } from "mongoose";

export interface UserChallengeEntity extends Document {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    challengeId: Types.ObjectId;
    joinedAt: Date;
    completedDays: number[];
    earnedPoints: number;
    status: 'in_progress' | 'completed' | 'abandoned';
    completedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
