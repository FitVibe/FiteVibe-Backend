import { Schema, model } from 'mongoose';
import { UserChallengeEntity } from '@/domain/entities/UserChallengeEntity';

export const userChallengeSchema = new Schema<UserChallengeEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    challengeId: {
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
    },
    joinedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    completedDays: [{
        type: Number,
    }],
    earnedPoints: {
        type: Number,
        required: true,
        default: 0,
    },
    status: {
        type: String,
        required: true,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress',
    },
    completedAt: {
        type: Date,
        required: false,
    },
}, { timestamps: true });

// Prevent duplicate challenge enrollments per user
userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

const UserChallenge = model<UserChallengeEntity>('UserChallenge', userChallengeSchema);

export default UserChallenge;
