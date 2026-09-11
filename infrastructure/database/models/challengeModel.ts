import { Schema, model } from 'mongoose';
import { ChallengeEntity } from '@/domain/entities/ChallengeEntity';

const challengeTaskSchema = new Schema({
    dayNumber: { type: Number, required: true },
    taskType: {
        type: String,
        required: true,
        enum: ['workout', 'nutrition', 'hydration', 'mindset'],
    },
    title: { type: String, required: true },
    description: { type: String, required: false },
    workoutId: { type: Schema.Types.ObjectId, ref: 'Workout', required: false },
    mealId: { type: Schema.Types.ObjectId, ref: 'Meal', required: false },
    targetPoints: { type: Number, required: true, default: 20 },
}, { _id: false });

export const challengeSchema = new Schema<ChallengeEntity>({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    bannerImage: {
        type: String,
        required: true,
    },
    accessType: {
        type: String,
        required: true,
        enum: ['free', 'premium'],
        default: 'free',
    },
    categories: [{
        type: String,
        enum: ['workout', 'nutrition', 'hydration', 'mindset'],
    }],
    durationDays: {
        type: Number,
        required: true,
    },
    period: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: false,
    },
    challengeType: {
        type: String,
        required: true,
        enum: ['type1_system_daily_tasks', 'type2_coach_custom_tasks'],
        default: 'type1_system_daily_tasks',
    },
    dailyTasks: [challengeTaskSchema],
    participantsCount: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });

const Challenge = model<ChallengeEntity>('Challenge', challengeSchema);

export default Challenge;
