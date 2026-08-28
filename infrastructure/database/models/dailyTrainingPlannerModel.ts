import { Schema, model } from 'mongoose';
import { DailyTrainingPlannerEntity } from '@/domain/entities/DailyTrainingPlannerEntity';

const plannerExerciseSchema = new Schema({
    workoutId: {
        type: Schema.Types.ObjectId,
        ref: 'Workout',
        required: true,
    },
    duration: {
        type: Number,
        required: true,
        default: 0,
    },
    repeatition: {
        type: Number,
        required: true,
        default: 0,
    },
    sets: {
        type: Number,
        required: true,
        default: 1,
    },
    kilos: {
        type: Number,
        required: true,
        default: 0,
    },
}, { _id: false });

export const dailyTrainingPlannerSchema = new Schema<DailyTrainingPlannerEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    date: {
        type: Date,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    isFree: {
        type: Boolean,
        required: true,
        default: true,
    },
    exercises: [plannerExerciseSchema],
    isCompleted: {
        type: Boolean,
        required: true,
        default: false,
    },
}, { timestamps: true });

const DailyTrainingPlanner = model<DailyTrainingPlannerEntity>('DailyTrainingPlanner', dailyTrainingPlannerSchema);

export default DailyTrainingPlanner;
