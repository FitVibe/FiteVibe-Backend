import { Document, Types } from "mongoose";

export interface ChallengeTask {
    dayNumber: number;
    taskType: 'workout' | 'nutrition' | 'hydration' | 'mindset';
    title: string;
    description?: string;
    workoutId?: Types.ObjectId;
    mealId?: Types.ObjectId;
    targetPoints: number;
}

export interface ChallengeEntity extends Document {
    _id?: Types.ObjectId;
    createdBy: Types.ObjectId;
    title: string;
    description: string;
    image: string;
    bannerImage: string;
    accessType: 'free' | 'premium';
    categories: Array<'workout' | 'nutrition' | 'hydration' | 'mindset'>;
    durationDays: number;
    period: {
        startDate: Date;
        endDate: Date;
    };
    isPublished: boolean;
    challengeType: 'type1_system_daily_tasks' | 'type2_coach_custom_tasks';
    dailyTasks?: ChallengeTask[];
    participantsCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}
